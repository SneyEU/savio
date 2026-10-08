/**
 * Ports : interfaces que l'infrastructure (mémoire, SQLite, futur serveur) doit implémenter.
 * Le cœur ne connaît que ces contrats.
 */
import type {
  AiMessage,
  DailyActivity,
  Id,
  LearnerProfile,
  LocalDay,
  Mistake,
  ReviewItem,
  ReviewLog,
  Skill,
  SubjectEnrollment,
  SubjectId,
} from '../domain/types';

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): Id;
}

export interface ProfileRepository {
  get(): Promise<LearnerProfile | null>;
  save(profile: LearnerProfile): Promise<void>;
}

export interface SubjectRepository {
  list(): Promise<SubjectEnrollment[]>;
  save(enrollment: SubjectEnrollment): Promise<void>;
  remove(subjectId: SubjectId): Promise<void>;
}

export interface SkillRepository {
  list(subjectId?: SubjectId): Promise<Skill[]>;
  saveMany(skills: readonly Skill[]): Promise<void>;
}

export interface ReviewItemRepository {
  get(id: Id): Promise<ReviewItem | null>;
  list(filter?: { subjectId?: SubjectId }): Promise<ReviewItem[]>;
  /** Éléments dont l'échéance est passée, les plus en retard d'abord. */
  listDue(now: Date, limit: number, subjectId?: SubjectId): Promise<ReviewItem[]>;
  /** Éléments jamais révisés, dans l'ordre d'ajout. */
  listNew(limit: number, subjectId?: SubjectId): Promise<ReviewItem[]>;
  saveMany(items: readonly ReviewItem[]): Promise<void>;
}

export interface ReviewLogRepository {
  append(log: ReviewLog): Promise<void>;
  list(filter?: { subjectId?: SubjectId; since?: string }): Promise<ReviewLog[]>;
}

export interface MistakeRepository {
  append(mistake: Mistake): Promise<void>;
  list(filter?: { subjectId?: SubjectId }): Promise<Mistake[]>;
}

export interface ActivityRepository {
  get(day: LocalDay): Promise<DailyActivity | null>;
  list(): Promise<DailyActivity[]>;
  /** Ajoute des valeurs à la journée (crée la ligne si besoin). */
  increment(day: LocalDay, delta: Partial<Omit<DailyActivity, 'day'>>): Promise<DailyActivity>;
}

export interface AiMessageRepository {
  list(limit: number): Promise<AiMessage[]>;
  append(message: AiMessage): Promise<void>;
  clear(): Promise<void>;
}

export interface SettingsRepository {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
}

/** Ensemble des dépôts, injecté dans les services. */
export interface Repositories {
  profile: ProfileRepository;
  subjects: SubjectRepository;
  skills: SkillRepository;
  items: ReviewItemRepository;
  logs: ReviewLogRepository;
  mistakes: MistakeRepository;
  activity: ActivityRepository;
  aiMessages: AiMessageRepository;
  settings: SettingsRepository;
  /** Supprime toutes les données locales (droit à l'effacement). */
  wipeAll(): Promise<void>;
}
