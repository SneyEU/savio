/**
 * État global de l'interface, sans bibliothèque : un petit store observable
 * branché sur React via useSyncExternalStore. La logique métier reste dans les services.
 */
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { withViewTransition } from '../components/fx/effects';
import type { LearnerProfile, SubjectEnrollment, SubjectId } from '../core/domain/types';
import type { ProgressSummary } from '../core/engine/learningEngine';
import { createServices, SETTINGS, type AppServices } from '../services/container';

export type Route = 'dashboard' | 'review' | 'assistant' | 'settings';
export type ThemeChoice = 'system' | 'light' | 'dark';

export interface AppState {
  status: 'loading' | 'ready' | 'error';
  error?: string;
  services?: AppServices;
  profile: LearnerProfile | null;
  subjects: SubjectEnrollment[];
  progress?: ProgressSummary;
  route: Route;
  theme: ThemeChoice;
  /** Change à chaque nouvelle séance de révision (permet d'enchaîner une séance bonus). */
  reviewNonce: number;
  /** Matière ciblée par la séance en cours (clic sur une planète), sinon toutes. */
  reviewSubject?: SubjectId;
}

let state: AppState = { status: 'loading', profile: null, subjects: [], route: 'dashboard', theme: 'system', reviewNonce: 0 };
const listeners = new Set<() => void>();

function setState(patch: Partial<AppState>): void {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function useApp<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => selector(state),
  );
}

export function services(): AppServices {
  if (!state.services) throw new Error('Services non initialisés');
  return state.services;
}

export function applyTheme(theme: ThemeChoice): void {
  document.documentElement.dataset.theme = theme;
}

let initPromise: Promise<void> | null = null;

export const actions = {
  /** Idempotent : le mode strict de React peut l'appeler deux fois. */
  init(): Promise<void> {
    initPromise ??= actions.boot();
    return initPromise;
  },

  async boot(): Promise<void> {
    try {
      const svc = await createServices();
      const theme = (await svc.repos.settings.get<ThemeChoice>(SETTINGS.theme)) ?? 'system';
      applyTheme(theme);
      setState({ services: svc, theme });
      await actions.refresh();
      setState({ status: 'ready' });
    } catch (error) {
      setState({ status: 'error', error: error instanceof Error ? error.message : String(error) });
    }
  },

  async refresh(): Promise<void> {
    const svc = services();
    const [profile, subjects, progress] = await Promise.all([svc.repos.profile.get(), svc.repos.subjects.list(), svc.engine.progress()]);
    setState({ profile, subjects, progress });
  },

  navigate(route: Route): void {
    if (route === state.route) return;
    // flushSync : React doit avoir peint le nouvel écran avant que la transition en prenne la capture.
    withViewTransition(() => flushSync(() => setState({ route })));
  },

  /** Démarre une nouvelle séance de révision, même si on est déjà sur l'écran de révision. */
  startReview(subjectId?: SubjectId): void {
    withViewTransition(() => flushSync(() => setState({ route: 'review', reviewNonce: state.reviewNonce + 1, reviewSubject: subjectId })));
  },

  async setTheme(theme: ThemeChoice): Promise<void> {
    applyTheme(theme);
    setState({ theme });
    await services().repos.settings.set(SETTINGS.theme, theme);
  },

  async wipeAll(): Promise<void> {
    await services().repos.wipeAll();
    applyTheme('system');
    setState({ theme: 'system', route: 'dashboard' });
    await actions.refresh();
  },
};
