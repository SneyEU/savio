import { beforeEach, describe, expect, it } from 'vitest';
import { Rating } from '../../src/core/domain/types';
import { LearningEngine } from '../../src/core/engine/learningEngine';
import { completeOnboarding, proposeDailyPlan, validateOnboarding, type OnboardingAnswers } from '../../src/core/engine/onboarding';
import { planSession } from '../../src/core/engine/sessionPlanner';
import { buildLearnerSnapshot, describeForTutor, unlockedSkills } from '../../src/core/learner/learnerModel';
import type { Repositories } from '../../src/core/ports';
import { createMemoryRepositories } from '../../src/infrastructure/memory/memoryRepositories';
import { FakeClock, SequentialIds } from './helpers';

const answers: OnboardingAnswers = {
  displayName: 'Matt',
  subjects: [
    { subjectId: 'spanish', level: 'beginner' },
    { subjectId: 'chess', level: 'beginner' },
  ],
  dailyGoalMinutes: 20,
  motivation: 'travel',
  longTermGoal: 'Voyager en Amérique du Sud',
};

describe('Onboarding', () => {
  it('valide les réponses', () => {
    expect(validateOnboarding(answers)).toEqual([]);
    expect(validateOnboarding({ ...answers, displayName: ' ', subjects: [], dailyGoalMinutes: 2 })).toHaveLength(3);
  });

  it('propose un plan quotidien qui respecte le temps disponible', () => {
    const plan = proposeDailyPlan(20);
    expect(plan.reduce((sum, s) => sum + s.minutes, 0)).toBe(20);
    expect(plan[0]!.label).toBe('Révisions espacées');
  });

  it('crée le profil et charge le contenu de démarrage sans doublon', async () => {
    const repos = createMemoryRepositories();
    const clock = new FakeClock();
    const ids = new SequentialIds();
    await completeOnboarding(answers, repos, clock, ids);
    const count = (await repos.items.list()).length;
    expect(count).toBeGreaterThan(10);
    await completeOnboarding(answers, repos, clock, ids);
    expect((await repos.items.list()).length).toBe(count);
    expect((await repos.profile.get())?.displayName).toBe('Matt');
  });
});

describe('LearningEngine', () => {
  let repos: Repositories;
  let clock: FakeClock;
  let engine: LearningEngine;

  beforeEach(async () => {
    repos = createMemoryRepositories();
    clock = new FakeClock();
    const ids = new SequentialIds();
    engine = new LearningEngine(repos, clock, ids);
    await completeOnboarding(answers, repos, clock, ids);
  });

  it('le premier jour, le plan ne contient que des nouveautés', async () => {
    const plan = await engine.planToday(20);
    expect(plan.dueCount).toBe(0);
    expect(plan.newCount).toBeGreaterThan(0);
    expect(plan.estimatedMinutes).toBeLessThanOrEqual(20);
  });

  it('une révision met à jour l’élément, le journal, l’XP et l’activité', async () => {
    const plan = await engine.planToday(20);
    const item = plan.queue[0]!;
    const outcome = await engine.recordReview(item.id, Rating.Good, 4200);
    expect(outcome.xpGained).toBeGreaterThan(0);
    expect((await repos.items.get(item.id))?.srs.reps).toBe(1);
    expect(await repos.logs.list()).toHaveLength(1);
    const progress = await engine.progress();
    expect(progress.totalXp).toBe(outcome.xpGained);
    expect(progress.streak).toBe(1);
    expect(progress.mastery.new).toBeGreaterThan(0);
  });

  it('les éléments reviennent en révision à leur échéance', async () => {
    const plan = await engine.planToday(20);
    for (const item of plan.queue) await engine.recordReview(item.id, Rating.Good, 3000);
    expect((await engine.planToday(20)).dueCount).toBe(0);
    clock.advanceDays(30);
    expect((await engine.planToday(20)).dueCount).toBe(plan.queue.length);
  });

  it('les erreurs étiquetées révèlent les confusions récurrentes', async () => {
    const item = (await repos.items.list({ subjectId: 'spanish' })).find((i) => i.skillId === 'es.ser-estar')!;
    await engine.recordReview(item.id, Rating.Again, 8000, { tag: 'ser/estar', expected: 'estoy', given: 'soy' });
    clock.advanceMinutes(15);
    await engine.recordReview(item.id, Rating.Again, 7000, { tag: 'ser/estar', expected: 'estoy', given: 'soy' });
    const snapshot = await engine.snapshot('spanish');
    expect(snapshot.confusions[0]).toMatchObject({ tag: 'ser/estar', count: 2 });
    expect(describeForTutor(snapshot, new Map([['es.ser-estar', 'Ser et estar']]))).toContain('ser/estar');
  });

  it('la série se prolonge d’un jour à l’autre et casse après un jour manqué', async () => {
    const [first, second, third] = (await engine.planToday(20)).queue;
    await engine.recordReview(first!.id, Rating.Good, 3000);
    clock.advanceDays(1);
    await engine.recordReview(second!.id, Rating.Good, 3000);
    expect((await engine.progress()).streak).toBe(2);
    clock.advanceDays(2);
    expect((await engine.progress()).streak).toBe(0);
    await engine.recordReview(third!.id, Rating.Good, 3000);
    expect((await engine.progress()).streak).toBe(1);
  });
});

