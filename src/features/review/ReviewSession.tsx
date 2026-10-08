import { useCallback, useEffect, useRef, useState } from 'react';
import { burst, centerOf, floatText } from '../../components/fx/effects';
import { useTilt } from '../../components/fx/motion';
import { Icon } from '../../components/ui/Icon';
import { subjectColor, subjectMeta } from '../../core/content/catalog';
import { Rating, type MasteryStage, type ReviewItem } from '../../core/domain/types';
import { goalStatus, nextSessionMinutes } from '../../core/gamification/goals';
import { MASTERY_LABELS_FR, masteryStage } from '../../core/srs/mastery';
import { actions, services, useApp } from '../../app/store';
import { Conclusion, type SessionReport } from './Conclusion';

const RATINGS: { rating: Rating; label: string; hint: string; key: string }[] = [
  { rating: Rating.Again, label: 'À revoir', hint: 'Je ne savais pas', key: '1' },
  { rating: Rating.Hard, label: 'Difficile', hint: 'Avec effort', key: '2' },
  { rating: Rating.Good, label: 'Bien', hint: 'Je savais', key: '3' },
  { rating: Rating.Easy, label: 'Facile', hint: 'Immédiat', key: '4' },
];

/** Durée de sortie de la carte avant l'arrivée de la suivante (doit correspondre au CSS). */
const LEAVE_MS = 420;

type Feedback = 'good' | 'bad' | null;

