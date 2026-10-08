import type { AiProvider, ChatMessage, ChatOptions, FetchLike, ProviderHealth } from '../types';
import { describeHttpError, readLines, trimTrailingSlash } from './streaming';

interface OllamaChunk {
  message?: { content?: string };
  done?: boolean;
  error?: string;
}

/** Modèles locaux via Ollama (https://ollama.com, licence MIT). Rien ne quitte la machine. */
export class OllamaProvider implements AiProvider {
  readonly id = 'ollama';
  readonly label: string;
  readonly locality = 'local' as const;
  private readonly baseUrl: string;

  constructor(
    baseUrl: string,
    private readonly model: string,
    private readonly fetchFn: FetchLike,
  ) {
    this.baseUrl = trimTrailingSlash(baseUrl);
    this.label = `Ollama · ${model}`;
  }

  async healthCheck(signal?: AbortSignal): Promise<ProviderHealth> {
    try {
      const response = await this.fetchFn(`${this.baseUrl}/api/tags`, { signal });
      if (!response.ok) return { ok: false, detail: await describeHttpError(response) };
      const data = (await response.json()) as { models?: { name: string }[] };
      const models = (data.models ?? []).map((m) => m.name);
      const installed = models.some((m) => m === this.model || m === `${this.model}:latest`);
      return installed
        ? { ok: true, detail: `Modèle ${this.model} prêt.`, models }
        : { ok: false, detail: `Ollama répond mais le modèle « ${this.model} » n'est pas installé. Lance : ollama pull ${this.model}`, models };
    } catch {
      return { ok: false, detail: `Ollama est injoignable sur ${this.baseUrl}. Est-il lancé ?` };
    }
  }

  async *chat(messages: readonly ChatMessage[], options: ChatOptions = {}): AsyncIterable<string> {
    const response = await this.fetchFn(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: options.signal,
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: true,
        options: { temperature: options.temperature ?? 0.4, num_predict: options.maxTokens ?? 800 },
      }),
    });
    if (!response.ok || !response.body) throw new Error(`Ollama : ${await describeHttpError(response)}`);

    for await (const line of readLines(response.body)) {
      const chunk = JSON.parse(line) as OllamaChunk;
      if (chunk.error) throw new Error(`Ollama : ${chunk.error}`);
      if (chunk.message?.content) yield chunk.message.content;
      if (chunk.done) return;
    }
  }
}
