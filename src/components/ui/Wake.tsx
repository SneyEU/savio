import { previousDay } from '../../core/gamification/streak';
import type { DailyActivity, LocalDay } from '../../core/domain/types';

interface WakeProps {
  activities: readonly DailyActivity[];
  today: LocalDay;
  days?: number;
}

const WIDTH = 640;
const HEIGHT = 120;

/**
 * La constellation des 14 derniers jours : chaque jour d'étude allume une étoile,
 * et les jours consécutifs se relient en traits lumineux. La dernière étoile, c'est aujourd'hui.
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
    const x = 24 + (i * (WIDTH - 48)) / (days - 1);
    // Tracé pseudo-aléatoire mais stable : une vraie forme de constellation, pas une sinusoïde régulière.
    const y = HEIGHT / 2 + Math.sin(i * 1.7) * 22 + Math.cos(i * 0.6) * 12;
    const activity = byDay.get(day);
    const minutes = activity?.minutes ?? 0;
    const active = !!activity && (activity.reviews > 0 || activity.minutes > 0);
    return { day, x, y, active, isToday: day === today, size: active ? 5 + Math.min(5, minutes / 6) : 2.5 };
  });

  const segments = points.slice(1).map((p, i) => ({ from: points[i]!, to: p, lit: points[i]!.active && p.active }));
  const activeCount = points.filter((p) => p.active).length;

  return (
    <svg className="wake" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`${activeCount} jour(s) d’étude sur les ${days} derniers jours`}>
      <defs>
        <radialGradient id="star-glow">
          <stop offset="0%" stopColor="#fff6d6" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#ffb938" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffb938" stopOpacity="0" />
        </radialGradient>
      </defs>
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.from.x}
          y1={s.from.y}
          x2={s.to.x}
          y2={s.to.y}
          className={s.lit ? 'wake-link is-lit' : 'wake-link'}
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
      {points.map((p, i) => (
        <g key={p.day} className="wake-star-group" style={{ animationDelay: `${i * 60}ms` }}>
          <title>{`${formatDay(p.day)} — ${p.active ? 'jour d’étude' : 'pas d’étude'}`}</title>
          {p.active && <circle cx={p.x} cy={p.y} r={p.size * 3.2} fill="url(#star-glow)" className="wake-halo" />}
          <circle cx={p.x} cy={p.y} r={p.size} className={p.active ? 'wake-star is-active' : 'wake-star'} />
          {p.isToday && <circle cx={p.x} cy={p.y} r={16} className="wake-today" />}
        </g>
      ))}
    </svg>
  );
}

function formatDay(day: LocalDay): string {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
