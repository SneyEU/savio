import { Rating } from '../domain/types';

/**
 * Règles d'XP : on récompense l'apprentissage réel, pas les clics.
 * - Une révision échouée rapporte un peu (l'effort compte), une réussite davantage.
 * - Réussir un rappel difficile (faible probabilité de rappel) rapporte un bonus.
 * - Les réponses « Easy » sur des éléments très stables rapportent peu : rien à gagner à répéter ce qu'on sait.
 */
export const XP_RULES = {
  attempt: 1,
  correct: 4,
  hardRecallBonus: 4,
  /** Probabilité de rappel en-dessous de laquelle un rappel réussi est considéré « difficile ». */
  hardRecallThreshold: 0.75,
  /** XP par minute d'étude active (plafonnée par session). */
  perActiveMinute: 1,
  maxMinutesPerSession: 60,
} as const;

export function xpForReview(rating: Rating, retrievabilityBefore: number): number {
  if (rating === Rating.Again) return XP_RULES.attempt;
  let xp: number = XP_RULES.correct;
  if (retrievabilityBefore < XP_RULES.hardRecallThreshold) xp += XP_RULES.hardRecallBonus;
  if (rating === Rating.Easy && retrievabilityBefore > 0.97) xp = Math.ceil(xp / 2);
  return xp;
}

export function xpForActiveMinutes(minutes: number): number {
  return Math.floor(Math.min(Math.max(0, minutes), XP_RULES.maxMinutesPerSession) * XP_RULES.perActiveMinute);
}

/**
 * Courbe de niveaux : XP cumulée nécessaire pour atteindre le niveau n = 50 · n · (n − 1).
 * Niveau 2 = 100 XP, niveau 3 = 300 XP, niveau 10 = 4 500 XP.
 */
export function xpRequiredForLevel(level: number): number {
  const n = Math.max(1, Math.floor(level));
  return 50 * n * (n - 1);
}

export interface LevelProgress {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  /** 0 → 1 */
  ratio: number;
}

export function levelFromXp(totalXp: number): LevelProgress {
  const xp = Math.max(0, totalXp);
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) level += 1;
  const floor = xpRequiredForLevel(level);
  const ceiling = xpRequiredForLevel(level + 1);
  return { level, xpIntoLevel: xp - floor, xpForNextLevel: ceiling - floor, ratio: (xp - floor) / (ceiling - floor) };
}
