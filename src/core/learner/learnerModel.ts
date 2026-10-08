import { Rating, type Id, type Mistake, type ReviewLog, type Skill, type SubjectId } from '../domain/types';

export interface SkillStats {
  skillId: Id;
  subjectId: SubjectId;
  attempts: number;
  /** Taux de réussite lissé (moyenne mobile exponentielle), de 0 à 1. */
  accuracy: number;
  /** Temps de réponse médian en ms. */
  medianResponseMs: number;
  lastPracticedAt: string | null;
}

export interface RecurringConfusion {
  subjectId: SubjectId;
  skillId: Id;
  tag: string;
  count: number;
  lastSeenAt: string;
}

export interface LearnerSnapshot {
  skills: SkillStats[];
  weakSkills: SkillStats[];
  strongSkills: SkillStats[];
  confusions: RecurringConfusion[];
}

/** Poids de la réponse la plus récente dans le taux de réussite lissé. */
const ACCURACY_SMOOTHING = 0.3;
const WEAK_THRESHOLD = 0.7;
const STRONG_THRESHOLD = 0.9;
const MIN_ATTEMPTS_FOR_JUDGEMENT = 3;
const CONFUSION_MIN_COUNT = 2;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function computeSkillStats(logs: readonly ReviewLog[]): SkillStats[] {
  const bySkill = new Map<Id, ReviewLog[]>();
  for (const log of logs) {
    const list = bySkill.get(log.skillId) ?? [];
    list.push(log);
    bySkill.set(log.skillId, list);
  }

  return [...bySkill.entries()].map(([skillId, skillLogs]) => {
    const ordered = [...skillLogs].sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
    let accuracy = 0.5; // a priori neutre
    for (const log of ordered) {
      const success = log.rating === Rating.Again ? 0 : 1;
      accuracy = ACCURACY_SMOOTHING * success + (1 - ACCURACY_SMOOTHING) * accuracy;
    }
    return {
      skillId,
      subjectId: ordered[0]!.subjectId,
      attempts: ordered.length,
      accuracy,
      medianResponseMs: median(ordered.map((l) => l.responseMs)),
      lastPracticedAt: ordered.at(-1)?.reviewedAt ?? null,
    };
  });
}

export function detectConfusions(mistakes: readonly Mistake[]): RecurringConfusion[] {
  const groups = new Map<string, RecurringConfusion>();
  for (const m of mistakes) {
    const key = `${m.subjectId}::${m.skillId}::${m.tag.trim().toLowerCase()}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      if (m.occurredAt > existing.lastSeenAt) existing.lastSeenAt = m.occurredAt;
    } else {
      groups.set(key, { subjectId: m.subjectId, skillId: m.skillId, tag: m.tag.trim(), count: 1, lastSeenAt: m.occurredAt });
    }
  }
  return [...groups.values()].filter((c) => c.count >= CONFUSION_MIN_COUNT).sort((a, b) => b.count - a.count);
}

export function buildLearnerSnapshot(logs: readonly ReviewLog[], mistakes: readonly Mistake[]): LearnerSnapshot {
  const skills = computeSkillStats(logs);
  const judged = skills.filter((s) => s.attempts >= MIN_ATTEMPTS_FOR_JUDGEMENT);
  return {
    skills,
    weakSkills: judged.filter((s) => s.accuracy < WEAK_THRESHOLD).sort((a, b) => a.accuracy - b.accuracy),
    strongSkills: judged.filter((s) => s.accuracy >= STRONG_THRESHOLD),
    confusions: detectConfusions(mistakes),
  };
}

/** Compétences dont tous les prérequis sont suffisamment maîtrisés (graphe de connaissances). */
export function unlockedSkills(skills: readonly Skill[], stats: readonly SkillStats[], minAccuracy = 0.8): Skill[] {
  const accuracyById = new Map(stats.map((s) => [s.skillId, s.attempts >= MIN_ATTEMPTS_FOR_JUDGEMENT ? s.accuracy : 0]));
  return skills.filter((skill) => skill.prerequisites.every((p) => (accuracyById.get(p) ?? 0) >= minAccuracy));
}

/**
 * Résumé textuel compact du profil, destiné au tuteur IA.
 * On n'envoie jamais l'historique brut : seulement ce qui aide à adapter l'enseignement.
 */
export function describeForTutor(snapshot: LearnerSnapshot, skillTitles: ReadonlyMap<Id, string>): string {
  const name = (id: Id) => skillTitles.get(id) ?? id;
  const lines: string[] = [];
  if (snapshot.strongSkills.length > 0) {
    lines.push(`Points forts : ${snapshot.strongSkills.slice(0, 5).map((s) => name(s.skillId)).join(', ')}.`);
  }
  if (snapshot.weakSkills.length > 0) {
    lines.push(
      `À consolider : ${snapshot.weakSkills
        .slice(0, 5)
        .map((s) => `${name(s.skillId)} (${Math.round(s.accuracy * 100)} % de réussite)`)
        .join(', ')}.`,
    );
  }
  if (snapshot.confusions.length > 0) {
    lines.push(
      `Confusions récurrentes : ${snapshot.confusions
        .slice(0, 5)
        .map((c) => `${c.tag} (${c.count} fois)`)
        .join(', ')}.`,
    );
  }
  return lines.length > 0 ? lines.join('\n') : 'Nouvel apprenant : aucune donnée de progression pour le moment.';
}
