import { subjectLabel } from '../../content/starterDecks';
import type { AiMessage, SubjectId } from '../../domain/types';
import { describeForTutor } from '../../learner/learnerModel';
import type { LearningEngine } from '../../engine/learningEngine';
import type { Clock, IdGenerator, Repositories } from '../../ports';
import type { AiGateway } from '../gateway';
import { buildTutorSystemPrompt } from '../prompts/tutor';
import type { ChatMessage } from '../types';

/** Nombre de messages récents transmis au modèle (le reste reste en local). */
const CONTEXT_MESSAGES = 12;

export interface FlashcardSuggestion {
  front: string;
  back: string;
}

/**
 * Le tuteur : combine le profil apprenant (via le moteur) et le modèle (via la passerelle).
 * Il ne modifie jamais la base directement : il propose, le moteur dispose.
 */
export class TutorEngine {
  constructor(
    private readonly gateway: AiGateway,
    private readonly engine: LearningEngine,
    private readonly repos: Repositories,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async *ask(question: string, options: { subjectId?: SubjectId; signal?: AbortSignal; saveHistory: boolean }): AsyncIterable<string> {
    const text = question.trim();
    if (text.length === 0) return;

    const [profile, snapshot, skills, history] = await Promise.all([
      this.repos.profile.get(),
      this.engine.snapshot(options.subjectId),
      this.repos.skills.list(options.subjectId),
      this.repos.aiMessages.list(CONTEXT_MESSAGES),
    ]);

    const system = buildTutorSystemPrompt({
      learnerName: profile?.displayName ?? 'l’apprenant',
      subjectLabel: options.subjectId ? subjectLabel(options.subjectId) : undefined,
      learnerSummary: describeForTutor(snapshot, new Map(skills.map((s) => [s.id, s.title]))),
      dailyGoalMinutes: profile?.dailyGoalMinutes ?? 15,
      longTermGoal: profile?.longTermGoal,
    });

    const messages: ChatMessage[] = [
      { role: 'system', content: system },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: text },
    ];

    let answer = '';
    for await (const chunk of this.gateway.chat(messages, { signal: options.signal })) {
      answer += chunk;
      yield chunk;
    }

    if (options.saveHistory) {
      await this.save('user', text, options.subjectId);
      await this.save('assistant', answer, options.subjectId);
    }
  }

  private async save(role: AiMessage['role'], content: string, subjectId?: SubjectId): Promise<void> {
    await this.repos.aiMessages.append({ id: this.ids.next(), role, content, subjectId, createdAt: this.clock.now().toISOString() });
  }
}

/**
 * Extrait des cartes « recto → verso » d'une réponse du tuteur.
 * Sert à proposer à l'utilisateur d'ajouter ces cartes à ses révisions (validation explicite).
 */
export function parseFlashcards(text: string): FlashcardSuggestion[] {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
    .map((line) => line.split(/\s*(?:→|->|=>)\s*/))
    .filter((parts): parts is [string, string] => parts.length === 2 && parts[0]!.length > 0 && parts[1]!.length > 0)
    .map(([front, back]) => ({ front: front.slice(0, 200), back: back.slice(0, 400) }));
}
