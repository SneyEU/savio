import { previousDay } from '../../core/gamification/streak';
import type { DailyActivity, LocalDay } from '../../core/domain/types';

interface WakeProps {
  activities: readonly DailyActivity[];
  today: LocalDay;
  days?: number;
}

const WIDTH = 560;
const HEIGHT = 84;

/**
 * Le sillage : les derniers jours dessinés comme la trace d'un bateau.
 * Chaque bouée allumée est un jour d'étude ; la dernière est aujourd'hui.
 */
export function Wake({ activities, today, days = 14 }: WakeProps) {
  const byDay = new Map(activities.map((a) => [a.day, a]));
  const series: LocalDay[] = [];
  let cursor = today;
  for (let i = 0; i < days; i++) {
    series.unshift(cursor);
    cursor = previousDay(cursor);
  }

  const points = series.map((day, i) => {
    const x = 18 + (i * (WIDTH - 36)) / (days - 1);
    // Houle douce : amplitude croissante vers aujourd'hui, comme un sillage qui s'élargit vers le navire.
    const amplitude = 6 + (i / (days - 1)) * 14;
    const y = HEIGHT / 2 + Math.sin(i * 0.9) * amplitude;
    const activity = byDay.get(day);
    return { day, x, y, active: !!activity && (activity.reviews > 0 || activity.minutes > 0), isToday: day === today };
  });

  const path = points.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1]!;
    const mid = (prev.x + p.x) / 2;
    return `${d} C ${mid} ${prev.y}, ${mid} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const activeCount = points.filter((p) => p.active).length;

  return (
    <svg
      className="wake"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${activeCount} jour(s) d’étude sur les ${days} derniers jours`}
    >
      <path d={path} className="wake-trail" />
      {points.map((p) => (
        <g key={p.day}>
          <title>{`${formatDay(p.day)} — ${p.active ? 'jour d’étude' : 'pas d’étude'}`}</title>
          <circle cx={p.x} cy={p.y} r={p.isToday ? 9 : 6} className={p.active ? 'wake-buoy is-active' : 'wake-buoy'} />
          {p.isToday && <circle cx={p.x} cy={p.y} r={14} className="wake-today" />}
        </g>
      ))}
    </svg>
  );
}

function formatDay(day: LocalDay): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
