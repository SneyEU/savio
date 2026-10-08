import { Rating, type Id, type ReviewItem, type SubjectId } from '../domain/types';
import { currentStreak, toLocalDay } from '../gamification/streak';
import { levelFromXp, xpForReview, type LevelProgress } from '../gamification/xp';
import { buildLearnerSnapshot, type LearnerSnapshot } from '../learner/learnerModel';
import type { Clock, IdGenerator, Repositories } from '../ports';
import { DEFAULT_SCHEDULER_OPTIONS, schedule, type SchedulerOptions } from '../srs/fsrs';
import { masteryDistribution } from '../srs/mastery';
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
    const [due, fresh, snapshot] = await Promise.all([
      this.repos.items.listDue(now, 500, subjectId),
      this.repos.items.listNew(50, subjectId),
      this.snapshot(subjectId),
    ]);
    return planSession({ dueItems: due, newItems: fresh, minutesAvailable, weakSkills: snapshot.weakSkills });
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
    const totalXp = activities.reduce((sum, a) => sum + a.xp, 0);
    const todayActivity = activities.find((a) => a.day === today);
    return {
      totalXp,
      level: levelFromXp(totalXp),
      streak: currentStreak(activities, today),
      todayMinutes: todayActivity?.minutes ?? 0,
      todayXp: todayActivity?.xp ?? 0,
      dailyGoalMinutes: profile?.dailyGoalMinutes ?? 15,
      dueCount: due.length,
      mastery: masteryDistribution(allItems.map((i) => i.srs)),
      recommendations: recommendBySubject(
        subjects.map((s) => s.subjectId),
        due,
        fresh,
      ),
    };
  }
}
