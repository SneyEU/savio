/**
 * Composition de l'application : choisit les adaptateurs selon la plateforme
 * (Tauri → SQLite + HTTP natif ; navigateur → mémoire + fetch) et assemble les services.
 */
import { AiGateway, createProvider } from '../core/ai/gateway';
import { TutorEngine } from '../core/ai/tutor/tutorEngine';
import { DEFAULT_PROVIDER_CONFIG, type FetchLike, type Locality, type ProviderConfig } from '../core/ai/types';
import { LearningEngine } from '../core/engine/learningEngine';
import type { Clock, IdGenerator, Repositories } from '../core/ports';
import { createMemoryRepositories } from '../infrastructure/memory/memoryRepositories';
import { createSqliteRepositories } from '../infrastructure/sqlite/sqliteRepositories';

export const SETTINGS = {
  aiProvider: 'ai.provider',
  saveAiHistory: 'privacy.saveAiHistory',
  theme: 'ui.theme',
} as const;

export type Platform = 'tauri' | 'browser';

export interface AppServices {
  platform: Platform;
  repos: Repositories;
  engine: LearningEngine;
  gateway: AiGateway;
  tutor: TutorEngine;
  clock: Clock;
  ids: IdGenerator;
  fetchFn: FetchLike;
  /** Dernière destination des requêtes IA, pour l'affichage de confidentialité. */
  onAiRequest: (listener: (locality: Locality, provider: string) => void) => () => void;
  saveExport(fileName: string, json: string): Promise<string>;
}

export const isTauri = (): boolean => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

const systemClock: Clock = { now: () => new Date() };
const uuidIds: IdGenerator = { next: () => crypto.randomUUID() };

function defaultProviderConfig(): ProviderConfig {
  const env = import.meta.env;
  if (env.VITE_DEFAULT_AI_PROVIDER === 'offline') return { kind: 'offline' };
  if (DEFAULT_PROVIDER_CONFIG.kind !== 'ollama') return DEFAULT_PROVIDER_CONFIG;
  return {
    kind: 'ollama',
    baseUrl: env.VITE_OLLAMA_URL || DEFAULT_PROVIDER_CONFIG.baseUrl,
    model: env.VITE_OLLAMA_MODEL || DEFAULT_PROVIDER_CONFIG.model,
  };
}

async function openPlatform(): Promise<{ platform: Platform; repos: Repositories; fetchFn: FetchLike; saveExport: AppServices['saveExport'] }> {
  if (isTauri()) {
    const [{ default: Database }, http, core] = await Promise.all([
      import('@tauri-apps/plugin-sql'),
      import('@tauri-apps/plugin-http'),
      import('@tauri-apps/api/core'),
    ]);
    const db = await Database.load('sqlite:savio.db');
    await db.execute('PRAGMA foreign_keys = ON');
    return {
      platform: 'tauri',
      repos: createSqliteRepositories({
        execute: (sql, params) => db.execute(sql, params),
        select: <T>(sql: string, params?: unknown[]) => db.select<T[]>(sql, params),
      }),
      fetchFn: (input, init) => http.fetch(input, init),
      saveExport: (fileName, json) => core.invoke<string>('save_export', { fileName, contents: json }),
    };
  }

  return {
    platform: 'browser',
    repos: createMemoryRepositories(),
    fetchFn: (input, init) => window.fetch(input, init),
    saveExport: async (fileName, json) => {
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: fileName });
      link.click();
      URL.revokeObjectURL(url);
      return fileName;
    },
  };
}

export async function createServices(): Promise<AppServices> {
  const { platform, repos, fetchFn, saveExport } = await openPlatform();
  const listeners = new Set<(locality: Locality, provider: string) => void>();
  const config = (await repos.settings.get<ProviderConfig>(SETTINGS.aiProvider)) ?? defaultProviderConfig();
  const gateway = new AiGateway(createProvider(config, fetchFn), {
    onRequest: ({ locality, provider }) => listeners.forEach((l) => l(locality, provider)),
  });
  const engine = new LearningEngine(repos, systemClock, uuidIds);

  return {
    platform,
    repos,
    engine,
    gateway,
    tutor: new TutorEngine(gateway, engine, repos, systemClock, uuidIds),
    clock: systemClock,
    ids: uuidIds,
    fetchFn,
    saveExport,
    onAiRequest: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export async function applyProviderConfig(services: AppServices, config: ProviderConfig): Promise<void> {
  await services.repos.settings.set(SETTINGS.aiProvider, config);
  services.gateway.use(createProvider(config, services.fetchFn));
}

export async function currentProviderConfig(services: AppServices): Promise<ProviderConfig> {
  return (await services.repos.settings.get<ProviderConfig>(SETTINGS.aiProvider)) ?? defaultProviderConfig();
}
