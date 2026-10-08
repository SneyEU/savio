import { useEffect, useRef, useState } from 'react';
import { Core, type CoreState } from '../../components/fx/Core';
import { Icon } from '../../components/ui/Icon';
import { LocalityBadge } from '../../components/ui/LocalityBadge';
import { parseFlashcards, type FlashcardSuggestion } from '../../core/ai/tutor/tutorEngine';
import type { Locality } from '../../core/ai/types';
import { SUBJECT_CATALOG } from '../../core/content/catalog';
import type { SubjectId } from '../../core/domain/types';
import { newSrsState } from '../../core/srs/fsrs';
import { SETTINGS } from '../../services/container';
import { speak, voiceAvailable, type SpeakHandle } from '../../services/voice';
import { actions, services, useApp } from '../../app/store';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'Explique-moi ser et estar avec des exemples',
  'Quiz de 5 questions sur les ouvertures aux échecs',
  '8 cartes d’espagnol pour le restaurant, format recto → verso',
  'Qu’est-ce que je devrais réviser aujourd’hui ?',
];

const VOICE_SETTING = 'voice.readAloud';

const STATUS: Record<CoreState, string> = {
  idle: 'Pose ta question, je connais ta progression.',
  thinking: 'Je réfléchis…',
  speaking: 'Je te réponds à voix haute',
  listening: 'Je t’écoute',
};

