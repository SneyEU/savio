import { Rating, type Id, type ReviewItem, type SubjectId } from '../domain/types';
import { currentStreak, toLocalDay } from '../gamification/streak';
import { levelFromXp, xpForReview, type LevelProgress } from '../gamification/xp';
import { buildLearnerSnapshot, type LearnerSnapshot } from '../learner/learnerModel';
import type { Clock, IdGenerator, Repositories } from '../ports';
import { DEFAULT_SCHEDULER_OPTIONS, schedule, type SchedulerOptions } from '../srs/fsrs';
import { masteryDistribution, masteryStage } from '../srs/mastery';
import { planSession, recommendBySubject, type SessionPlan, type SubjectRecommendation } from './sessionPlanner';

export interface ReviewOutcome {
  item: ReviewItem;
  xpGained: number;
  nextDueAt: string;
}

export interface MistakeInput {
  tag: string;
  expected: string;
  given: string;
}

export interface ProgressSummary {
  totalXp: number;
  level: LevelProgress;
  streak: number;
  todayMinutes: number;
  todayXp: number;
  dailyGoalMinutes: number;
  dueCount: number;
  mastery: ReturnType<typeof masteryDistribution>;
  recommendations: SubjectRecommendation[];
  /** Force de chaque matière (0 → 1), d'après l'échelon de maîtrise de ses éléments. */
  subjectStrength: Record<SubjectId, number>;
}

/**
 * Point d'entrée du moteur d'apprentissage.
 * Orchestration déterministe : SRS, journal, XP, activité quotidienne, modèle apprenant.
 * Aucune IA ici : le tuteur IA est un client de ce moteur.
 */
export class LearningEngine {
  constructor(
    private readonly repos: Repositories,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
    private readonly options: SchedulerOptions = DEFAULT_SCHEDULER_OPTIONS,
  ) {}

  async planToday(minutesAvailable: number, subjectId?: SubjectId): Promise<SessionPlan> {
    const now = this.clock.now();
    const [due, fresh, snapshot, active] = await Promise.all([
      this.repos.items.listDue(now, 500, subjectId),
      this.repos.items.listNew(200, subjectId),
      this.snapshot(subjectId),
      this.activeSubjects(),
    ]);
    // Les matières retirées par l'utilisateur gardent leur historique mais ne reviennent plus en session.
    const enrolled = (item: ReviewItem) => active.has(item.subjectId);
    return planSession({
      dueItems: due.filter(enrolled),
      newItems: interleaveBySubject(fresh.filter(enrolled)),
      minutesAvailable,
      weakSkills: snapshot.weakSkills,
    });
  }

  private async activeSubjects(): Promise<Set<SubjectId>> {
    return new Set((await this.repos.subjects.list()).map((s) => s.subjectId));
  }

  async recordReview(itemId: Id, rating: Rating, responseMs: number, mistake?: MistakeInput): Promise<ReviewOutcome> {
    const item = await this.repos.items.get(itemId);
    if (!item) throw new Error(`Élément introuvable : ${itemId}`);
    const now = this.clock.now();
    const result = schedule(item.srs, rating, now, this.options);
    const updated: ReviewItem = { ...item, srs: result.state, updatedAt: now.toISOString() };
    const xpGained = xpForReview(rating, result.retrievabilityBefore);

    await this.repos.items.saveMany([updated]);
    await this.repos.logs.append({
      id: this.ids.next(),
      itemId: item.id,
      subjectId: item.subjectId,
      skillId: item.skillId,
      rating,
      reviewedAt: now.toISOString(),
      responseMs: Math.max(0, Math.round(responseMs)),
      elapsedDays: result.elapsedDays,
      stabilityBefore: item.srs.stability,
      stabilityAfter: result.state.stability,
    });
    if (rating === Rating.Again && mistake) {
      await this.repos.mistakes.append({
        id: this.ids.next(),
        subjectId: item.subjectId,
        skillId: item.skillId,
        tag: mistake.tag,
        expected: mistake.expected,
        given: mistake.given,
        occurredAt: now.toISOString(),
      });
    }
    await this.repos.activity.increment(toLocalDay(now), {
      xp: xpGained,
      reviews: 1,
      correct: rating === Rating.Again ? 0 : 1,
    });

    return { item: updated, xpGained, nextDueAt: result.state.dueAt };
  }

