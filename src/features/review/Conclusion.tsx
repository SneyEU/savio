import { useEffect, useRef, useState } from 'react';
import { CountUp } from '../../components/fx/CountUp';
import { burst } from '../../components/fx/effects';
import { Icon } from '../../components/ui/Icon';
import { subjectColor } from '../../core/content/catalog';
import type { MasteryStage, SubjectId } from '../../core/domain/types';
import type { GoalStatus } from '../../core/gamification/goals';
import type { LevelProgress } from '../../core/gamification/xp';
import { MASTERY_LABELS_FR } from '../../core/srs/mastery';
import { actions } from '../../app/store';

export interface SessionReport {
  reviewed: number;
  correct: number;
  xp: number;
  bestCombo: number;
  mistakes: { id: string; front: string; back: string }[];
  skills: { id: string; title: string; subjectId: SubjectId; before: MasteryStage; after: MasteryStage }[];
}

const STAGE_RANK: Record<MasteryStage, number> = { new: 0, learning: 1, fragile: 2, known: 3, mastered: 4 };

/**
 * La séquence de fin de séance, jouée en plusieurs temps :
 * précision → XP → niveau (avec cérémonie si on monte) → compétences → erreurs → suite conseillée.
 */
export function Conclusion({
  report,
  goal,
  levelBefore,
  levelAfter,
}: {
  report: SessionReport;
  goal: GoalStatus;
  levelBefore?: LevelProgress;
  levelAfter?: LevelProgress;
}) {
  const accuracy = report.reviewed > 0 ? report.correct / report.reviewed : 0;
  const leveledUp = !!levelBefore && !!levelAfter && levelAfter.level > levelBefore.level;
  const [showLevelUp, setShowLevelUp] = useState(false);
  const ringRef = useRef<HTMLDivElement>(null);
  const C = 2 * Math.PI * 52;

  useEffect(() => {
    if (report.reviewed === 0) return;
    const timers = [
      window.setTimeout(() => goal.reached && burst(undefined, 'small'), 900),
      leveledUp ? window.setTimeout(() => setShowLevelUp(true), 1500) : 0,
      leveledUp ? window.setTimeout(() => burst(undefined, 'big'), 1650) : 0,
    ];
    return () => timers.forEach((t) => t && clearTimeout(t));
  }, [report.reviewed, goal.reached, leveledUp]);

  if (report.reviewed === 0) {
    return (
      <div className="conclusion">
        <h1 className="conclusion-title">Rien à réviser pour l’instant.</h1>
        <p className="muted">Tes prochaines cartes reviendront juste avant que tu les oublies. En attendant, le tuteur peut t’apprendre autre chose.</p>
        <div className="conclusion-actions">
          <button type="button" className="btn btn-primary" onClick={() => actions.navigate('assistant')}>
            Parler au tuteur
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => actions.navigate('dashboard')}>
            Retour à l’accueil
          </button>
        </div>
      </div>
    );
  }

  const improved = report.skills.filter((s) => STAGE_RANK[s.after] > STAGE_RANK[s.before]);
  const nextHint =
    report.mistakes.length > 0
      ? `${report.mistakes.length} carte${report.mistakes.length > 1 ? 's' : ''} à consolider : elles reviendront en priorité.`
      : goal.reached
        ? 'Sans faute. Demain, Savio augmentera un peu la difficulté.'
        : `Encore ${goal.remainingMinutes} min pour atteindre ton objectif du jour.`;

  return (
    <div className="conclusion">
      <p className="conclusion-kicker seq" style={{ ['--d' as string]: 0 }}>
        {goal.reached ? 'Objectif du jour atteint' : 'Séance terminée'}
      </p>
      <h1 className="conclusion-title seq" style={{ ['--d' as string]: 1 }}>
        {accuracy === 1 ? 'Parfait.' : accuracy >= 0.8 ? 'Très solide.' : accuracy >= 0.5 ? 'Ça progresse.' : 'Bon entraînement.'}
      </h1>

      <div className="conclusion-figures">
        <div ref={ringRef} className="fig fig-ring seq" style={{ ['--d' as string]: 2 }}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle cx="60" cy="60" r="52" className="ring-track" />
            <circle cx="60" cy="60" r="52" className="ring-fill" strokeDasharray={C} style={{ ['--target' as string]: `${C * (1 - accuracy)}` }} transform="rotate(-90 60 60)" />
          </svg>
          <span className="fig-value">
            <CountUp value={Math.round(accuracy * 100)} duration={1200} />%
          </span>
          <span className="fig-label">de réussite</span>
        </div>

        <div className="fig seq" style={{ ['--d' as string]: 3 }}>
          <span className="fig-value fig-xp">
            +<CountUp value={report.xp} duration={1200} />
          </span>
          <span className="fig-label">XP gagnés</span>
        </div>

        <div className="fig seq" style={{ ['--d' as string]: 4 }}>
          <span className="fig-value">{report.reviewed}</span>
          <span className="fig-label">cartes · meilleure série ×{report.bestCombo}</span>
        </div>

        {levelAfter && (
          <div className="fig fig-level seq" style={{ ['--d' as string]: 5 }}>
            <span className="fig-value">Niv. {levelAfter.level}</span>
            <span className="level-bar" aria-hidden="true">
              <span style={{ ['--from' as string]: leveledUp ? '0%' : `${(levelBefore?.ratio ?? 0) * 100}%`, ['--to' as string]: `${levelAfter.ratio * 100}%` }} />
            </span>
            <span className="fig-label">
              {levelAfter.xpForNextLevel - levelAfter.xpIntoLevel} XP avant le niveau {levelAfter.level + 1}
            </span>
          </div>
        )}
      </div>

      <div className="conclusion-columns">
        <section className="seq" style={{ ['--d' as string]: 6 }} aria-labelledby="skills-title">
          <h2 id="skills-title" className="section-title small">
            Compétences travaillées
          </h2>
          <ul className="skill-moves">
            {report.skills.map((s) => (
              <li key={s.id} style={{ ['--planet' as string]: subjectColor(s.subjectId) }}>
                <span className="skill-name">{s.title}</span>
                <span className={STAGE_RANK[s.after] > STAGE_RANK[s.before] ? 'skill-step is-up' : 'skill-step'}>
                  {MASTERY_LABELS_FR[s.before]} <Icon name="arrow" size={14} /> {MASTERY_LABELS_FR[s.after]}
                </span>
              </li>
            ))}
          </ul>
          {improved.length > 0 && <p className="muted small-print">{improved.length} compétence{improved.length > 1 ? 's ont' : ' a'} gagné un échelon.</p>}
        </section>

        <section className="seq" style={{ ['--d' as string]: 7 }} aria-labelledby="mistakes-title">
          <h2 id="mistakes-title" className="section-title small">
            {report.mistakes.length > 0 ? 'À consolider' : 'Erreurs'}
          </h2>
          {report.mistakes.length > 0 ? (
            <ul className="mistake-list">
              {report.mistakes.map((m) => (
                <li key={m.id}>
                  <span>{m.front}</span>
                  <strong>{m.back}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Aucune. Tout est passé du premier coup.</p>
          )}
        </section>
      </div>

      <p className="conclusion-next seq" style={{ ['--d' as string]: 8 }}>
        <Icon name="spark" size={18} /> {nextHint}
      </p>

      <div className="conclusion-actions seq" style={{ ['--d' as string]: 9 }}>
        <button type="button" className="btn btn-primary" onClick={() => actions.startReview()}>
          <Icon name="replay" size={18} /> {goal.reached ? 'Continuer 5 min de plus' : 'Continuer vers mon objectif'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => actions.navigate('dashboard')}>
          Retour à l’accueil
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => actions.navigate('assistant')}>
          Approfondir avec le tuteur
        </button>
      </div>

      {showLevelUp && levelAfter && (
        <div className="levelup" role="dialog" aria-label={`Niveau ${levelAfter.level} atteint`} onClick={() => setShowLevelUp(false)}>
          <div className="levelup-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="levelup-kicker">Nouveau niveau</p>
          <p className="levelup-number">{levelAfter.level}</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowLevelUp(false)}>
            Continuer
          </button>
        </div>
      )}
    </div>
  );
}
