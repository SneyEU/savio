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
  /** Couleur de « planète » de la catégorie (identité visuelle des matières). */
  color: string;
}

export interface SubjectMeta {
  id: SubjectId;
  label: string;
  category: CategoryId;
  /**
   * Glyphe typographique de la matière : code ou écriture de la langue, symbole, monogramme.
   * Jamais d'emoji : ils changent de style selon le système et font « gadget ».
   */
  glyph: string;
  /** Mots-clés supplémentaires pour la recherche. */
  keywords?: string[];
}

export const CATEGORIES: Category[] = [
  { id: 'languages', label: 'Langues', description: 'Vocabulaire, grammaire, conversation', color: '#7cc4ff' },
  { id: 'sciences', label: 'Maths et sciences', description: 'Calcul, raisonnement, sciences de la nature', color: '#5ce1b6' },
  { id: 'humanities', label: 'Histoire et société', description: 'Histoire, géographie, idées', color: '#e8b04b' },
  { id: 'religions', label: 'Religions et spiritualités', description: 'Croyances, textes, pratiques, avec sources', color: '#d8c69f' },
  { id: 'strategy', label: 'Jeux de stratégie', description: 'Échecs et jeux de plateau du monde entier', color: '#ff7a59' },
  { id: 'arts', label: 'Arts et culture', description: 'Littérature, musique, arts visuels', color: '#f29ec8' },
];

export const SUBJECT_CATALOG: SubjectMeta[] = [
  // Langues
  { id: 'english', label: 'Anglais', category: 'languages', glyph: 'EN' },
  { id: 'spanish', label: 'Espagnol', category: 'languages', glyph: 'ES' },
  { id: 'german', label: 'Allemand', category: 'languages', glyph: 'DE' },
  { id: 'italian', label: 'Italien', category: 'languages', glyph: 'IT' },
  { id: 'portuguese', label: 'Portugais', category: 'languages', glyph: 'PT', keywords: ['brésilien'] },
  { id: 'dutch', label: 'Néerlandais', category: 'languages', glyph: 'NL', keywords: ['flamand', 'hollandais'] },
  { id: 'arabic', label: 'Arabe', category: 'languages', glyph: 'ع', keywords: ['arabe littéraire', 'fusha'] },
  { id: 'turkish', label: 'Turc', category: 'languages', glyph: 'TR' },
  { id: 'russian', label: 'Russe', category: 'languages', glyph: 'Ру' },
  { id: 'polish', label: 'Polonais', category: 'languages', glyph: 'PL' },
  { id: 'greek', label: 'Grec', category: 'languages', glyph: 'Ελ' },
  { id: 'hebrew', label: 'Hébreu', category: 'languages', glyph: 'עב' },
  { id: 'chinese', label: 'Chinois (mandarin)', category: 'languages', glyph: '中', keywords: ['mandarin'] },
  { id: 'japanese', label: 'Japonais', category: 'languages', glyph: 'あ' },
  { id: 'korean', label: 'Coréen', category: 'languages', glyph: '한' },
  { id: 'hindi', label: 'Hindi', category: 'languages', glyph: 'हि' },
  { id: 'swahili', label: 'Swahili', category: 'languages', glyph: 'SW' },
  { id: 'french', label: 'Français', category: 'languages', glyph: 'FR', keywords: ['fle', 'orthographe'] },
  { id: 'latin', label: 'Latin', category: 'languages', glyph: 'LA' },

  // Maths et sciences
  { id: 'math', label: 'Mathématiques', category: 'sciences', glyph: '∑', keywords: ['maths', 'algèbre', 'géométrie'] },
  { id: 'physics', label: 'Physique', category: 'sciences', glyph: 'Φ' },
  { id: 'chemistry', label: 'Chimie', category: 'sciences', glyph: 'Ch' },
  { id: 'biology', label: 'Biologie', category: 'sciences', glyph: 'Bi', keywords: ['svt'] },
  { id: 'programming', label: 'Programmation', category: 'sciences', glyph: '</>', keywords: ['code', 'informatique', 'python'] },
  { id: 'astronomy', label: 'Astronomie', category: 'sciences', glyph: '☾' },

  // Histoire et société
  { id: 'history', label: 'Histoire', category: 'humanities', glyph: 'Ⅻ' },
  { id: 'geography', label: 'Géographie', category: 'humanities', glyph: '⊕', keywords: ['capitales', 'pays'] },
  { id: 'philosophy', label: 'Philosophie', category: 'humanities', glyph: '∴' },
  { id: 'economics', label: 'Économie', category: 'humanities', glyph: '€' },

  // Religions et spiritualités
  { id: 'islam', label: 'Islam', category: 'religions', glyph: '☪', keywords: ['coran', 'sîra', 'hadith'] },
  { id: 'christianity', label: 'Christianisme', category: 'religions', glyph: '✝', keywords: ['bible', 'évangile'] },
  { id: 'judaism', label: 'Judaïsme', category: 'religions', glyph: '✡', keywords: ['torah', 'talmud'] },

  // Jeux de stratégie
  { id: 'chess', label: 'Échecs', category: 'strategy', glyph: '♞' },
  { id: 'shogi', label: 'Shogi (échecs japonais)', category: 'strategy', glyph: '将', keywords: ['japon'] },
  { id: 'xiangqi', label: 'Xiangqi (échecs chinois)', category: 'strategy', glyph: '帥', keywords: ['chine'] },
  { id: 'go', label: 'Go', category: 'strategy', glyph: '碁', keywords: ['weiqi', 'baduk'] },
  { id: 'draughts', label: 'Dames', category: 'strategy', glyph: '◎', keywords: ['jeu de dames'] },

  // Arts et culture
  { id: 'literature', label: 'Littérature', category: 'arts', glyph: '¶' },
  { id: 'music', label: 'Musique et solfège', category: 'arts', glyph: '♪', keywords: ['solfège'] },
  { id: 'art-history', label: 'Histoire de l’art', category: 'arts', glyph: '✎', keywords: ['peinture'] },
];

const byId = new Map(SUBJECT_CATALOG.map((s) => [s.id, s]));

export function subjectMeta(id: SubjectId): SubjectMeta | undefined {
  return byId.get(id);
}

export function categoryOf(id: SubjectId): Category | undefined {
  const meta = byId.get(id);
  return meta ? CATEGORIES.find((c) => c.id === meta.category) : undefined;
}

/** Couleur de planète d'une matière (celle de sa catégorie). */
export function subjectColor(id: SubjectId): string {
  return categoryOf(id)?.color ?? '#e8b04b';
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
