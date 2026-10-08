import { STARTER_DECKS } from '../content/starterDecks';
import { MAX_DAILY_GOAL, MIN_DAILY_GOAL } from '../gamification/goals';
import type { DeclaredLevel, LearnerProfile, Motivation, ReviewItem, SubjectId } from '../domain/types';
import type { Clock, IdGenerator, Repositories } from '../ports';
import { newSrsState } from '../srs/fsrs';

export interface OnboardingAnswers {
  displayName: string;
  subjects: { subjectId: SubjectId; level: DeclaredLevel }[];
  dailyGoalMinutes: number;
  motivation: Motivation;
  longTermGoal: string;
}

export interface DailyPlanSlot {
  label: string;
  minutes: number;
}

export function validateOnboarding(answers: OnboardingAnswers): string[] {
  const errors: string[] = [];
  if (answers.displayName.trim().length === 0) errors.push('Indique un prénom ou un pseudonyme.');
  if (answers.displayName.trim().length > 40) errors.push('Le prénom doit faire 40 caractères au maximum.');
  if (answers.subjects.length === 0) errors.push('Choisis au moins une matière.');
  if (!Number.isInteger(answers.dailyGoalMinutes) || answers.dailyGoalMinutes < MIN_DAILY_GOAL || answers.dailyGoalMinutes > MAX_DAILY_GOAL)
    errors.push(`L’objectif quotidien doit être compris entre ${MIN_DAILY_GOAL} et ${MAX_DAILY_GOAL} minutes.`);
  return errors;
}

/**
 * Plan quotidien de départ, avant que l'IA ne l'affine :
 * 50 % révision espacée, 25 % nouvelles notions, 25 % pratique libre avec le tuteur.
 */
export function proposeDailyPlan(dailyGoalMinutes: number): DailyPlanSlot[] {
  const review = Math.max(1, Math.round(dailyGoalMinutes * 0.5));
  const learn = Math.max(1, Math.round(dailyGoalMinutes * 0.25));
  const practice = Math.max(0, dailyGoalMinutes - review - learn);
  return [
    { label: 'Révisions espacées', minutes: review },
    { label: 'Nouvelles notions', minutes: learn },
    { label: 'Pratique avec le tuteur', minutes: practice },
  ].filter((slot) => slot.minutes > 0);
}

/** Crée le profil, inscrit les matières et charge le contenu de démarrage. Idempotent pour le contenu. */
export async function completeOnboarding(
  answers: OnboardingAnswers,
  repos: Repositories,
  clock: Clock,
  ids: IdGenerator,
): Promise<LearnerProfile> {
  const errors = validateOnboarding(answers);
  if (errors.length > 0) throw new Error(errors.join(' '));

  const now = clock.now();
  const iso = now.toISOString();
  const existing = await repos.profile.get();
  const profile: LearnerProfile = {
    id: existing?.id ?? ids.next(),
    displayName: answers.displayName.trim(),
    uiLanguage: 'fr',
    dailyGoalMinutes: answers.dailyGoalMinutes,
    motivation: answers.motivation,
    longTermGoal: answers.longTermGoal.trim(),
    createdAt: existing?.createdAt ?? iso,
    updatedAt: iso,
  };
  await repos.profile.save(profile);

  await enrollSubjects(answers.subjects, repos, clock);
  return profile;
}

/**
 * Inscrit des matières et charge leur contenu de démarrage (sans doublon).
 * Utilisé par l'onboarding et par les réglages (ajout de matières plus tard).
 */
export async function enrollSubjects(
  subjects: readonly { subjectId: SubjectId; level: DeclaredLevel }[],
  repos: Repositories,
  clock: Clock,
): Promise<number> {
  const now = clock.now();
  const iso = now.toISOString();
  const existingKeys = new Set((await repos.items.list()).map((i) => i.id));
  let added = 0;

  for (const { subjectId, level } of subjects) {
    await repos.subjects.save({ subjectId, level, enrolledAt: iso });
    const deck = STARTER_DECKS[subjectId];
    if (!deck) continue;
    await repos.skills.saveMany(deck.skills);
    const items: ReviewItem[] = deck.cards
      .filter((card) => !existingKeys.has(`starter:${card.key}`))
      .map((card) => ({
        // Identifiant stable pour le contenu officiel : permet les mises à jour de contenu sans doublons.
        id: `starter:${card.key}`,
        subjectId,
        skillId: card.skillId,
        kind: card.kind,
        front: card.front,
        back: card.back,
        note: card.note,
        source: card.source,
        srs: newSrsState(now),
        createdAt: iso,
        updatedAt: iso,
      }));
    await repos.items.saveMany(items);
    added += items.length;
  }
  return added;
}
