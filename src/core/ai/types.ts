export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

/** Où s'exécute le modèle : l'UI affiche clairement quand des données quittent la machine. */
export type Locality = 'local' | 'remote' | 'none';

export interface AiProvider {
  readonly id: string;
  readonly label: string;
  readonly locality: Locality;
  /** Vérifie rapidement que le provider répond (modèle installé, serveur lancé…). */
  healthCheck(signal?: AbortSignal): Promise<ProviderHealth>;
  /** Produit la réponse morceau par morceau. */
  chat(messages: readonly ChatMessage[], options?: ChatOptions): AsyncIterable<string>;
}

export interface ProviderHealth {
  ok: boolean;
  detail: string;
  models?: string[];
}

/** Sous-ensemble de `fetch` injecté : `window.fetch` dans le navigateur, le plugin HTTP de Tauri dans l'application. */
export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type ProviderConfig =
  | { kind: 'ollama'; baseUrl: string; model: string }
  | { kind: 'openai-compatible'; baseUrl: string; model: string; apiKey?: string; label?: string }
  | { kind: 'offline' };

export const DEFAULT_PROVIDER_CONFIG: ProviderConfig = {
  kind: 'ollama',
  baseUrl: 'http://127.0.0.1:11434',
  model: 'qwen2.5:3b',
};
