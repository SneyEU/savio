import type { MasteryStage } from '../../core/domain/types';
import { MASTERY_LABELS_FR } from '../../core/srs/mastery';

const ORDER: MasteryStage[] = ['new', 'learning', 'fragile', 'known', 'mastered'];
const MAX_DOTS = 48;

/**
 * Le spectre de maîtrise : chaque carte est une étoile, rangée par éclat,
 * de l'étoile éteinte (nouveau) à l'étoile brillante (maîtrisé). On voit d'un coup d'œil où se trouve la masse.
 */
export function MasteryBar({ distribution }: { distribution: Record<MasteryStage, number> }) {
  const total = ORDER.reduce((sum, s) => sum + distribution[s], 0);
  if (total === 0) return <p className="muted">Ta constellation est vide pour l’instant. Ta première séance va l’allumer.</p>;

  return (
    <div className="mastery" role="img" aria-label={ORDER.map((s) => `${MASTERY_LABELS_FR[s]} : ${distribution[s]}`).join(', ')}>
      {ORDER.map((stage, col) => {
        const count = distribution[stage];
        const shown = Math.min(MAX_DOTS, count);
        return (
          <div key={stage} className={`mastery-col m-${stage}`}>
            <div className="mastery-dots">
              {Array.from({ length: shown }, (_, i) => (
                <span key={i} className="mastery-dot" style={{ animationDelay: `${col * 90 + i * 14}ms` }} />
              ))}
              {count > MAX_DOTS && <span className="mastery-more">+{count - MAX_DOTS}</span>}
            </div>
            <strong className="mastery-count">{count}</strong>
            <span className="mastery-label">{MASTERY_LABELS_FR[stage]}</span>
          </div>
        );
      })}
    </div>
  );
}
