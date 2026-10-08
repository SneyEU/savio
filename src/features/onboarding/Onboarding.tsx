import { useState } from 'react';
import { SplitText } from '../../components/fx/SplitText';
import { GoalPicker } from '../../components/GoalPicker';
import { Orrery } from '../../components/Orrery';
import { Icon } from '../../components/ui/Icon';
import { SubjectPicker } from '../../components/SubjectPicker';
import { subjectMeta } from '../../core/content/catalog';
import type { DeclaredLevel, Motivation, SubjectId } from '../../core/domain/types';
import { completeOnboarding, proposeDailyPlan, validateOnboarding, type OnboardingAnswers } from '../../core/engine/onboarding';
import { actions, services } from '../../app/store';

const STEPS = ['Bienvenue', 'Matières', 'Temps', 'Motivation', 'Ton plan'] as const;
const LEVELS: { id: DeclaredLevel; label: string }[] = [
  { id: 'beginner', label: 'Débutant' },
  { id: 'intermediate', label: 'Intermédiaire' },
  { id: 'advanced', label: 'Avancé' },
];
const MOTIVATIONS: { id: Motivation; label: string }[] = [
  { id: 'travel', label: 'Voyager' },
  { id: 'career', label: 'Travail et carrière' },
  { id: 'studies', label: 'Études' },
  { id: 'faith', label: 'Foi et spiritualité' },
  { id: 'family', label: 'Famille' },
  { id: 'curiosity', label: 'Curiosité' },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<OnboardingAnswers>({
    displayName: '',
    subjects: [],
    dailyGoalMinutes: 15,
    motivation: 'curiosity',
    longTermGoal: '',
  });

  const update = (patch: Partial<OnboardingAnswers>) => setAnswers((a) => ({ ...a, ...patch }));
  const levelOf = (id: SubjectId) => answers.subjects.find((s) => s.subjectId === id)?.level;
  const toggleSubject = (id: SubjectId) =>
    update({
      subjects: levelOf(id) ? answers.subjects.filter((s) => s.subjectId !== id) : [...answers.subjects, { subjectId: id, level: 'beginner' }],
    });
  const setLevel = (id: SubjectId, level: DeclaredLevel) =>
    update({ subjects: answers.subjects.map((s) => (s.subjectId === id ? { ...s, level } : s)) });

  const canContinue = [answers.displayName.trim().length > 0, answers.subjects.length > 0, true, true, true][step];

  async function finish() {
    const errors = validateOnboarding(answers);
    if (errors.length > 0) return setError(errors.join(' '));
    setBusy(true);
    try {
      const svc = services();
      await completeOnboarding(answers, svc.repos, svc.clock, svc.ids);
      await actions.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  // Le système se forme sous les yeux de l'utilisateur à mesure qu'il choisit ses matières.
  const preview = answers.subjects.map((s) => ({ subjectId: s.subjectId, dueCount: 0, newAvailable: 0, action: 'learn' as const }));

  return (
    <main className="onboarding">
      <div className="ob-preview" aria-hidden={preview.length === 0}>
        <Orrery
          level={{ level: 1, xpIntoLevel: 0, xpForNextLevel: 100, ratio: (step + 1) / STEPS.length }}
          totalXp={0}
          subjects={preview}
          strength={{}}
          onPick={() => undefined}
        />
      </div>

      <div className="ob-panel">
        <ol className="steps" aria-label="Étapes">
          {STEPS.map((label, i) => (
            <li key={label} aria-current={i === step ? 'step' : undefined} className={i < step ? 'done' : undefined}>
              <span className="step-index">{i + 1}</span>
              <span className="step-label">{label}</span>
            </li>
          ))}
        </ol>

        <div className="ob-step" key={step}>

        {step === 0 && (
          <section className="stack">
            <SplitText text="Construis ton système du savoir." className="ob-title" />
            <p className="muted">
              Savio organise tes révisions, t’accompagne avec un tuteur IA et garde toutes tes données sur cet ordinateur. Libre et gratuit.
            </p>
            <div className="field">
              <label htmlFor="name">Comment veux-tu qu’on t’appelle ?</label>
              <input
                id="name"
                className="input"
                autoFocus
                maxLength={40}
                value={answers.displayName}
                onChange={(e) => update({ displayName: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && canContinue && setStep(1)}
              />
            </div>
          </section>
        )}

        {step === 1 && (
          <section className="stack">
            <h2 className="ob-heading">Quelles planètes veux-tu explorer ?</h2>
            <p className="muted">Chaque matière devient une planète de ton système. Tu pourras en ajouter d’autres plus tard.</p>
            <SubjectPicker selected={new Set(answers.subjects.map((s) => s.subjectId))} onToggle={toggleSubject} />
            {answers.subjects.length > 0 && (
              <div className="stack">
                <span className="field-label">Ton niveau</span>
                {answers.subjects.map(({ subjectId, level }) => (
                  <div key={subjectId} className="row level-row">
                    <span className="level-subject">{subjectMeta(subjectId)?.glyph} {subjectMeta(subjectId)?.label}</span>
                    <div className="segmented" role="radiogroup" aria-label={`Niveau en ${subjectMeta(subjectId)?.label ?? subjectId}`}>
                      {LEVELS.map((l) => (
                        <button key={l.id} type="button" role="radio" aria-checked={level === l.id} onClick={() => setLevel(subjectId, l.id)}>
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="stack">
            <h2 className="ob-heading">Combien de temps par jour ?</h2>
            <p className="muted">Mieux vaut 10 minutes chaque jour qu’une heure par semaine : la régularité fait la mémoire.</p>
            <GoalPicker value={answers.dailyGoalMinutes} onChange={(m) => update({ dailyGoalMinutes: m })} />
          </section>
        )}

        {step === 3 && (
          <section className="stack">
            <h2 className="ob-heading">Qu’est-ce qui te motive ?</h2>
            <div className="choice-grid">
              {MOTIVATIONS.map((m) => (
                <button key={m.id} type="button" className="choice" aria-pressed={answers.motivation === m.id} onClick={() => update({ motivation: m.id })}>
                  {m.label}
                </button>
              ))}
            </div>
            <div className="field">
              <label htmlFor="goal">Ton objectif dans un an (facultatif)</label>
              <input
                id="goal"
                className="input"
                maxLength={160}
                placeholder="Ex. tenir une conversation en espagnol pendant mon voyage"
                value={answers.longTermGoal}
                onChange={(e) => update({ longTermGoal: e.target.value })}
              />
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="stack">
            <h2 className="ob-heading">Ton plan pour {answers.dailyGoalMinutes} minutes par jour</h2>
            <ul className="plan">
              {proposeDailyPlan(answers.dailyGoalMinutes).map((slot) => (
                <li key={slot.label} style={{ ['--share' as string]: `${(slot.minutes / answers.dailyGoalMinutes) * 100}%` }}>
                  <span>{slot.label}</span>
                  <strong>{slot.minutes} min</strong>
                </li>
              ))}
            </ul>
            <p className="muted">Le plan s’ajuste ensuite à tes réussites et à tes oublis. Tu peux le modifier dans les réglages.</p>
          </section>
        )}

        </div>

        {error && <p className="notice notice-danger">{error}</p>}

        <div className="row onboarding-actions">
          {step > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={busy}>
              Retour
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" disabled={!canContinue} onClick={() => setStep(step + 1)}>
              Continuer <Icon name="arrow" size={18} />
            </button>
          ) : (
            <button type="button" className="btn btn-primary" disabled={busy} onClick={finish}>
              {busy ? 'Mise en orbite…' : 'Lancer mon système'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
