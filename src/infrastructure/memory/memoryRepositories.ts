/**
 * Dépôts en mémoire : utilisés par les tests et par le mode navigateur (`npm run dev` sans Tauri).
 * Comportement identique aux dépôts SQLite (mêmes tris, mêmes filtres).
 */
import type { AiMessage, DailyActivity, LearnerProfile, Mistake, ReviewItem, ReviewLog, Skill, SubjectEnrollment } from '../../core/domain/types';
import type { Repositories } from '../../core/ports';

const clone = <T>(value: T): T => structuredClone(value);

export function createMemoryRepositories(): Repositories {
  let profile: LearnerProfile | null = null;
  const subjects = new Map<string, SubjectEnrollment>();
  const skills = new Map<string, Skill>();
  const items = new Map<string, ReviewItem>();
  const logs: ReviewLog[] = [];
  const mistakes: Mistake[] = [];
  const activity = new Map<string, DailyActivity>();
  const aiMessages: AiMessage[] = [];
  const settings = new Map<string, unknown>();

  return {
    profile: {
      get: async () => (profile ? clone(profile) : null),
      save: async (p) => {
        profile = clone(p);
      },
    },
    subjects: {
      list: async () => [...subjects.values()].map(clone),
      save: async (e) => void subjects.set(e.subjectId, clone(e)),
      remove: async (id) => void subjects.delete(id),
    },
    skills: {
      list: async (subjectId) => [...skills.values()].filter((s) => !subjectId || s.subjectId === subjectId).map(clone),
      saveMany: async (list) => list.forEach((s) => skills.set(s.id, clone(s))),
    },
    items: {
      get: async (id) => (items.has(id) ? clone(items.get(id)!) : null),
      list: async (filter) => [...items.values()].filter((i) => !filter?.subjectId || i.subjectId === filter.subjectId).map(clone),
      listDue: async (now, limit, subjectId) =>
        [...items.values()]
          .filter((i) => i.srs.reps > 0 && i.srs.dueAt <= now.toISOString() && (!subjectId || i.subjectId === subjectId))
          .sort((a, b) => a.srs.dueAt.localeCompare(b.srs.dueAt))
          .slice(0, limit)
          .map(clone),
      listNew: async (limit, subjectId) =>
        [...items.values()]
          .filter((i) => i.srs.reps === 0 && (!subjectId || i.subjectId === subjectId))
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id, undefined, { numeric: true }))
          .slice(0, limit)
          .map(clone),
      saveMany: async (list) => list.forEach((i) => items.set(i.id, clone(i))),
    },
    logs: {
      append: async (log) => void logs.push(clone(log)),
      list: async (filter) =>
        logs
          .filter((l) => (!filter?.subjectId || l.subjectId === filter.subjectId) && (!filter?.since || l.reviewedAt >= filter.since))
          .map(clone),
    },
    mistakes: {
      append: async (m) => void mistakes.push(clone(m)),
      list: async (filter) => mistakes.filter((m) => !filter?.subjectId || m.subjectId === filter.subjectId).map(clone),
    },
    activity: {
      get: async (day) => (activity.has(day) ? clone(activity.get(day)!) : null),
      list: async () => [...activity.values()].sort((a, b) => a.day.localeCompare(b.day)).map(clone),
      increment: async (day, delta) => {
        const current = activity.get(day) ?? { day, minutes: 0, xp: 0, reviews: 0, correct: 0 };
        const next: DailyActivity = {
          day,
          minutes: current.minutes + (delta.minutes ?? 0),
          xp: current.xp + (delta.xp ?? 0),
          reviews: current.reviews + (delta.reviews ?? 0),
          correct: current.correct + (delta.correct ?? 0),
        };
        activity.set(day, next);
        return clone(next);
      },
    },
    aiMessages: {
      list: async (limit) => aiMessages.slice(-limit).map(clone),
      append: async (m) => void aiMessages.push(clone(m)),
      clear: async () => void aiMessages.splice(0),
    },
    settings: {
      get: async <T,>(key: string) => (settings.has(key) ? (clone(settings.get(key)) as T) : null),
      set: async <T,>(key: string, value: T) => void settings.set(key, clone(value)),
    },
    wipeAll: async () => {
      profile = null;
      subjects.clear();
      skills.clear();
      items.clear();
      logs.splice(0);
      mistakes.splice(0);
      activity.clear();
      aiMessages.splice(0);
      settings.clear();
    },
  };
}
