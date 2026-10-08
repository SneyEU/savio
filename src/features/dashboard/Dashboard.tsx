import { useEffect, useState } from 'react';
import { MasteryBar } from '../../components/ui/MasteryBar';
import { Wake } from '../../components/ui/Wake';
import { subjectMeta } from '../../core/content/catalog';
import { hasStarterContent } from '../../core/content/starterDecks';
import type { DailyActivity } from '../../core/domain/types';
import type { SessionPlan } from '../../core/engine/sessionPlanner';
import { toLocalDay } from '../../core/gamification/streak';
import { actions, services, useApp } from '../../app/store';

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 5 || h >= 18) return 'Bonsoir';
  return 'Bonjour';
}

export function Dashboard() {
  const profile = useApp((s) => s.profile);
  const progress = useApp((s) => s.progress);
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [plan, setPlan] = useState<SessionPlan | null>(null);

  useEffect(() => {
    const svc = services();
    void svc.repos.activity.list().then(setActivities);
    void svc.engine.planToday(profile?.dailyGoalMinutes ?? 15).then(setPlan);
  }, [progress, profile]);

  if (!progress || !profile) return null;
  const now = services().clock.now();
  const goalRatio = Math.min(1, progress.todayMinutes / Math.max(1, progress.dailyGoalMinutes));
  const sessionSize = plan ? plan.dueCount + plan.newCount : 0;

  return (
    <div className="page">
      <header className="dash-head">
        <h1>
          {greeting(now)}, {profile.displayName}.
        </h1>
        <p className="muted">{now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </header>

      <section className="wake-panel" aria-labelledby="wake-title">
        <div className="wake-figures">
          <div>
            <h2 id="wake-title" className="wake-streak">
              {progress.streak > 0 ? `${progress.streak} ${progress.streak > 1 ? 'jours' : 'jour'}` : 'Jour 1'}
            </h2>
            <p className="muted">{progress.streak > 0 ? 'de suite. Garde le cap.' : 'Une première session aujourd’hui lance ta série.'}</p>
          </div>
          <div className="goal">
            <div className="goal-bar" role="progressbar" aria-valuemin={0} aria-valuemax={progress.dailyGoalMinutes} aria-valuenow={progress.todayMinutes}>
              <span style={{ width: `${goalRatio * 100}%` }} />
            </div>
            <p className="muted">
              {progress.todayMinutes} / {progress.dailyGoalMinutes} min aujourd’hui · niveau {progress.level.level} · {progress.totalXp} XP
            </p>
          </div>
        </div>
        <Wake activities={activities} today={toLocalDay(now)} />
      </section>

      <section className="next-session">
        <div className="stack">
          <h2>{sessionSize > 0 ? 'Ta prochaine session' : 'Tout est à jour'}</h2>
          <p>{plan?.rationale ?? 'Calcul de ta session…'}</p>
          {plan && sessionSize > 0 && <p className="muted">Environ {plan.estimatedMinutes} min.</p>}
        </div>
        <div className="row">
          <button type="button" className="btn btn-primary" disabled={sessionSize === 0} onClick={() => actions.navigate('review')}>
            {sessionSize > 0 ? `Réviser ${sessionSize} élément${sessionSize > 1 ? 's' : ''}` : 'Rien à réviser'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => actions.navigate('assistant')}>
            Demander au tuteur
          </button>
        </div>
      </section>

      <section className="stack" aria-labelledby="subjects-title">
        <h3 id="subjects-title">Tes matières</h3>
        <ul className="subject-list">
          {progress.recommendations.map((r) => {
            const meta = subjectMeta(r.subjectId);
            return (
              <li key={r.subjectId}>
                <span className="subject-emoji" aria-hidden="true">
                  {meta?.emoji}
                </span>
                <span className="subject-name">{meta?.label ?? r.subjectId}</span>
                <span className="muted subject-status">
                  {r.action === 'review' && `${r.dueCount} à réviser`}
                  {r.action === 'learn' && `${r.newAvailable} nouveauté${r.newAvailable > 1 ? 's' : ''}`}
                  {r.action === 'up_to_date' && (hasStarterContent(r.subjectId) ? 'À jour' : 'Disponible avec le tuteur')}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="stack" aria-labelledby="mastery-title">
        <h3 id="mastery-title">Ce que tu retiens</h3>
        <MasteryBar distribution={progress.mastery} />
      </section>
    </div>
  );
}
