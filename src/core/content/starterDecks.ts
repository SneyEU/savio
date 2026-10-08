/**
 * Contenu de démarrage — rédigé pour Savio, publié sous CC BY-SA 4.0.
 * Les decks sont rangés par catégorie dans `decks/`. Les contenus religieux indiquent leur référence ;
 * ne garder ici que des points faisant consensus. Les points sujets à divergence iront dans le module RAG sourcé.
 */
import type { SubjectId } from '../domain/types';
import { LANGUAGE_DECKS } from './decks/languages';
import { RELIGION_DECKS } from './decks/religions';
import { SCIENCE_DECKS } from './decks/sciences';
import { STRATEGY_DECKS } from './decks/strategy';
import type { StarterDeck } from './decks/types';

export type { StarterCard, StarterDeck } from './decks/types';
export { CATEGORIES, SUBJECT_CATALOG, searchSubjects, subjectLabel, subjectMeta } from './catalog';

export const ALL_STARTER_DECKS: StarterDeck[] = [...LANGUAGE_DECKS, ...SCIENCE_DECKS, ...RELIGION_DECKS, ...STRATEGY_DECKS];

export const STARTER_DECKS: Record<SubjectId, StarterDeck | undefined> = Object.fromEntries(ALL_STARTER_DECKS.map((d) => [d.subjectId, d]));

export function hasStarterContent(subjectId: SubjectId): boolean {
  return STARTER_DECKS[subjectId] !== undefined;
}
