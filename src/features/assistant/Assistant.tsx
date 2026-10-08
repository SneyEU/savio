import { useEffect, useRef, useState } from 'react';
import { LocalityBadge } from '../../components/ui/LocalityBadge';
import { parseFlashcards, type FlashcardSuggestion } from '../../core/ai/tutor/tutorEngine';
import type { Locality } from '../../core/ai/types';
import { SUBJECT_CATALOG } from '../../core/content/catalog';
import type { SubjectId } from '../../core/domain/types';
import { newSrsState } from '../../core/srs/fsrs';
import { SETTINGS } from '../../services/container';
import { actions, services, useApp } from '../../app/store';

interface Turn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'Explique-moi la différence entre ser et estar avec des exemples.',
  'Fais-moi un quiz de 5 questions sur les principes d’ouverture aux échecs.',
  'Propose-moi 8 cartes de vocabulaire espagnol pour le restaurant, au format recto → verso.',
  'Qu’est-ce que je devrais réviser aujourd’hui ?',
];

export function Assistant() {
  const subjects = useApp((s) => s.subjects);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [subjectId, setSubjectId] = useState<SubjectId | ''>('');
  const [streaming, setStreaming] = useState(false);
  const [saveHistory, setSaveHistory] = useState(true);
  const [added, setAdded] = useState<string | null>(null);
  const [locality, setLocality] = useState<{ locality: Locality; provider: string }>(() => ({
    locality: services().gateway.current.locality,
    provider: services().gateway.current.label,
  }));
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svc = services();
    void svc.repos.settings.get<boolean>(SETTINGS.saveAiHistory).then((v) => setSaveHistory(v ?? true));
    void svc.repos.aiMessages.list(30).then((messages) => setTurns(messages.map((m) => ({ id: m.id, role: m.role, content: m.content }))));
    return svc.onAiRequest((l, provider) => setLocality({ locality: l, provider }));
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || streaming) return;
    setInput('');
    setAdded(null);
    const answerId = crypto.randomUUID();
    setTurns((t) => [...t, { id: crypto.randomUUID(), role: 'user', content: question }, { id: answerId, role: 'assistant', content: '' }]);
    setStreaming(true);
    abort.current = new AbortController();
    try {
      for await (const chunk of services().tutor.ask(question, {
        subjectId: subjectId || undefined,
        signal: abort.current.signal,
        saveHistory,
      })) {
        setTurns((t) => t.map((turn) => (turn.id === answerId ? { ...turn, content: turn.content + chunk } : turn)));
      }
    } catch (error) {
      const message = abort.current.signal.aborted ? '(réponse interrompue)' : `Le tuteur n’a pas pu répondre : ${error instanceof Error ? error.message : error}`;
      setTurns((t) => t.map((turn) => (turn.id === answerId ? { ...turn, content: `${turn.content}\n\n${message}`.trim() } : turn)));
    } finally {
      setStreaming(false);
      abort.current = null;
    }
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
  // Au moins deux lignes « recto → verso » : évite de prendre une simple flèche dans une phrase pour une carte.
  const parsed = !streaming && lastAnswer ? parseFlashcards(lastAnswer.content) : [];
  const suggestions = parsed.length >= 2 ? parsed : [];

  return (
    <div className="page assistant">
      <header className="stack">
        <h1>Tuteur</h1>
        <LocalityBadge locality={locality.locality} provider={locality.provider} />
      </header>

      <div className="chat" aria-live="polite">
        {turns.length === 0 && (
          <div className="stack">
            <p className="muted">Pose une question, demande une explication, un quiz ou des cartes. Le tuteur connaît ta progression.</p>
            <div className="starters">
              {STARTERS.map((s) => (
                <button key={s} type="button" className="choice" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t) => (
          <div key={t.id} className={`bubble bubble-${t.role}`}>
            {t.content || <span className="typing" aria-label="Le tuteur écrit" />}
          </div>
        ))}
        {suggestions.length > 0 && (
          <div className="suggestion row">
            <span>
              {suggestions.length} carte{suggestions.length > 1 ? 's' : ''} détectée{suggestions.length > 1 ? 's' : ''} dans la réponse.
            </span>
            <button type="button" className="btn btn-secondary" onClick={() => addCards(suggestions)} disabled={subjects.length === 0}>
              Ajouter à mes révisions
            </button>
          </div>
        )}
        {added && <p className="notice">{added}</p>}
        <div ref={endRef} />
      </div>

      <form
        className="composer"
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
          className="input"
          rows={2}
          value={input}
          placeholder="Écris ta question…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        <div className="row composer-actions">
          <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value as SubjectId | '')} aria-label="Matière">
            <option value="">Toutes matières</option>
            {SUBJECT_CATALOG.filter((s) => subjects.some((e) => e.subjectId === s.id)).map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {streaming ? (
            <button type="button" className="btn btn-secondary" onClick={() => abort.current?.abort()}>
              Arrêter
            </button>
          ) : (
            <button type="submit" className="btn btn-primary" disabled={!input.trim()}>
              Envoyer
            </button>
          )}
        </div>
        {!saveHistory && <p className="muted composer-note">Historique désactivé : cette conversation ne sera pas enregistrée.</p>}
      </form>
    </div>
  );
}
