/**
 * Catalogue des matières, rangées par catégorie.
 * Ajouter une matière = ajouter une ligne ici (et, si possible, un deck de démarrage dans `decks/`).
 */
import type { SubjectId } from '../domain/types';

export type CategoryId = 'languages' | 'sciences' | 'humanities' | 'religions' | 'strategy' | 'arts';

export interface Category {
  id: CategoryId;
  label: string;
  description: string;
}

export interface SubjectMeta {
  id: SubjectId;
  label: string;
  category: CategoryId;
  /**
   * Symbole court affiché devant le nom : code ou écriture de la langue, pictogramme, idéogramme.
   * Pas de drapeaux emoji : Windows ne les affiche pas (il montre deux lettres à la place).
   */
  emoji: string;
  /** Mots-clés supplémentaires pour la recherche. */
  keywords?: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'languages', label: 'Langues', description: 'Vocabulaire, grammaire, conversation' },
  { id: 'sciences', label: 'Maths et sciences', description: 'Calcul, raisonnement, sciences de la nature' },
  { id: 'humanities', label: 'Histoire et société', description: 'Histoire, géographie, idées' },
  { id: 'religions', label: 'Religions et spiritualités', description: 'Croyances, textes, pratiques, avec sources' },
  { id: 'strategy', label: 'Jeux de stratégie', description: 'Échecs et jeux de plateau du monde entier' },
  { id: 'arts', label: 'Arts et culture', description: 'Littérature, musique, arts visuels' },
];

export const SUBJECT_CATALOG: SubjectMeta[] = [
  // Langues
  { id: 'english', label: 'Anglais', category: 'languages', emoji: 'EN' },
  { id: 'spanish', label: 'Espagnol', category: 'languages', emoji: 'ES' },
  { id: 'german', label: 'Allemand', category: 'languages', emoji: 'DE' },
  { id: 'italian', label: 'Italien', category: 'languages', emoji: 'IT' },
  { id: 'portuguese', label: 'Portugais', category: 'languages', emoji: 'PT', keywords: ['brésilien'] },
  { id: 'dutch', label: 'Néerlandais', category: 'languages', emoji: 'NL', keywords: ['flamand', 'hollandais'] },
  { id: 'arabic', label: 'Arabe', category: 'languages', emoji: 'ع', keywords: ['arabe littéraire', 'fusha'] },
  { id: 'turkish', label: 'Turc', category: 'languages', emoji: 'TR' },
  { id: 'russian', label: 'Russe', category: 'languages', emoji: 'Ру' },
  { id: 'polish', label: 'Polonais', category: 'languages', emoji: 'PL' },
  { id: 'greek', label: 'Grec', category: 'languages', emoji: 'Ελ' },
  { id: 'hebrew', label: 'Hébreu', category: 'languages', emoji: 'עב' },
  { id: 'chinese', label: 'Chinois (mandarin)', category: 'languages', emoji: '中', keywords: ['mandarin'] },
  { id: 'japanese', label: 'Japonais', category: 'languages', emoji: 'あ' },
  { id: 'korean', label: 'Coréen', category: 'languages', emoji: '한' },
  { id: 'hindi', label: 'Hindi', category: 'languages', emoji: 'हि' },
  { id: 'swahili', label: 'Swahili', category: 'languages', emoji: 'SW' },
  { id: 'french', label: 'Français', category: 'languages', emoji: 'FR', keywords: ['fle', 'orthographe'] },
  { id: 'latin', label: 'Latin', category: 'languages', emoji: 'LA' },

  // Maths et sciences
  { id: 'math', label: 'Mathématiques', category: 'sciences', emoji: '∑', keywords: ['maths', 'algèbre', 'géométrie'] },
  { id: 'physics', label: 'Physique', category: 'sciences', emoji: '⚛' },
  { id: 'chemistry', label: 'Chimie', category: 'sciences', emoji: '⚗' },
  { id: 'biology', label: 'Biologie', category: 'sciences', emoji: '🧬', keywords: ['svt'] },
  { id: 'programming', label: 'Programmation', category: 'sciences', emoji: '💻', keywords: ['code', 'informatique', 'python'] },
  { id: 'astronomy', label: 'Astronomie', category: 'sciences', emoji: '🔭' },

  // Histoire et société
  { id: 'history', label: 'Histoire', category: 'humanities', emoji: '🏛' },
  { id: 'geography', label: 'Géographie', category: 'humanities', emoji: '🗺', keywords: ['capitales', 'pays'] },
  { id: 'philosophy', label: 'Philosophie', category: 'humanities', emoji: '💡' },
  { id: 'economics', label: 'Économie', category: 'humanities', emoji: '📈' },

  // Religions et spiritualités
  { id: 'islam', label: 'Islam', category: 'religions', emoji: '☪', keywords: ['coran', 'sîra', 'hadith'] },
  { id: 'christianity', label: 'Christianisme', category: 'religions', emoji: '✝', keywords: ['bible', 'évangile'] },
  { id: 'judaism', label: 'Judaïsme', category: 'religions', emoji: '✡', keywords: ['torah', 'talmud'] },

  // Jeux de stratégie
  { id: 'chess', label: 'Échecs', category: 'strategy', emoji: '♟' },
  { id: 'shogi', label: 'Shogi (échecs japonais)', category: 'strategy', emoji: '☖', keywords: ['japon'] },
  { id: 'xiangqi', label: 'Xiangqi (échecs chinois)', category: 'strategy', emoji: '帥', keywords: ['chine'] },
  { id: 'go', label: 'Go', category: 'strategy', emoji: '碁', keywords: ['weiqi', 'baduk'] },
  { id: 'draughts', label: 'Dames', category: 'strategy', emoji: '⛀', keywords: ['jeu de dames'] },

  // Arts et culture
  { id: 'literature', label: 'Littérature', category: 'arts', emoji: '📚' },
  { id: 'music', label: 'Musique et solfège', category: 'arts', emoji: '🎵', keywords: ['solfège'] },
  { id: 'art-history', label: 'Histoire de l’art', category: 'arts', emoji: '🎨', keywords: ['peinture'] },
];

const byId = new Map(SUBJECT_CATALOG.map((s) => [s.id, s]));

export function subjectMeta(id: SubjectId): SubjectMeta | undefined {
  return byId.get(id);
}

export function subjectLabel(id: SubjectId): string {
  return byId.get(id)?.label ?? id;
}

/** Recherche insensible aux accents et à la casse, sur le nom, la catégorie et les mots-clés. */
export function searchSubjects(query: string, subjects: readonly SubjectMeta[] = SUBJECT_CATALOG): SubjectMeta[] {
  const q = normalize(query);
  if (!q) return [...subjects];
  return subjects.filter((s) => {
    const category = CATEGORIES.find((c) => c.id === s.category)?.label ?? '';
    return [s.label, category, ...(s.keywords ?? [])].some((text) => normalize(text).includes(q));
  });
}

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}