export function Assistant() {
  const subjects = useApp((s) => s.subjects);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [subjectId, setSubjectId] = useState<SubjectId | ''>('');
  const [coreState, setCoreState] = useState<CoreState>('idle');
  const [streaming, setStreaming] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);
  const [readAloud, setReadAloud] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [locality, setLocality] = useState<{ locality: Locality; provider: string }>(() => ({
    locality: services().gateway.current.locality,
    provider: services().gateway.current.label,
  }));
  const abort = useRef<AbortController | null>(null);
  const voiceLevel = useRef({ current: 0 }).current;
  const speaking = useRef<SpeakHandle | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svc = services();
    void svc.repos.settings.get<boolean>(SETTINGS.saveAiHistory).then((v) => setSaveHistory(v ?? true));
    void svc.repos.settings.get<boolean>(VOICE_SETTING).then((v) => setReadAloud(!!v && voiceAvailable()));
    void svc.repos.aiMessages.list(30).then((messages) => setTurns(messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))));
    const off = svc.onAiRequest((l, provider) => setLocality({ locality: l, provider }));
    return () => {
      off();
      speaking.current?.stop();
    };
  }, []);

  useEffect(() => {
    answerRef.current?.scrollTo({ top: answerRef.current.scrollHeight });
  }, [turns]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    speaking.current?.stop();
    setInput('');
    setAdded(null);
    const answerId = crypto.randomUUID();
    setTurns((t) => [...t, { id: crypto.randomUUID(), role: 'user', content: question }, { id: answerId, role: 'assistant', content: '' }]);
    setStreaming(true);
    setCoreState('thinking');
    abort.current = new AbortController();
    let answer = '';
    try {
      for await (const chunk of services().tutor.ask(question, { subjectId: subjectId || undefined, signal: abort.current.signal, saveHistory })) {
        answer += chunk;
        // Le texte qui arrive fait « vibrer » le noyau, même sans voix.
        voiceLevel.current = Math.min(1, 0.25 + chunk.length / 40);
        setTurns((t) => t.map((turn) => (turn.id === answerId ? { ...turn, content: turn.content + chunk } : turn)));
        setCoreState('speaking');
      }
    } catch (error) {
      const message = abort.current.signal.aborted ? '(réponse interrompue)' : `Le tuteur n’a pas pu répondre : ${error instanceof Error ? error.message : error}`;
      setTurns((t) => t.map((turn) => (turn.id === answerId ? { ...turn, content: `${turn.content}\n\n${message}`.trim() } : turn)));
    } finally {
      setStreaming(false);
      abort.current = null;
      voiceLevel.current = 0;
    }
    if (readAloud && answer) {
      speaking.current = speak(answer, voiceLevel, { onStart: () => setCoreState('speaking'), onEnd: () => setCoreState('idle') });
    } else {
      setCoreState('idle');
    }
  }

  async function toggleVoice() {
    const next = !readAloud;
    setReadAloud(next);
    if (!next) {
      speaking.current?.stop();
      setCoreState('idle');
    }
    await services().repos.settings.set(VOICE_SETTING, next);
  }

  async function addCards(cards: FlashcardSuggestion[]) {
    const target = (subjectId || subjects[0]?.subjectId) as SubjectId | undefined;
    if (!target) return;
    const svc = services();
    const now = svc.clock.now();
    const skillId = `${target}.tutor`;
    await svc.repos.skills.saveMany([{ id: skillId, subjectId: target, title: 'Cartes créées avec le tuteur', prerequisites: [] }]);
    await svc.repos.items.saveMany(
      cards.map((c) => ({
        id: svc.ids.next(),
        subjectId: target,
        skillId,
        kind: 'vocabulary' as const,
        front: c.front,
        back: c.back,
        srs: newSrsState(now),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })),
    );
    setAdded(`${cards.length} carte${cards.length > 1 ? 's' : ''} ajoutée${cards.length > 1 ? 's' : ''} à tes révisions.`);
    await actions.refresh();
  }

  const lastAnswer = [...turns].reverse().find((t) => t.role === 'assistant');
  const lastQuestion = [...turns].reverse().find((t) => t.role === 'user');
  const history = turns.slice(0, Math.max(0, turns.length - 2)).filter((t) => t.role === 'user');
  // Au moins deux lignes « recto → verso » : évite de prendre une simple flèche dans une phrase pour une carte.
  const parsed = !streaming && lastAnswer ? parseFlashcards(lastAnswer.content) : [];
  const suggestions = parsed.length >= 2 ? parsed : [];

  return (
    <div className="tutor">
      <aside className="tutor-thread" aria-label="Questions précédentes">
        <h2 className="section-title small">Fil</h2>
        {history.length === 0 ? (
          <p className="muted small-print">Tes questions s’afficheront ici.</p>
        ) : (
          <ol>
            {history.slice(-12).map((t) => (
              <li key={t.id}>{t.content}</li>
            ))}
          </ol>
        )}
      </aside>

      <section className="tutor-stage">
        <div className="tutor-presence">
          <Core state={coreState} level={voiceLevel} size={240} />
          <p className={`tutor-status status-${coreState}`} aria-live="polite">
            {STATUS[coreState]}
          </p>
          <LocalityBadge locality={locality.locality} provider={locality.provider} />
        </div>

        {lastAnswer ? (
          <article className="tutor-answer" aria-live="polite">
            {lastQuestion && <p className="tutor-question">{lastQuestion.content}</p>}
            <div ref={answerRef} className="tutor-answer-text">
              {lastAnswer.content || <span className="assemble small" aria-label="Le tuteur prépare sa réponse"><span /><span /><span /></span>}
            </div>
            {suggestions.length > 0 && (
              <div className="tutor-cards">
                <span>
                  {suggestions.length} carte{suggestions.length > 1 ? 's' : ''} prête{suggestions.length > 1 ? 's' : ''} à rejoindre tes révisions
                </span>
                <button type="button" className="btn btn-secondary" onClick={() => addCards(suggestions)} disabled={subjects.length === 0}>
                  <Icon name="cards" size={18} /> Ajouter
                </button>
              </div>
            )}
            {added && <p className="notice">{added}</p>}
          </article>
        ) : (
          <div className="tutor-starters">
            {STARTERS.map((s, i) => (
              <button key={s} type="button" className="starter" style={{ ['--i' as string]: i }} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          className="commandbar"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label className="visually-hidden" htmlFor="question">
            Ta question
          </label>
          <textarea
            id="question"
            rows={1}
            value={input}
            placeholder="Demande une explication, un quiz, des cartes…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
          />
          <select value={subjectId} onChange={(e) => setSubjectId(e.target.value as SubjectId | '')} aria-label="Matière">
            <option value="">Toutes matières</option>
            {SUBJECT_CATALOG.filter((s) => subjects.some((e) => e.subjectId === s.id)).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {voiceAvailable() && (
            <button type="button" className={readAloud ? 'icon-btn is-on' : 'icon-btn'} onClick={toggleVoice} aria-pressed={readAloud} aria-label="Lire les réponses à voix haute">
              <Icon name={readAloud ? 'sound' : 'mute'} />
            </button>
          )}
          {streaming ? (
            <button type="button" className="icon-btn is-send" onClick={() => abort.current?.abort()} aria-label="Arrêter la réponse">
              <Icon name="stop" />
            </button>
          ) : (
            <button type="submit" className="icon-btn is-send" disabled={!input.trim()} aria-label="Envoyer">
              <Icon name="arrow" />
            </button>
          )}
        </form>
        {!saveHistory && <p className="muted small-print center">Historique désactivé : cette conversation ne sera pas enregistrée.</p>}
      </section>
    </div>
  );
}
