import { describe, expect, it } from 'vitest';
import { Rating } from '../../src/core/domain/types';
import { DEFAULT_SCHEDULER_OPTIONS, intervalForStability, isDue, newSrsState, retrievability, schedule } from '../../src/core/srs/fsrs';
import { masteryStage } from '../../src/core/srs/mastery';

const day = 86_400_000;
const t0 = new Date('2026-01-05T09:00:00.000Z');
const daysBetween = (a: string, b: Date) => (new Date(a).getTime() - b.getTime()) / day;

describe('FSRS — formules de base', () => {
  it('la probabilité de rappel vaut 90 % quand le temps écoulé égale la stabilité', () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 5);
    expect(retrievability(0, 10)).toBe(1);
  });

  it('la probabilité de rappel décroît avec le temps', () => {
    expect(retrievability(20, 10)).toBeLessThan(retrievability(5, 10));
  });

  it('avec 90 % de rétention visée, l’intervalle égale la stabilité', () => {
    expect(intervalForStability(12, DEFAULT_SCHEDULER_OPTIONS)).toBe(12);
  });

  it('une rétention plus exigeante raccourcit les intervalles', () => {
    const strict = { ...DEFAULT_SCHEDULER_OPTIONS, desiredRetention: 0.95 };
    expect(intervalForStability(30, strict)).toBeLessThan(intervalForStability(30, DEFAULT_SCHEDULER_OPTIONS));
  });
});

describe('FSRS — planification', () => {
  it('première révision : une meilleure note donne une échéance plus lointaine', () => {
    const state = newSrsState(t0);
    const hard = schedule(state, Rating.Hard, t0).state;
    const good = schedule(state, Rating.Good, t0).state;
    const easy = schedule(state, Rating.Easy, t0).state;
    expect(new Date(good.dueAt).getTime()).toBeGreaterThan(new Date(hard.dueAt).getTime());
    expect(new Date(easy.dueAt).getTime()).toBeGreaterThan(new Date(good.dueAt).getTime());
    expect(good.reps).toBe(1);
  });

  it('un oubli replanifie dans quelques minutes et compte un trou de mémoire', () => {
    let state = schedule(newSrsState(t0), Rating.Good, t0).state;
    const later = new Date(t0.getTime() + 5 * day);
    const forgot = schedule(state, Rating.Again, later);
    state = forgot.state;
    expect(state.lapses).toBe(1);
    expect(new Date(state.dueAt).getTime() - later.getTime()).toBe(10 * 60_000);
  });

  it('un oubli ne fait jamais augmenter la stabilité', () => {
    let state = newSrsState(t0);
    let now = t0;
    for (let i = 0; i < 4; i++) {
      state = schedule(state, Rating.Good, now).state;
      now = new Date(state.dueAt);
    }
    const before = state.stability;
    expect(schedule(state, Rating.Again, now).state.stability).toBeLessThanOrEqual(before);
  });

  it('des réussites successives espacent les révisions (effet d’espacement)', () => {
    let state = newSrsState(t0);
    let now = t0;
    const intervals: number[] = [];
    for (let i = 0; i < 5; i++) {
      state = schedule(state, Rating.Good, now).state;
      intervals.push(daysBetween(state.dueAt, now));
      now = new Date(state.dueAt);
    }
    for (let i = 1; i < intervals.length; i++) expect(intervals[i]!).toBeGreaterThan(intervals[i - 1]!);
  });

  it('la difficulté reste bornée entre 1 et 10', () => {
    let state = newSrsState(t0);
    let now = t0;
    for (let i = 0; i < 20; i++) {
      state = schedule(state, Rating.Again, now).state;
      now = new Date(now.getTime() + day);
    }
    expect(state.difficulty).toBeLessThanOrEqual(10);
    expect(state.difficulty).toBeGreaterThanOrEqual(1);
  });

  it('isDue respecte l’échéance', () => {
    const state = schedule(newSrsState(t0), Rating.Good, t0).state;
    expect(isDue(state, t0)).toBe(false);
    expect(isDue(state, new Date(state.dueAt))).toBe(true);
  });
});

describe('Échelons de maîtrise', () => {
  it('suit la progression Nouveau → Maîtrisé', () => {
    const base = newSrsState(t0);
    expect(masteryStage(base)).toBe('new');
    expect(masteryStage({ ...base, reps: 1, stability: 0.5 })).toBe('learning');
    expect(masteryStage({ ...base, reps: 2, stability: 3 })).toBe('fragile');
    expect(masteryStage({ ...base, reps: 4, stability: 14 })).toBe('known');
    expect(masteryStage({ ...base, reps: 6, stability: 45 })).toBe('mastered');
  });
});
