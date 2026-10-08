import type { DailyActivity, LocalDay } from '../domain/types';

/** Un jour compte pour la série s'il contient au moins une révision ou une minute d'étude. */
export function isActiveDay(activity: DailyActivity): boolean {
  return activity.reviews > 0 || activity.minutes > 0;
}

/** Jour local "YYYY-MM-DD" pour une date et un fuseau donnés (fuseau du système par défaut). */
export function toLocalDay(date: Date, timeZone?: string): LocalDay {
  // en-CA formate naturellement en YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function previousDay(day: LocalDay): LocalDay {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  const utc = new Date(Date.UTC(y, m - 1, d - 1));
  return utc.toISOString().slice(0, 10);
}

/**
 * Série en cours : nombre de jours actifs consécutifs se terminant aujourd'hui,
 * ou hier si l'utilisateur n'a pas encore étudié aujourd'hui (la série n'est pas perdue avant minuit).
 */
export function currentStreak(activities: readonly DailyActivity[], today: LocalDay): number {
  const active = new Set(activities.filter(isActiveDay).map((a) => a.day));
  let cursor = active.has(today) ? today : previousDay(today);
  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor = previousDay(cursor);
  }
  return streak;
}

export function longestStreak(activities: readonly DailyActivity[]): number {
  const days = [...new Set(activities.filter(isActiveDay).map((a) => a.day))].sort();
  let best = 0;
  let run = 0;
  let prev: LocalDay | null = null;
  for (const day of days) {
    run = prev !== null && previousDay(day) === prev ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return best;
}
