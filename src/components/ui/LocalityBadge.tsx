import type { Locality } from '../../core/ai/types';

const TEXT: Record<Locality, string> = {
  local: 'IA locale — rien ne quitte cet ordinateur',
  remote: 'IA distante — vos messages sont envoyés à un serveur externe',
  none: 'Sans IA — réponses guidées hors ligne',
};

/** Indique en permanence où partent les messages envoyés au tuteur. */
export function LocalityBadge({ locality, provider }: { locality: Locality; provider: string }) {
  return (
    <p className={`locality locality-${locality}`} role="status">
      <span className="locality-dot" aria-hidden="true" />
      <span>
        {TEXT[locality]} <span className="muted">({provider})</span>
      </span>
    </p>
  );
}
