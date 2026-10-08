import { useCallback, useEffect, useRef, useState } from 'react';
import { subjectMeta } from '../../core/content/catalog';
import { Rating, type ReviewItem } from '../../core/domain/types';
import { actions, services, useApp } from '../../app/store';
import { goalStatus, nextSessionMinutes } from '../../core/gamification/goals';

const RATINGS: { rating: Rating; label: string; hint: string; key: string }[] = [
  { rating: Rating.Again, label: 'À revoir', hint: 'Je ne savais pas', key: '1' },
  { rating: Rating.Hard, label: 'Difficile', hint: 'Avec effort', key: '2' },
  { rating: Rating.Good, label: 'Bien', hint: 'Je savais', key: '3' },
  { rating: Rating.Easy, label: 'Facile', hint: 'Immédiat', key: '4' },
];

interface Summary {
  reviewed: number;
  correct: number;
  xp: number;
}

export function ReviewSession() {
  const profile = useApp((s) => s.profile);
  const progress = useApp((s) => s.progress);
  // Figé au montage : la durée de la séance ne change pas pendant qu'on révise.
  const [sessionMinutes] = useState(() => nextSessionMinutes(progress?.todayMinutes ?? 0, profile?.dailyGoalMinutes ?? 15));
  const [queue, setQueue] = useState<ReviewItem[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [summary, setSummary] = useState<Summary>({ reviewed: 0, correct: 0, xp: 0 });
  const [busy, setBusy] = useState(false);
  const shownAt = useRef(Date.now());
  const startedAt = useRef(Date.now());
  const relearned = useRef(new Set<string>());
  const finished = useRef(false);

  useEffect(() => {
    void services()
      .engine.planToday(sessionMinutes)
      .then((plan) => {
        setQueue(plan.queue);
        shownAt.current = Date.now();
      });
  }, [sessionMinutes]);

  const current = queue?.[0];

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    const minutes = (Date.now() - startedAt.current) / 60_000;
    if (summary.reviewed > 0) await services().engine.recordStudyTime(Math.max(1, Math.round(minutes)));
    await actions.refresh();
  }, [summary.reviewed]);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!current || busy) return;
      setBusy(true);
      const skill = (await services().repos.skills.list(current.subjectId)).find((s) => s.id === current.skillId);
      const outcome = await services().engine.recordReview(
        current.id,
        rating,
        Date.now() - shownAt.current,
        rating === Rating.Again ? { tag: skill?.title ?? current.skillId, expected: current.back, given: '' } : undefined,
      );
      setSummary((s) => ({ reviewed: s.reviewed + 1, correct: s.correct + (rating === Rating.Again ? 0 : 1), xp: s.xp + outcome.xpGained }));
      setQueue((q) => {
        const rest = (q ?? []).slice(1);
        // Un élément oublié revient une fois en fin de session pour être réappris tout de suite.
        if (rating === Rating.Again && !relearned.current.has(current.id)) {
          relearned.current.add(current.id);
          return [...rest, outcome.item];
        }
        return rest;
      });
      setRevealed(false);
      setBusy(false);
      shownAt.current = Date.now();
    },
    [current, busy],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current) return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const match = RATINGS.find((r) => r.key === e.key);
        if (match) void rate(match.rating);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed, rate]);

  useEffect(() => {
    if (queue && queue.length === 0) void finish();
  }, [queue, finish]);

  if (!queue) return <div className="page muted">Préparation de ta session…</div>;

  if (!current) {
    const rate = summary.reviewed > 0 ? Math.round((summary.correct / summary.reviewed) * 100) : 0;
    const goal = goalStatus(progress?.todayMinutes ?? 0, profile?.dailyGoalMinutes ?? 15);
    return (
      <div className="page review-done">
        <h1>{summary.reviewed > 0 ? (goal.reached ? 'Objectif du jour atteint !' : 'Séance terminée.') : 'Rien à réviser maintenant.'}</h1>
        {summary.reviewed > 0 ? (
          <p>
            {summary.reviewed} révision{summary.reviewed > 1 ? 's' : ''}, {rate} % de réussite, +{summary.xp} XP.{' '}
            {goal.reached
              ? goal.extraMinutes > 0
                ? `${goal.extraMinutes} min de plus que ton objectif aujourd’hui. Bravo.`
                : 'Ta série continue. Tu peux t’arrêter là, ou continuer si tu en as envie.'
              : `Encore ${goal.remainingMinutes} min pour atteindre ton objectif du jour.`}
          </p>
        ) : (
          <p className="muted">Tes prochaines révisions apparaîtront ici dès qu’elles seront dues. Tu peux aussi apprendre avec le tuteur.</p>
        )}
        <div className="row">
          {summary.reviewed > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => actions.startReview()}>
              {goal.reached ? 'Continuer 5 min de plus' : 'Continuer vers mon objectif'}
            </button>
          )}
          <button type="button" className={summary.reviewed > 0 ? 'btn btn-secondary' : 'btn btn-primary'} onClick={() => actions.navigate('dashboard')}>
            Retour à l’accueil
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => actions.navigate('assistant')}>
            Approfondir avec le tuteur
          </button>
        </div>
      </div>
    );
  }

  const subject = subjectMeta(current.subjectId);
  const isNew = current.srs.reps === 0;

  return (
    <div className="page review">
      <div className="review-top row">
        <span className="muted">
          {subject?.emoji} {subject?.label} · {isNew ? 'nouveau' : 'révision'} · {queue.length} restant{queue.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={async () => {
            await finish();
            actions.navigate('dashboard');
          }}
        >
          Terminer
        </button>
      </div>

      <article className="flashcard" aria-live="polite">
        <p className="flashcard-front">{current.front}</p>
        {revealed ? (
          <div className="flashcard-back">
            <p className="flashcard-answer">{current.back}</p>
            {current.note && <p className="muted">{current.note}</p>}
            {current.source && <p className="flashcard-source">Source : {current.source}</p>}
          </div>
        ) : (
          <button type="button" className="btn btn-secondary reveal" onClick={() => setRevealed(true)} autoFocus>
            Afficher la réponse <kbd>Espace</kbd>
          </button>
        )}
      </article>

      {revealed && (
        <div className="ratings" role="group" aria-label="Comment t’en es-tu souvenu ?">
          {RATINGS.map((r) => (
            <button key={r.rating} type="button" className={`rating rating-${r.rating}`} disabled={busy} onClick={() => rate(r.rating)}>
              <strong>{r.label}</strong>
              <span>{r.hint}</span>
              <kbd>{r.key}</kbd>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
