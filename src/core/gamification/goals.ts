/**
 * Objectifs quotidiens par paliers. L'objectif n'est pas une limite :
 * une fois atteint, l'apprenant peut continuer autant qu'il veut.
 */
export interface GoalTier {
  minutes: number;
  label: string;
  hint: string;
}

export const GOAL_TIERS: GoalTier[] = [
  { minutes: 5, label: 'Détente', hint: 'Une petite habitude' },
  { minutes: 10, label: 'Régulier', hint: 'Le rythme le plus tenable' },
  { minutes: 15, label: 'Sérieux', hint: 'Des progrès visibles chaque semaine' },
  { minutes: 20, label: 'Motivé', hint: 'Avancer vite' },
  { minutes: 30, label: 'Intense', hint: 'Plusieurs matières par jour' },
  { minutes: 45, label: 'Passionné', hint: 'Un vrai temps d’étude' },
  { minutes: 60, label: 'Marathon', hint: 'Une heure, tous les jours' },
  { minutes: 90, label: 'Immersion', hint: 'Pour un objectif ambitieux' },
  { minutes: 120, label: 'Expert', hint: 'Deux heures quotidiennes' },
];

export const MIN_DAILY_GOAL = 5;
export const MAX_DAILY_GOAL = 240;

export function tierFor(minutes: number): GoalTier {
  return [...GOAL_TIERS].reverse().find((t) => minutes >= t.minutes) ?? GOAL_TIERS[0]!;
}

export interface GoalStatus {
  ratio: number;
  reached: boolean;
  /** Minutes au-delà de l'objectif (bonus). */
  extraMinutes: number;
  remainingMinutes: number;
}

export function goalStatus(minutesToday: number, goal: number): GoalStatus {
  const safeGoal = Math.max(1, goal);
  const minutes = Math.max(0, minutesToday);
  return {
    ratio: Math.min(1, minutes / safeGoal),
    reached: minutes >= safeGoal,
    extraMinutes: Math.max(0, minutes - safeGoal),
    remainingMinutes: Math.max(0, safeGoal - minutes),
  };
}

/** Durée proposée pour une séance bonus, une fois l'objectif atteint. */
export const BONUS_SESSION_MINUTES = 5;

/**
 * Durée de la prochaine séance : le temps qui reste avant l'objectif,
 * ou une séance bonus si l'objectif est déjà atteint.
 */
export function nextSessionMinutes(minutesToday: number, goal: number): number {
  const status = goalStatus(minutesToday, goal);
  return status.reached ? BONUS_SESSION_MINUTES : Math.max(MIN_DAILY_GOAL, status.remainingMinutes);
}