describe('Planificateur de session', () => {
  const item = (id: string, skillId: string, dueAt: string, reps = 1) => ({
    id,
    subjectId: 'spanish' as const,
    skillId,
    kind: 'vocabulary' as const,
    front: id,
    back: id,
    srs: { stability: 2, difficulty: 5, reps, lapses: 0, lastReviewedAt: null, dueAt },
    createdAt: dueAt,
    updatedAt: dueAt,
  });

  it('place les compétences faibles en premier', () => {
    const plan = planSession({
      dueItems: [item('a', 'strong', '2026-01-01'), item('b', 'weak', '2026-01-03')],
      newItems: [],
      minutesAvailable: 10,
      weakSkills: [{ skillId: 'weak', subjectId: 'spanish', attempts: 5, accuracy: 0.4, medianResponseMs: 0, lastPracticedAt: null }],
    });
    expect(plan.queue.map((i) => i.id)).toEqual(['b', 'a']);
    expect(plan.rationale).toContain('points faibles');
  });

  it('limite les nouveautés quand il y a du retard', () => {
    const due = Array.from({ length: 200 }, (_, i) => item(`d${i}`, 's', '2026-01-01'));
    const fresh = Array.from({ length: 50 }, (_, i) => item(`n${i}`, 's', '2026-01-01', 0));
    const plan = planSession({ dueItems: due, newItems: fresh, minutesAvailable: 10, weakSkills: [] });
    expect(plan.dueCount).toBe(50);
    expect(plan.newCount).toBeLessThanOrEqual(5);
  });
});

describe('Graphe de connaissances', () => {
  it('débloque une compétence quand ses prérequis sont maîtrisés', () => {
    const skills = [
      { id: 'a', subjectId: 'spanish' as const, title: 'A', prerequisites: [] },
      { id: 'b', subjectId: 'spanish' as const, title: 'B', prerequisites: ['a'] },
    ];
    const logs = Array.from({ length: 8 }, (_, i) => ({
      id: `l${i}`,
      itemId: 'x',
      subjectId: 'spanish' as const,
      skillId: 'a',
      rating: Rating.Good,
      reviewedAt: `2026-01-0${i + 1}T10:00:00.000Z`,
      responseMs: 2000,
      elapsedDays: 1,
      stabilityBefore: 1,
      stabilityAfter: 2,
    }));
    expect(unlockedSkills(skills, []).map((s) => s.id)).toEqual(['a']);
    expect(unlockedSkills(skills, buildLearnerSnapshot(logs, []).skills).map((s) => s.id)).toEqual(['a', 'b']);
  });
});

describe('Force par matière', () => {
  it('vaut 0 pour des cartes neuves et augmente avec la maîtrise', async () => {
    const { subjectStrength } = await import('../../src/core/engine/learningEngine');
    const base = { kind: 'vocabulary' as const, skillId: 's', front: '', back: '', createdAt: '', updatedAt: '' };
    const srs = (stability: number, reps: number) => ({ stability, difficulty: 5, reps, lapses: 0, lastReviewedAt: null, dueAt: '' });
    const result = subjectStrength([
      { ...base, id: 'a', subjectId: 'spanish', srs: srs(0, 0) },
      { ...base, id: 'b', subjectId: 'spanish', srs: srs(40, 6) },
      { ...base, id: 'c', subjectId: 'chess', srs: srs(0, 0) },
    ]);
    expect(result.spanish).toBeCloseTo(0.5);
    expect(result.chess).toBe(0);
  });
});
