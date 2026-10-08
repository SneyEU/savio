import type { ReviewItem, SubjectId } from '../domain/types';
import type { SkillStats } from '../learner/learnerModel';

/** Durée moyenne estimée d'une révision de carte, en secondes (ajustée par l'historique réel). */
export const DEFAULT_SECONDS_PER_REVIEW = 12;
/** Une nouvelle carte coûte environ 3 révisions la première semaine. */
const NEW_ITEM_COST_FACTOR = 3;
/** Part maximale du temps consacrée aux nouveautés quand des révisions sont dues. */
const MAX_NEW_SHARE_WITH_BACKLOG = 0.3;

export interface PlanInput {
  dueItems: readonly ReviewItem[];
  newItems: readonly ReviewItem[];
  minutesAvailable: number;
  weakSkills: readonly SkillStats[];
  secondsPerReview?: number;
}

export interface SessionPlan {
  /** Ordre de présentation. */
  queue: ReviewItem[];
  dueCount: number;
  newCount: number;
  estimatedMinutes: number;
  /** Explication lisible, affichée à l'utilisateur et transmise au tuteur. */
  rationale: string;
}

/**
 * Décide quoi travailler maintenant, dans le temps disponible :
 * 1. les révisions dues (oublier coûte plus cher que d'apprendre), en priorité les compétences faibles ;
 * 2. puis des nouveautés, dont la quantité dépend du temps restant et du retard accumulé.
 */
export function planSession(input: PlanInput): SessionPlan {
  const secondsPerReview = input.secondsPerReview ?? DEFAULT_SECONDS_PER_REVIEW;
  const budget = Math.max(1, Math.floor((input.minutesAvailable * 60) / secondsPerReview));
  const weakRank = new Map(input.weakSkills.map((s, index) => [s.skillId, index]));

  const due = [...input.dueItems].sort((a, b) => {
    const wa = weakRank.get(a.skillId) ?? Number.POSITIVE_INFINITY;
    const wb = weakRank.get(b.skillId) ?? Number.POSITIVE_INFINITY;
    if (wa !== wb) return wa - wb;
    return a.srs.dueAt.localeCompare(b.srs.dueAt);
  });

  const selectedDue = due.slice(0, budget);
  const remaining = budget - selectedDue.length;
  const backlog = due.length > budget;
  const newBudget = backlog
    ? Math.floor((budget * MAX_NEW_SHARE_WITH_BACKLOG) / NEW_ITEM_COST_FACTOR)
    : Math.floor(remaining / NEW_ITEM_COST_FACTOR);
  const selectedNew = input.newItems.slice(0, Math.max(0, newBudget));

  // Les nouveautés sont intercalées pour éviter un bloc monotone de révisions.
  const queue = interleave(selectedDue, selectedNew);

  const reasons: string[] = [];
  if (selectedDue.length > 0) reasons.push(`${plural(selectedDue.length, 'révision', 'révisions')} à faire avant d’oublier`);
  if (input.weakSkills.length > 0 && selectedDue.some((i) => weakRank.has(i.skillId)))
    reasons.push('les points faibles passent en premier');
  if (selectedNew.length > 0) reasons.push(`${plural(selectedNew.length, 'nouvelle notion', 'nouvelles notions')} à découvrir`);
  if (backlog) reasons.push('peu de nouveautés aujourd’hui : on rattrape d’abord le retard');

  return {
    queue,
    dueCount: selectedDue.length,
    newCount: selectedNew.length,
    estimatedMinutes: Math.ceil(((selectedDue.length + selectedNew.length * NEW_ITEM_COST_FACTOR) * secondsPerReview) / 60),
    rationale: reasons.length > 0 ? `${capitalize(reasons.join(', '))}.` : 'Rien à réviser pour le moment.',
  };
}

function interleave<T>(primary: readonly T[], secondary: readonly T[]): T[] {
  if (secondary.length === 0) return [...primary];
  const result: T[] = [];
  const step = Math.max(1, Math.floor(primary.length / (secondary.length + 1)));
  let s = 0;
  primary.forEach((item, index) => {
    result.push(item);
    if ((index + 1) % step === 0 && s < secondary.length) result.push(secondary[s++]!);
  });
  while (s < secondary.length) result.push(secondary[s++]!);
  return result;
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export interface SubjectRecommendation {
  subjectId: SubjectId;
  dueCount: number;
  newAvailable: number;
  action: 'review' | 'learn' | 'up_to_date';
}

/** Recommandation par matière pour le tableau de bord. */
export function recommendBySubject(
  subjects: readonly SubjectId[],
  dueItems: readonly ReviewItem[],
  newItems: readonly ReviewItem[],
): SubjectRecommendation[] {
  return subjects.map((subjectId) => {
    const dueCount = dueItems.filter((i) => i.subjectId === subjectId).length;
    const newAvailable = newItems.filter((i) => i.subjectId === subjectId).length;
    return {
      subjectId,
      dueCount,
      newAvailable,
      action: dueCount > 0 ? 'review' : newAvailable > 0 ? 'learn' : 'up_to_date',
    };
  });
}
