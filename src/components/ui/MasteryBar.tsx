import type { MasteryStage } from '../../core/domain/types';
import { MASTERY_LABELS_FR } from '../../core/srs/mastery';

const ORDER: MasteryStage[] = ['mastered', 'known', 'fragile', 'learning', 'new'];

/** Répartition des éléments par échelon de maîtrise, du plus solide au plus neuf. */
export function MasteryBar({ distribution }: { distribution: Record<MasteryStage, number> }) {
  const total = ORDER.reduce((sum, s) => sum + distribution[s], 0);
  if (total === 0) return <p className="muted">Aucun élément pour le moment.</p>;

  return (
    <div className="mastery">
      <div className="mastery-bar" role="img" aria-label={ORDER.map((s) => `${MASTERY_LABELS_FR[s]} : ${distribution[s]}`).join(', ')}>
        {ORDER.filter((s) => distribution[s] > 0).map((s) => (
          <span key={s} className={`mastery-seg m-${s}`} style={{ flexGrow: distribution[s] }} />
        ))}
      </div>
      <ul className="mastery-legend">
        {ORDER.map((s) => (
          <li key={s}>
            <span className={`mastery-dot m-${s}`} aria-hidden="true" />
            {MASTERY_LABELS_FR[s]} <strong>{distribution[s]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
