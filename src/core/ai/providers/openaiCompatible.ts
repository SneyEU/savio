import type { AiProvider, ChatMessage, ChatOptions, FetchLike, Locality, ProviderHealth } from '../types';
import { describeHttpError, readLines, trimTrailingSlash } from './streaming';

interface SseChunk {
  choices?: { delta?: { content?: string } }[];
  error?: { message?: string };
}

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

export function localityOf(baseUrl: string): Locality {
  try {
    return LOCAL_HOSTS.includes(new URL(baseUrl).hostname) ? 'local' : 'remote';
  } catch {
    return 'remote';
  }
}

/**
 * Tout serveur exposant l'API « chat completions » : llama.cpp (llama-server), LM Studio, vLLM,
 * ou un service distant. La localité est déduite de l'URL pour avertir l'utilisateur.
 */
export class OpenAiCompatibleProvider implements AiProvider {
  readonly id = 'openai-compatible';
  readonly label: string;
  readonly locality: Locality;
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly model: string,
    private readonly fetchFn: FetchLike,
    private readonly apiKey?: string,
    label?: string,
  ) {
    this.baseUrl = trimTrailingSlash(baseUrl);
    this.locality = localityOf(this.baseUrl);
    this.label = label ?? `${this.locality === 'local' ? 'Serveur local' : 'API distante'} · ${model}`;
  }

  private headers(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;
    return headers;
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderHealth> {
    try {
      const response = await this.fetchFn(`${this.baseUrl}/models`, { headers: this.headers(), signal });
      if (!response.ok) return { ok: false, detail: await describeHttpError(response) };
      const data = (await response.json()) as { data?: { id: string }[] };
      return { ok: true, detail: 'Serveur joignable.', models: (data.data ?? []).map((m) => m.id) };
    } catch {
      return { ok: false, detail: `Serveur injoignable : ${this.baseUrl}` };
    }
  }

  async *chat(messages: readonly ChatMessage[], options: ChatOptions = {}): AsyncIterable<string> {
    const response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      signal: options.signal,
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        temperature: options.temperature ?? 0.4,
        max_tokens: options.maxTokens ?? 800,
      }),
    });
    if (!response.ok || !response.body) throw new Error(await describeHttpError(response));

    for await (const line of readLines(response.body)) {
      if (!line.startsWith('data:')) continue;
      const payload = line.slice(5).trim();
      if (payload === '[DONE]') return;
      const chunk = JSON.parse(payload) as SseChunk;
      if (chunk.error) throw new Error(chunk.error.message ?? 'Erreur du serveur');
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) yield text;
    }
  }
}
