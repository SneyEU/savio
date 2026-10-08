import type { ReviewItemKind, Skill, SubjectId } from '../../domain/types';

export interface StarterCard {
  key: string;
  skillId: string;
  kind: ReviewItemKind;
  front: string;
  back: string;
  note?: string;
  source?: string;
}

export interface StarterDeck {
  subjectId: SubjectId;
  skills: Skill[];
  cards: StarterCard[];
}

/** Petit utilitaire pour écrire les decks de façon compacte. */
export function deck(
  subjectId: SubjectId,
  skills: { id: string; title: string; prerequisites?: string[] }[],
  cards: StarterCard[],
): StarterDeck {
  return {
    subjectId,
    skills: skills.map((s) => ({ id: s.id, subjectId, title: s.title, prerequisites: s.prerequisites ?? [] })),
    cards,
  };
}
