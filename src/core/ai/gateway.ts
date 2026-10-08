import { OfflineProvider } from './providers/offline';
import { OllamaProvider } from './providers/ollama';
import { OpenAiCompatibleProvider } from './providers/openaiCompatible';
import type { AiProvider, ChatMessage, ChatOptions, FetchLike, Locality, ProviderConfig } from './types';

export function createProvider(config: ProviderConfig, fetchFn: FetchLike): AiProvider {
  switch (config.kind) {
    case 'ollama':
      return new OllamaProvider(config.baseUrl, config.model, fetchFn);
    case 'openai-compatible':
      return new OpenAiCompatibleProvider(config.baseUrl, config.model, fetchFn, config.apiKey, config.label);
    case 'offline':
      return new OfflineProvider();
  }
}

export interface GatewayEvents {
  /** Appelé avant chaque requête : l'UI s'en sert pour afficher où partent les données. */
  onRequest?: (info: { provider: string; locality: Locality }) => void;
}

/**
 * Point d'accès unique aux modèles : choix du provider, délai maximal, repli hors ligne.
 * Changer de modèle = changer la configuration, sans toucher au reste de l'application.
 */
export class AiGateway {
  private provider: AiProvider;
  private readonly fallback = new OfflineProvider();

  constructor(
    provider: AiProvider,
    private readonly events: GatewayEvents = {},
    private readonly timeoutMs = 120_000,
  ) {
    this.provider = provider;
  }

  get current(): AiProvider {
    return this.provider;
  }

  use(provider: AiProvider): void {
    this.provider = provider;
  }

  /**
   * Diffuse la réponse. Si le provider est injoignable avant le premier morceau,
   * bascule sur le repli hors ligne au lieu d'afficher une erreur brute.
   */
  async *chat(messages: readonly ChatMessage[], options: ChatOptions = {}): AsyncIterable<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const abortFromCaller = () => controller.abort();
    options.signal?.addEventListener('abort', abortFromCaller, { once: true });

    let started = false;
    try {
      this.events.onRequest?.({ provider: this.provider.label, locality: this.provider.locality });
      for await (const chunk of this.provider.chat(messages, { ...options, signal: controller.signal })) {
        started = true;
        yield chunk;
      }
    } catch (error) {
      if (started || options.signal?.aborted) throw error;
      this.events.onRequest?.({ provider: this.fallback.label, locality: this.fallback.locality });
      yield* this.fallback.chat(messages);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abortFromCaller);
    }
  }
}
