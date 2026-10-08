/**
 * Planificateur de répétition espacée basé sur FSRS-4.5
 * (Free Spaced Repetition Scheduler, algorithme publié ouvertement par le projet open-spaced-repetition).
 *
 * Implémentation originale, sans dépendance, volontairement lisible :
 * chaque formule correspond à une étape documentée de l'algorithme.
 */
import { Rating, type IsoDateTime, type SrsState } from '../domain/types';

/** Paramètres par défaut publiés pour FSRS-4.5 (optimisés sur un large corpus de révisions). */
export const DEFAULT_WEIGHTS: readonly number[] = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246,
  1.587, 0.2272, 2.8755,
];

const DECAY = -0.5;
const FACTOR = 19 / 81; // garantit R(S, S) = 0.9
const MS_PER_DAY = 86_400_000;
/** Délai de réapprentissage après un oubli (avant de repasser au rythme en jours). */
const RELEARN_DELAY_MINUTES = 10;

export interface SchedulerOptions {
  /** Probabilité de rappel visée au moment de la révision (0.7 – 0.97). */
  desiredRetention: number;
  /** Intervalle maximal en jours. */
  maximumIntervalDays: number;
  weights: readonly number[];
}

export const DEFAULT_SCHEDULER_OPTIONS: SchedulerOptions = {
  desiredRetention: 0.9,
  maximumIntervalDays: 365 * 3,
  weights: DEFAULT_WEIGHTS,
};

export function newSrsState(now: Date): SrsState {
  return { stability: 0, difficulty: 0, reps: 0, lapses: 0, lastReviewedAt: null, dueAt: now.toISOString() };
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

/** Probabilité de rappel après `elapsedDays` jours pour une stabilité donnée. */
export function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Intervalle (jours) pour atteindre la rétention visée. */
export function intervalForStability(stability: number, options: SchedulerOptions): number {
  const raw = (stability / FACTOR) * (Math.pow(options.desiredRetention, 1 / DECAY) - 1);
  return clamp(Math.round(raw), 1, options.maximumIntervalDays);
}

function initialStability(rating: Rating, w: readonly number[]): number {
  return Math.max(w[rating - 1]!, 0.1);
}

function initialDifficulty(rating: Rating, w: readonly number[]): number {
  return clamp(w[4]! - (rating - 3) * w[5]!, 1, 10);
}

function nextDifficulty(difficulty: number, rating: Rating, w: readonly number[]): number {
  const updated = difficulty - w[6]! * (rating - 3);
  // Retour progressif vers la difficulté d'une réponse « Good », pour éviter l'emballement.
  const meanReverted = w[7]! * initialDifficulty(Rating.Good, w) + (1 - w[7]!) * updated;
  return clamp(meanReverted, 1, 10);
}

function stabilityAfterRecall(d: number, s: number, r: number, rating: Rating, w: readonly number[]): number {
  const hardPenalty = rating === Rating.Hard ? w[15]! : 1;
  const easyBonus = rating === Rating.Easy ? w[16]! : 1;
  const growth = Math.exp(w[8]!) * (11 - d) * Math.pow(s, -w[9]!) * (Math.exp(w[10]! * (1 - r)) - 1);
  return s * (growth * hardPenalty * easyBonus + 1);
}

function stabilityAfterForgetting(d: number, s: number, r: number, w: readonly number[]): number {
  const next = w[11]! * Math.pow(d, -w[12]!) * (Math.pow(s + 1, w[13]!) - 1) * Math.exp(w[14]! * (1 - r));
  // Un oubli ne peut pas augmenter la stabilité.
  return Math.min(next, s);
}

export interface ScheduleResult {
  state: SrsState;
  elapsedDays: number;
  /** Probabilité de rappel estimée juste avant cette révision (1 pour un élément nouveau). */
  retrievabilityBefore: number;
}

/** Calcule le nouvel état SRS après une révision notée `rating` à l'instant `now`. */
export function schedule(
  state: SrsState,
  rating: Rating,
  now: Date,
  options: SchedulerOptions = DEFAULT_SCHEDULER_OPTIONS,
): ScheduleResult {
  const w = options.weights;
  const elapsedDays = state.lastReviewedAt
    ? Math.max(0, (now.getTime() - new Date(state.lastReviewedAt).getTime()) / MS_PER_DAY)
    : 0;

  let stability: number;
  let difficulty: number;
  let retrievabilityBefore = 1;

  if (state.reps === 0 || state.stability <= 0) {
    stability = initialStability(rating, w);
    difficulty = initialDifficulty(rating, w);
  } else {
    retrievabilityBefore = retrievability(elapsedDays, state.stability);
    difficulty = nextDifficulty(state.difficulty, rating, w);
    stability =
      rating === Rating.Again
        ? stabilityAfterForgetting(state.difficulty, state.stability, retrievabilityBefore, w)
        : stabilityAfterRecall(state.difficulty, state.stability, retrievabilityBefore, rating, w);
  }

  stability = Math.max(stability, 0.1);
  const due =
    rating === Rating.Again
      ? new Date(now.getTime() + RELEARN_DELAY_MINUTES * 60_000)
      : new Date(now.getTime() + intervalForStability(stability, options) * MS_PER_DAY);

  return {
    elapsedDays,
    retrievabilityBefore,
    state: {
      stability,
      difficulty,
      reps: state.reps + 1,
      lapses: state.lapses + (rating === Rating.Again && state.reps > 0 ? 1 : 0),
      lastReviewedAt: now.toISOString(),
      dueAt: due.toISOString(),
    },
  };
}

export function isDue(state: SrsState, now: Date): boolean {
  return new Date(state.dueAt).getTime() <= now.getTime();
}

export function dueDate(state: SrsState): IsoDateTime {
  return state.dueAt;
}
