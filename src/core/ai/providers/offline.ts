import type { AiProvider, ChatMessage, ProviderHealth } from '../types';

/**
 * Provider de repli quand aucun modèle n'est configuré ou joignable.
 * Il n'invente rien : il oriente vers les activités qui fonctionnent sans IA
 * et explique comment activer un modèle local gratuit.
 */
export class OfflineProvider implements AiProvider {
  readonly id = 'offline';
  readonly label = 'Hors ligne (sans modèle)';
  readonly locality = 'none' as const;

  async healthCheck(): Promise<ProviderHealth> {
    return { ok: true, detail: 'Mode sans IA : révisions et progression restent disponibles.' };
  }

  async *chat(messages: readonly ChatMessage[]): AsyncIterable<string> {
    const last = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
    yield offlineReply(last);
  }
}

export function offlineReply(question: string): string {
  const q = question.toLowerCase();
  if (/(réviser|révision|revoir|cartes?)/.test(q)) {
    return 'Je ne peux pas générer de réponse sans modèle IA, mais tes révisions fonctionnent hors ligne : ouvre « Réviser » depuis l’accueil.';
  }
  return [
    'Aucun modèle IA n’est disponible pour le moment.',
    'Pour un tuteur 100 % local et gratuit : installe Ollama (ollama.com), puis lance « ollama pull qwen2.5:3b » et choisis Ollama dans Réglages, rubrique Intelligence artificielle.',
    'En attendant, les révisions, la progression et les statistiques fonctionnent normalement.',
  ].join('\n\n');
}
