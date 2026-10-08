/**
 * Types métier du cœur de Savio.
 * Ce module ne dépend d'aucune bibliothèque : il doit rester portable (desktop, web, mobile, serveur).
 */

export type Id = string;
/** Date ISO-8601 en UTC, ex. "2026-10-08T06:30:00.000Z". */
export type IsoDateTime = string;
/** Jour local au format "YYYY-MM-DD". */
export type LocalDay = string;

/** Identifiant de matière, défini dans le catalogue (`core/content/catalog.ts`). Extensible par des plugins. */
export type SubjectId = string;

export type DeclaredLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SubjectEnrollment {
  subjectId: SubjectId;
  level: DeclaredLevel;
  enrolledAt: IsoDateTime;
}

export type Motivation = 'travel' | 'career' | 'studies' | 'faith' | 'curiosity' | 'family' | 'other';

export interface LearnerProfile {
  id: Id;
  displayName: string;
  /** Langue de l'interface (BCP-47), ex. "fr". */
  uiLanguage: string;
  dailyGoalMinutes: number;
  motivation: Motivation;
  longTermGoal: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Note donnée après une révision. Échelle FSRS. */
export enum Rating {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

/** Échelons de maîtrise visibles par l'utilisateur. */
export type MasteryStage = 'new' | 'learning' | 'fragile' | 'known' | 'mastered';

/** État SRS d'un élément mémorisable (modèle FSRS). */
export interface SrsState {
  /** Stabilité en jours : délai après lequel la probabilité de rappel tombe à 90 %. 0 si jamais révisé. */
  stability: number;
  /** Difficulté intrinsèque, de 1 (facile) à 10 (difficile). 0 si jamais révisé. */
  difficulty: number;
  reps: number;
  lapses: number;
  lastReviewedAt: IsoDateTime | null;
  dueAt: IsoDateTime;
}

export type ReviewItemKind =
  | 'vocabulary'
  | 'concept'
  | 'rule'
  | 'formula'
  | 'date'
  | 'definition'
  | 'fact'
  | 'memorization'
  | 'chess_opening';

/** Unité de base de la mémorisation : un mot, une règle, une ouverture, un verset… */
export interface ReviewItem {
  id: Id;
  subjectId: SubjectId;
  skillId: Id;
  kind: ReviewItemKind;
  front: string;
  back: string;
  /** Explication ou exemple affiché après la réponse. */
  note?: string;
  /** Référence de source (obligatoire pour les contenus religieux ou historiques). */
  source?: string;
  srs: SrsState;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

/** Entrée immuable du journal de révision. */
export interface ReviewLog {
  id: Id;
  itemId: Id;
  subjectId: SubjectId;
  skillId: Id;
  rating: Rating;
  reviewedAt: IsoDateTime;
  /** Temps de réponse en millisecondes. */
  responseMs: number;
  /** Jours écoulés depuis la révision précédente (0 pour la première). */
  elapsedDays: number;
  stabilityBefore: number;
  stabilityAfter: number;
}

export interface Skill {
  id: Id;
  subjectId: SubjectId;
  title: string;
  /** Compétences prérequises (graphe de connaissances). */
  prerequisites: Id[];
}

/** Erreur étiquetée, pour détecter les confusions récurrentes. */
export interface Mistake {
  id: Id;
  subjectId: SubjectId;
  skillId: Id;
  /** Étiquette normalisée de la confusion, ex. "ser/estar". */
  tag: string;
  expected: string;
  given: string;
  occurredAt: IsoDateTime;
}

export interface DailyActivity {
  day: LocalDay;
  minutes: number;
  xp: number;
  reviews: number;
  correct: number;
}

export interface AiMessage {
  id: Id;
  role: 'user' | 'assistant';
  content: string;
  subjectId?: SubjectId;
  createdAt: IsoDateTime;
}
