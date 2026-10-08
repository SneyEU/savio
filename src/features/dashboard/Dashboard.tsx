import { useEffect, useState } from 'react';
import { CountUp } from '../../components/fx/CountUp';
import { useMagnet, useReveal } from '../../components/fx/motion';
import { SplitText } from '../../components/fx/SplitText';
import { Orrery } from '../../components/Orrery';
import { Icon } from '../../components/ui/Icon';
import { MasteryBar } from '../../components/ui/MasteryBar';
import { Wake } from '../../components/ui/Wake';
import type { DailyActivity } from '../../core/domain/types';
import type { SessionPlan } from '../../core/engine/sessionPlanner';
import { goalStatus, nextSessionMinutes } from '../../core/gamification/goals';
import { toLocalDay } from '../../core/gamification/streak';
import { actions, services, useApp } from '../../app/store';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5 || h >= 18) return 'Bonsoir';
  return 'Bonjour';
}

/** Une phrase liée à l'état réel de l'apprenant, jamais générique. */
function statusLine(streak: number, reached: boolean, due: number): string {
  if (reached) return 'Objectif du jour atteint. Tout ce que tu fais maintenant, c’est du bonus.';
  if (due > 0) return `${due} carte${due > 1 ? 's' : ''} s’apprête${due > 1 ? 'nt' : ''} à sortir de ta mémoire. C’est le bon moment pour les rattraper.`;
  if (streak === 0) return 'Ton système est prêt. Quelques minutes suffisent pour lancer ta série.';
  return `${streak} jour${streak > 1 ? 's' : ''} d’affilée. Garde l’orbite.`;
}

export function Dashboard() {
  const profile = useApp((s) => s.profile);
  const progress = useApp((s) => s.progress);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [plan, setPlan] = useState<SessionPlan | null>(null);
  const launchRef = useMagnet<HTMLButtonElement>(0.18);
  const skyRef = useReveal<HTMLElement>();
  const spectrumRef = useReveal<HTMLElement>();

  useEffect(() => {
    const svc = services();
    void svc.repos.activity.list().then(setActivities);
    void svc.engine.planToday(nextSessionMinutes(progress?.todayMinutes ?? 0, profile?.dailyGoalMinutes ?? 15)).then(setPlan);
  }, [progress, profile]);

  if (!progress || !profile) return null;
  const now = services().clock.now();
  const goal = goalStatus(progress.todayMinutes, progress.dailyGoalMinutes);
  const sessionSize = plan ? plan.dueCount + plan.newCount : 0;

  return (
    <div className="dash">
      <section className="dash-stage">
        <div className="dash-intro">
          <p className="eyebrow-date">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <SplitText text={`${greeting(now)} ${profile.displayName}`} className="dash-title" />
          <p className="dash-status">{statusLine(progress.streak, goal.reached, progress.dueCount)}</p>

          <div className="launch">
            <button
              ref={launchRef}
              type="button"
              className="btn btn-primary btn-launch"
              disabled={sessionSize === 0}
              onClick={() => actions.startReview()}
            >
              <span className="btn-launch-ring" aria-hidden="true" />
              <Icon name="play" size={20} />
              {sessionSize === 0 ? 'Rien à réviser' : goal.reached ? 'Séance bonus · 5 min' : 'Lancer la séance'}
            </button>
            <p className="launch-meta">
              {plan && sessionSize > 0 ? `${sessionSize} carte${sessionSize > 1 ? 's' : ''} · environ ${plan.estimatedMinutes} min · ${plan.rationale}` : 'Savi est à jour. Le tuteur peut te faire découvrir autre chose.'}
            </p>
            <button type="button" className="btn btn-ghost btn-arrow" onClick={() => actions.navigate('assistant')}>
              Parler au tuteur <Icon name="arrow" size={18} />
            </button>
          </div>

          <div
            className={goal.reached ? 'goal-meter is-reached' : 'goal-meter'}
            role="progressbar"
            aria-label="Objectif du jour"
            aria-valuemin={0}
            aria-valuemax={progress.dailyGoalMinutes}
            aria-valuenow={progress.todayMinutes}
          >
            <div className="goal-meter-track">
              <span style={{ width: `${goal.ratio * 100}%` }} />
            </div>
            <span className="goal-meter-text">
              <CountUp value={progress.todayMinutes} /> / {progress.dailyGoalMinutes} min
              {goal.extraMinutes > 0 && <em> +{goal.extraMinutes} bonus</em>}
            </span>
          </div>
        </div>

        <Orrery
          level={progress.level}
          totalXp={progress.totalXp}
          subjects={progress.recommendations}
          strength={progress.subjectStrength}
          onPick={(id) => actions.startReview(id)}
        />
      </section>

      <section ref={skyRef} className="sky reveal-on-scroll" aria-labelledby="streak-title">
        <div className="sky-figure">
          <span className="sky-number">
            <CountUp value={progress.streak} />
          </span>
          <h2 id="streak-title" className="sky-label">
            {progress.streak > 1 ? 'jours d’affilée' : progress.streak === 1 ? 'jour d’affilée' : 'jour : allume la première étoile'}
          </h2>
        </div>
        <Wake activities={activities} today={toLocalDay(now)} />
        <p className="sky-caption">Chaque jour d’étude allume une étoile. Les jours qui se suivent se relient.</p>
      </section>

      <section ref={spectrumRef} className="spectrum reveal-on-scroll" aria-labelledby="mastery-title">
        <h2 id="mastery-title" className="section-title">
          Ce que tu retiens
        </h2>
        <MasteryBar distribution={progress.mastery} />
      </section>
    </div>
  );
}