  /** Enregistre du temps d'étude actif (minutes entières). */
  async recordStudyTime(minutes: number): Promise<void> {
    if (minutes <= 0) return;
    await this.repos.activity.increment(toLocalDay(this.clock.now()), { minutes: Math.round(minutes) });
  }

  async snapshot(subjectId?: SubjectId): Promise<LearnerSnapshot> {
    const [logs, mistakes] = await Promise.all([
      this.repos.logs.list(subjectId ? { subjectId } : undefined),
      this.repos.mistakes.list(subjectId ? { subjectId } : undefined),
    ]);
    return buildLearnerSnapshot(logs, mistakes);
  }

  async progress(): Promise<ProgressSummary> {
    const now = this.clock.now();
    const today = toLocalDay(now);
    const [activities, profile, subjects, allItems, due, fresh] = await Promise.all([
      this.repos.activity.list(),
      this.repos.profile.get(),
      this.repos.subjects.list(),
      this.repos.items.list(),
      this.repos.items.listDue(now, 1000),
      this.repos.items.listNew(1000),
    ]);
    const active = new Set(subjects.map((s) => s.subjectId));
    const enrolled = (item: ReviewItem) => active.has(item.subjectId);
    const totalXp = activities.reduce((sum, a) => sum + a.xp, 0);
    const todayActivity = activities.find((a) => a.day === today);
    return {
      totalXp,
      level: levelFromXp(totalXp),
      streak: currentStreak(activities, today),
      todayMinutes: todayActivity?.minutes ?? 0,
      todayXp: todayActivity?.xp ?? 0,
      dailyGoalMinutes: profile?.dailyGoalMinutes ?? 15,
      dueCount: due.filter(enrolled).length,
      mastery: masteryDistribution(allItems.filter(enrolled).map((i) => i.srs)),
      subjectStrength: subjectStrength(allItems.filter(enrolled)),
      recommendations: recommendBySubject(
        subjects.map((s) => s.subjectId),
        due.filter(enrolled),
        fresh.filter(enrolled),
      ),
    };
  }
}

/** Alterne les matières dans la liste des nouveautés, pour éviter dix cartes d'affilée sur le même sujet. */
export function interleaveBySubject(items: readonly ReviewItem[]): ReviewItem[] {
  const groups = new Map<SubjectId, ReviewItem[]>();
  for (const item of items) groups.set(item.subjectId, [...(groups.get(item.subjectId) ?? []), item]);
  const queues = [...groups.values()];
  const result: ReviewItem[] = [];
  while (queues.some((q) => q.length > 0)) {
    for (const q of queues) {
      const next = q.shift();
      if (next) result.push(next);
    }
  }
  return result;
}

const STAGE_WEIGHT = { new: 0, learning: 0.25, fragile: 0.5, known: 0.8, mastered: 1 } as const;

/** Moyenne pondérée des échelons de maîtrise, par matière. */
export function subjectStrength(items: readonly ReviewItem[]): Record<SubjectId, number> {
  const sums = new Map<SubjectId, { total: number; weight: number }>();
  for (const item of items) {
    const entry = sums.get(item.subjectId) ?? { total: 0, weight: 0 };
    entry.total += 1;
    entry.weight += STAGE_WEIGHT[masteryStage(item.srs)];
    sums.set(item.subjectId, entry);
  }
  return Object.fromEntries([...sums].map(([id, { total, weight }]) => [id, total > 0 ? weight / total : 0]));
}
