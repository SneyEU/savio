import type { MasteryStage, SrsState } from '../domain/types';

/** Seuils de stabilité (en jours) qui définissent les échelons de maîtrise. */
export const MASTERY_THRESHOLDS = { learning: 1, fragile: 7, known: 30 } as const;

/**
 * Convertit l'état SRS en un échelon compréhensible :
 * Nouveau → Apprentissage → Fragile → Connu → Maîtrisé.
 */
export function masteryStage(state: SrsState): MasteryStage {
  if (state.reps === 0) return 'new';
  if (state.stability < MASTERY_THRESHOLDS.learning) return 'learning';
  if (state.stability < MASTERY_THRESHOLDS.fragile) return 'fragile';
  if (state.stability < MASTERY_THRESHOLDS.known) return 'known';
  return 'mastered';
}

export const MASTERY_LABELS_FR: Record<MasteryStage, string> = {
  new: 'Nouveau',
  learning: 'Apprentissage',
  fragile: 'Fragile',
  known: 'Connu',
  mastered: 'Maîtrisé',
};

export function masteryDistribution(states: readonly SrsState[]): Record<MasteryStage, number> {
  const result: Record<MasteryStage, number> = { new: 0, learning: 0, fragile: 0, known: 0, mastered: 0 };
  for (const state of states) result[masteryStage(state)] += 1;
  return result;
}