export function ReviewSession() {
  const profile = useApp((s) => s.profile);
  const progress = useApp((s) => s.progress);
  const subjectFilter = useApp((s) => s.reviewSubject);
  // Figés au montage : la séance ne change pas de taille ni de référence de niveau en cours de route.
  const [sessionMinutes] = useState(() => nextSessionMinutes(progress?.todayMinutes ?? 0, profile?.dailyGoalMinutes ?? 15));
  const [levelBefore] = useState(() => progress?.level);
  const [queue, setQueue] = useState<ReviewItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState(false);
  const [combo, setCombo] = useState(0);
  const [xp, setXp] = useState(0);
  const [report, setReport] = useState<SessionReport>({ reviewed: 0, correct: 0, xp: 0, bestCombo: 0, mistakes: [], skills: [] });
  const [ended, setEnded] = useState(false);
  const shownAt = useRef(Date.now());
  const startedAt = useRef(Date.now());
  const relearned = useRef(new Set<string>());
  const finished = useRef(false);
  const cardRef = useTilt<HTMLDivElement>(6);
  const xpRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    void services()
      .engine.planToday(sessionMinutes, subjectFilter)
      .then((plan) => {
        setQueue(plan.queue);
        setTotal(plan.queue.length);
        shownAt.current = Date.now();
      });
  }, [sessionMinutes, subjectFilter]);

  const current = queue?.[0];

  const finish = useCallback(async () => {
    if (finished.current) return;
    finished.current = true;
    const minutes = (Date.now() - startedAt.current) / 60_000;
    if (report.reviewed > 0) await services().engine.recordStudyTime(Math.max(1, Math.round(minutes)));
    await actions.refresh();
    setEnded(true);
  }, [report.reviewed]);

  const rate = useCallback(
    async (rating: Rating) => {
      if (!current || busy) return;
      setBusy(true);
      const svc = services();
      const skill = (await svc.repos.skills.list(current.subjectId)).find((s) => s.id === current.skillId);
      const outcome = await svc.engine.recordReview(
        current.id,
        rating,
        Date.now() - shownAt.current,
        rating === Rating.Again ? { tag: skill?.title ?? current.skillId, expected: current.back, given: '' } : undefined,
      );
      const success = rating !== Rating.Again;
      const nextCombo = success ? combo + 1 : 0;
      const origin = centerOf(cardRef.current);

      setFeedback(success ? 'good' : 'bad');
      setCombo(nextCombo);
      setXp((v) => v + outcome.xpGained);
      floatText(`+${outcome.xpGained} XP`, origin);
      if (success) burst(origin, 'small');
      if (nextCombo >= 3 && nextCombo % 3 === 0) floatText(`Série de ${nextCombo} !`, centerOf(xpRef.current), 'combo');

      const before: MasteryStage = masteryStage(current.srs);
      const after: MasteryStage = masteryStage(outcome.item.srs);
      setReport((r) => ({
        reviewed: r.reviewed + 1,
        correct: r.correct + (success ? 1 : 0),
        xp: r.xp + outcome.xpGained,
        bestCombo: Math.max(r.bestCombo, nextCombo),
        mistakes:
          success || r.mistakes.some((m) => m.id === current.id) ? r.mistakes : [...r.mistakes, { id: current.id, front: current.front, back: current.back }],
        skills: mergeSkill(r.skills, { id: current.skillId, title: skill?.title ?? current.skillId, subjectId: current.subjectId, before, after }),
      }));

      // La carte sort (envolée ou glissement), puis la suivante arrive.
      window.setTimeout(() => {
        setQueue((q) => {
          const rest = (q ?? []).slice(1);
          if (!success && !relearned.current.has(current.id)) {
            relearned.current.add(current.id);
            setTotal((t) => t + 1);
            return [...rest, outcome.item];
          }
          return rest;
        });
        setRevealed(false);
        setFeedback(null);
        setBusy(false);
        shownAt.current = Date.now();
      }, LEAVE_MS);
    },
    [current, busy, combo, cardRef],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!current || busy) return;
      if (!revealed && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        setRevealed(true);
      } else if (revealed) {
        const match = RATINGS.find((r) => r.key === e.key);
        if (match) void rate(match.rating);
      }
      if (e.key === 'Escape') void finish().then(() => actions.navigate('dashboard'));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, revealed, rate, busy, finish]);

  useEffect(() => {
    if (queue && queue.length === 0) void finish();
  }, [queue, finish]);

  if (!queue) {
    return (
      <div className="focus focus-loading" aria-busy="true">
        <div className="assemble" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="muted">Préparation de ta séance…</p>
      </div>
    );
  }

  if (!current) {
    if (!ended) return <div className="focus" aria-busy="true" />;
    const goal = goalStatus(progress?.todayMinutes ?? 0, profile?.dailyGoalMinutes ?? 15);
    return <Conclusion report={report} goal={goal} levelBefore={levelBefore} levelAfter={progress?.level} />;
  }

  const subject = subjectMeta(current.subjectId);
  const done = report.reviewed;
  const isNew = current.srs.reps === 0;

  return (
    <div className="focus" style={{ ['--subject' as string]: subjectColor(current.subjectId) }}>
      <header className="focus-bar">
        <button
          type="button"
          className="icon-btn"
          aria-label="Terminer la séance"
          onClick={async () => {
            await finish();
            actions.navigate('dashboard');
          }}
        >
          <Icon name="close" />
        </button>
        <div className="beam" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done} aria-label="Progression de la séance">
          <span style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }} />
        </div>
        <span className={combo >= 3 ? 'combo is-hot' : 'combo'} aria-live="polite">
          {combo >= 2 ? `×${combo}` : ''}
        </span>
        <span ref={xpRef} className="focus-xp" aria-label={`${xp} XP gagnés`}>
          +{xp} XP
        </span>
      </header>

      <main className="focus-stage">
        <p className="focus-context">
          <span className="focus-glyph">{subject?.glyph}</span>
          {subject?.label} · {isNew ? 'nouvelle carte' : `révision · ${MASTERY_LABELS_FR[masteryStage(current.srs)].toLowerCase()}`}
        </p>

        <div ref={cardRef} className="card-tilt">
        <div
          key={current.id + String(relearned.current.has(current.id))}
          className={['card3d', revealed ? 'is-flipped' : '', feedback === 'good' ? 'is-good' : '', feedback === 'bad' ? 'is-bad' : ''].join(' ')}
          onClick={() => !revealed && setRevealed(true)}
        >
          <div className="card3d-inner">
            <div className="card-face card-front">
              <p className={current.front.length > 70 ? 'card-question is-long' : 'card-question'}>{current.front}</p>
              <span className="card-hint">
                <kbd>Espace</kbd> ou clic pour retourner
              </span>
            </div>
            <div className="card-face card-back" aria-hidden={!revealed}>
              <p className="card-question small">{current.front}</p>
              <p className={current.back.length > 60 ? 'card-answer is-long' : 'card-answer'}>{current.back}</p>
              {current.note && <p className="card-note">{current.note}</p>}
              {current.source && <p className="card-source">Source · {current.source}</p>}
            </div>
          </div>
        </div>
        </div>

        <div className="focus-actions">
          {feedback === 'bad' && <p className="feedback-line">Pas grave : elle revient dans quelques minutes. C’est comme ça qu’on retient.</p>}
          {revealed ? (
            <div className="ratings" role="group" aria-label="Comment t’en es-tu souvenu ?">
              {RATINGS.map((r, i) => (
                <button
                  key={r.rating}
                  type="button"
                  className={`rating rating-${r.rating}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                  disabled={busy}
                  onClick={() => rate(r.rating)}
                >
                  <strong>{r.label}</strong>
                  <span>{r.hint}</span>
                  <kbd>{r.key}</kbd>
                </button>
              ))}
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-reveal" onClick={() => setRevealed(true)} autoFocus>
              Retourner la carte
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function mergeSkill(list: SessionReport['skills'], entry: SessionReport['skills'][number]): SessionReport['skills'] {
  const existing = list.find((s) => s.id === entry.id);
  if (!existing) return [...list, entry];
  return list.map((s) => (s.id === entry.id ? { ...s, after: entry.after } : s));
}
