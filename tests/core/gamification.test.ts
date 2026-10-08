import { describe, expect, it } from 'vitest';
import { Rating } from '../../src/core/domain/types';
import { currentStreak, longestStreak, previousDay } from '../../src/core/gamification/streak';
import { levelFromXp, xpForActiveMinutes, xpForReview, xpRequiredForLevel } from '../../src/core/gamification/xp';

const act = (day: string, reviews = 1) => ({ day, minutes: 0, xp: 0, reviews, correct: reviews });

describe('XP', () => {
  it('une réussite rapporte plus qu’un échec, mais l’effort compte', () => {
    expect(xpForReview(Rating.Again, 0.9)).toBeGreaterThan(0);
    expect(xpForReview(Rating.Good, 0.9)).toBeGreaterThan(xpForReview(Rating.Again, 0.9));
  });

  it('un rappel difficile réussi rapporte un bonus', () => {
    expect(xpForReview(Rating.Good, 0.5)).toBeGreaterThan(xpForReview(Rating.Good, 0.9));
  });

  it('répéter ce qu’on sait parfaitement rapporte peu', () => {
    expect(xpForReview(Rating.Easy, 0.99)).toBeLessThan(xpForReview(Rating.Good, 0.9));
  });

  it('le temps d’étude est plafonné par session', () => {
    expect(xpForActiveMinutes(500)).toBe(xpForActiveMinutes(60));
    expect(xpForActiveMinutes(-3)).toBe(0);
  });

  it('niveaux : 100 XP pour le niveau 2, 300 pour le niveau 3', () => {
    expect(xpRequiredForLevel(2)).toBe(100);
    expect(xpRequiredForLevel(3)).toBe(300);
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(99).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    const mid = levelFromXp(200);
    expect(mid.level).toBe(2);
    expect(mid.ratio).toBeCloseTo(0.5);
  });
});

describe('Série (streak)', () => {
  it('calcule le jour précédent, y compris en changement de mois et d’année', () => {
    expect(previousDay('2026-03-01')).toBe('2026-02-28');
    expect(previousDay('2026-01-01')).toBe('2025-12-31');
  });

  it('compte les jours consécutifs jusqu’à aujourd’hui', () => {
    expect(currentStreak([act('2026-10-06'), act('2026-10-07'), act('2026-10-08')], '2026-10-08')).toBe(3);
  });

  it('la série n’est pas perdue tant que la journée n’est pas finie', () => {
    expect(currentStreak([act('2026-10-06'), act('2026-10-07')], '2026-10-08')).toBe(2);
  });

  it('un jour manqué remet la série à zéro', () => {
    expect(currentStreak([act('2026-10-05'), act('2026-10-06')], '2026-10-08')).toBe(0);
  });

  it('un jour sans activité réelle ne compte pas', () => {
    expect(currentStreak([act('2026-10-07'), act('2026-10-08', 0)], '2026-10-08')).toBe(1);
  });

  it('plus longue série', () => {
    expect(longestStreak([act('2026-01-01'), act('2026-01-02'), act('2026-01-04'), act('2026-01-05'), act('2026-01-06')])).toBe(3);
  });
});
