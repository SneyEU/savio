import { describe, expect, it } from 'vitest';
import { AiGateway, createProvider } from '../../src/core/ai/gateway';
import { localityOf } from '../../src/core/ai/providers/openaiCompatible';
import { buildTutorSystemPrompt } from '../../src/core/ai/prompts/tutor';
import { parseFlashcards } from '../../src/core/ai/tutor/tutorEngine';
import type { FetchLike } from '../../src/core/ai/types';

const streamOf = (lines: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      // Découpage volontairement au milieu des lignes pour tester le tampon.
      const raw = lines.join('\n') + '\n';
      for (let i = 0; i < raw.length; i += 7) controller.enqueue(encoder.encode(raw.slice(i, i + 7)));
      controller.close();
    },
  });

const collect = async (iterable: AsyncIterable<string>) => {
  let text = '';
  for await (const chunk of iterable) text += chunk;
  return text;
};

describe('Providers IA', () => {
  it('Ollama : assemble la réponse diffusée en NDJSON', async () => {
    const fetchFn: FetchLike = async () =>
      new Response(
        streamOf([
          JSON.stringify({ message: { content: 'Hola ' }, done: false }),
          JSON.stringify({ message: { content: 'significa bonjour.' }, done: false }),
          JSON.stringify({ done: true }),
        ]),
      );
    const provider = createProvider({ kind: 'ollama', baseUrl: 'http://127.0.0.1:11434/', model: 'm' }, fetchFn);
    expect(provider.locality).toBe('local');
    expect(await collect(provider.chat([{ role: 'user', content: 'hola ?' }]))).toBe('Hola significa bonjour.');
  });

  it('OpenAI-compatible : lit le flux SSE', async () => {
    const fetchFn: FetchLike = async () =>
      new Response(
        streamOf([
          'data: ' + JSON.stringify({ choices: [{ delta: { content: 'Bon' } }] }),
          'data: ' + JSON.stringify({ choices: [{ delta: { content: 'jour' } }] }),
          'data: [DONE]',
        ]),
      );
    const provider = createProvider({ kind: 'openai-compatible', baseUrl: 'http://localhost:8080/v1', model: 'm' }, fetchFn);
    expect(await collect(provider.chat([{ role: 'user', content: 'x' }]))).toBe('Bonjour');
  });

  it('détecte si les données quittent la machine', () => {
    expect(localityOf('http://127.0.0.1:8080/v1')).toBe('local');
    expect(localityOf('https://api.example.com/v1')).toBe('remote');
  });

  it('la passerelle bascule sur le mode hors ligne si le modèle est injoignable', async () => {
    const failing: FetchLike = async () => {
      throw new TypeError('connexion refusée');
    };
    const seen: string[] = [];
    const gateway = new AiGateway(createProvider({ kind: 'ollama', baseUrl: 'http://127.0.0.1:1', model: 'm' }, failing), {
      onRequest: ({ locality }) => seen.push(locality),
    });
    const text = await collect(gateway.chat([{ role: 'user', content: 'Explique-moi la relativité' }]));
    expect(text).toContain('Aucun modèle IA');
    expect(seen).toEqual(['local', 'none']);
  });
});

describe('Tuteur', () => {
  it('le prompt système inclut le profil et interdit les citations inventées', () => {
    const prompt = buildTutorSystemPrompt({
      learnerName: 'Matt',
      subjectLabel: 'Espagnol',
      learnerSummary: 'Confusions récurrentes : ser/estar (3 fois).',
      dailyGoalMinutes: 20,
    });
    expect(prompt).toContain('Matt');
    expect(prompt).toContain('ser/estar');
    expect(prompt).toContain('N’invente jamais');
  });

  it('extrait les cartes proposées par le tuteur', () => {
    const cards = parseFlashcards('Voici :\n- el perro → le chien\n2. la casa -> la maison\nPhrase sans flèche');
    expect(cards).toEqual([
      { front: 'el perro', back: 'le chien' },
      { front: 'la casa', back: 'la maison' },
    ]);
  });
});
