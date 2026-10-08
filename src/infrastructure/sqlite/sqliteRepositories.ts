/**
 * Dépôts SQLite. Ils dépendent d'une interface minimale `SqlDatabase`,
 * fournie par `tauri-plugin-sql` dans l'application et par `node:sqlite` dans les tests.
 * Paramètres positionnels : $1, $2… dans l'ordre d'apparition.
 */
import type {
  AiMessage,
  DailyActivity,
  LearnerProfile,
  Mistake,
  ReviewItem,
  ReviewItemKind,
  ReviewLog,
  Skill,
  SubjectEnrollment,
  SubjectId,
} from '../../core/domain/types';
import type { Repositories } from '../../core/ports';

export interface SqlDatabase {
  execute(sql: string, params?: unknown[]): Promise<unknown>;
  select<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

interface ItemRow {
  id: string;
  subject_id: SubjectId;
  skill_id: string;
  kind: ReviewItemKind;
  front: string;
  back: string;
  note: string | null;
  source: string | null;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  last_reviewed_at: string | null;
  due_at: string;
  created_at: string;
  updated_at: string;
}

const toItem = (r: ItemRow): ReviewItem => ({
  id: r.id,
  subjectId: r.subject_id,
  skillId: r.skill_id,
  kind: r.kind,
  front: r.front,
  back: r.back,
  note: r.note ?? undefined,
  source: r.source ?? undefined,
  srs: {
    stability: r.stability,
    difficulty: r.difficulty,
    reps: r.reps,
    lapses: r.lapses,
    lastReviewedAt: r.last_reviewed_at,
    dueAt: r.due_at,
  },
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

interface LogRow {
  id: string;
  item_id: string;
  subject_id: SubjectId;
  skill_id: string;
  rating: number;
  reviewed_at: string;
  response_ms: number;
  elapsed_days: number;
  stability_before: number;
  stability_after: number;
}

const toLog = (r: LogRow): ReviewLog => ({
  id: r.id,
  itemId: r.item_id,
  subjectId: r.subject_id,
  skillId: r.skill_id,
  rating: r.rating as ReviewLog['rating'],
  reviewedAt: r.reviewed_at,
  responseMs: r.response_ms,
  elapsedDays: r.elapsed_days,
  stabilityBefore: r.stability_before,
  stabilityAfter: r.stability_after,
});

const ITEM_COLUMNS =
  'id, subject_id, skill_id, kind, front, back, note, source, stability, difficulty, reps, lapses, last_reviewed_at, due_at, created_at, updated_at';

export function createSqliteRepositories(db: SqlDatabase): Repositories {
  const listSkills = async (subjectId?: SubjectId): Promise<Skill[]> => {
    const rows = await db.select<{ id: string; subject_id: SubjectId; title: string }>(
      subjectId ? 'SELECT id, subject_id, title FROM skills WHERE subject_id = $1 ORDER BY id' : 'SELECT id, subject_id, title FROM skills ORDER BY id',
      subjectId ? [subjectId] : [],
    );
    const edges = await db.select<{ skill_id: string; prerequisite_id: string }>('SELECT skill_id, prerequisite_id FROM skill_edges');
    return rows.map((r) => ({
      id: r.id,
      subjectId: r.subject_id,
      title: r.title,
      prerequisites: edges.filter((e) => e.skill_id === r.id).map((e) => e.prerequisite_id),
    }));
  };

  return {
    profile: {
      async get() {
        const [r] = await db.select<{
          id: string;
          display_name: string;
          ui_language: string;
          daily_goal_minutes: number;
          motivation: LearnerProfile['motivation'];
          long_term_goal: string;
          created_at: string;
          updated_at: string;
        }>('SELECT * FROM profile LIMIT 1');
        return r
          ? {
              id: r.id,
              displayName: r.display_name,
              uiLanguage: r.ui_language,
              dailyGoalMinutes: r.daily_goal_minutes,
              motivation: r.motivation,
              longTermGoal: r.long_term_goal,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            }
          : null;
      },
      async save(p) {
        await db.execute(
          `INSERT INTO profile (id, display_name, ui_language, daily_goal_minutes, motivation, long_term_goal, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT(id) DO UPDATE SET display_name = excluded.display_name, ui_language = excluded.ui_language,
             daily_goal_minutes = excluded.daily_goal_minutes, motivation = excluded.motivation,
             long_term_goal = excluded.long_term_goal, updated_at = excluded.updated_at`,
          [p.id, p.displayName, p.uiLanguage, p.dailyGoalMinutes, p.motivation, p.longTermGoal, p.createdAt, p.updatedAt],
        );
      },
    },

    subjects: {
      async list() {
        const rows = await db.select<{ subject_id: SubjectId; level: SubjectEnrollment['level']; enrolled_at: string }>(
          'SELECT subject_id, level, enrolled_at FROM subjects WHERE deleted_at IS NULL ORDER BY enrolled_at, subject_id',
        );
        return rows.map((r) => ({ subjectId: r.subject_id, level: r.level, enrolledAt: r.enrolled_at }));
      },
      async save(e) {
        await db.execute(
          `INSERT INTO subjects (subject_id, level, enrolled_at, deleted_at) VALUES ($1, $2, $3, NULL)
           ON CONFLICT(subject_id) DO UPDATE SET level = excluded.level, deleted_at = NULL`,
          [e.subjectId, e.level, e.enrolledAt],
        );
      },
      async remove(subjectId) {
        await db.execute('UPDATE subjects SET deleted_at = $1 WHERE subject_id = $2', [new Date().toISOString(), subjectId]);
      },
    },

    skills: {
      list: listSkills,
      async saveMany(skills) {
        for (const s of skills) {
          await db.execute(
            'INSERT INTO skills (id, subject_id, title) VALUES ($1, $2, $3) ON CONFLICT(id) DO UPDATE SET title = excluded.title',
            [s.id, s.subjectId, s.title],
          );
          for (const p of s.prerequisites) {
            await db.execute('INSERT OR IGNORE INTO skill_edges (skill_id, prerequisite_id) VALUES ($1, $2)', [s.id, p]);
          }
        }
      },
    },

    items: {
      async get(id) {
        const [r] = await db.select<ItemRow>(`SELECT ${ITEM_COLUMNS} FROM review_items WHERE id = $1 AND deleted_at IS NULL`, [id]);
        return r ? toItem(r) : null;
      },
      async list(filter) {
        const rows = await db.select<ItemRow>(
          filter?.subjectId
            ? `SELECT ${ITEM_COLUMNS} FROM review_items WHERE deleted_at IS NULL AND subject_id = $1 ORDER BY created_at, id`
            : `SELECT ${ITEM_COLUMNS} FROM review_items WHERE deleted_at IS NULL ORDER BY created_at, id`,
          filter?.subjectId ? [filter.subjectId] : [],
        );
        return rows.map(toItem);
      },
      async listDue(now, limit, subjectId) {
        const rows = await db.select<ItemRow>(
          `SELECT ${ITEM_COLUMNS} FROM review_items
           WHERE deleted_at IS NULL AND reps > 0 AND due_at <= $1 ${subjectId ? 'AND subject_id = $2' : ''}
           ORDER BY due_at LIMIT ${subjectId ? '$3' : '$2'}`,
          subjectId ? [now.toISOString(), subjectId, limit] : [now.toISOString(), limit],
        );
        return rows.map(toItem);
      },
      async listNew(limit, subjectId) {
        const rows = await db.select<ItemRow>(
          `SELECT ${ITEM_COLUMNS} FROM review_items
           WHERE deleted_at IS NULL AND reps = 0 ${subjectId ? 'AND subject_id = $1' : ''}
           ORDER BY created_at, rowid LIMIT ${subjectId ? '$2' : '$1'}`,
          subjectId ? [subjectId, limit] : [limit],
        );
        return rows.map(toItem);
      },
      async saveMany(items) {
        for (const i of items) {
          await db.execute(
            `INSERT INTO review_items (${ITEM_COLUMNS})
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT(id) DO UPDATE SET front = excluded.front, back = excluded.back, note = excluded.note,
               source = excluded.source, stability = excluded.stability, difficulty = excluded.difficulty,
               reps = excluded.reps, lapses = excluded.lapses, last_reviewed_at = excluded.last_reviewed_at,
               due_at = excluded.due_at, updated_at = excluded.updated_at`,
            [
              i.id, i.subjectId, i.skillId, i.kind, i.front, i.back, i.note ?? null, i.source ?? null,
              i.srs.stability, i.srs.difficulty, i.srs.reps, i.srs.lapses, i.srs.lastReviewedAt, i.srs.dueAt,
              i.createdAt, i.updatedAt,
            ],
          );
        }
      },
    },

    logs: {
      async append(l) {
        await db.execute(
          `INSERT INTO review_logs (id, item_id, subject_id, skill_id, rating, reviewed_at, response_ms, elapsed_days, stability_before, stability_after)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [l.id, l.itemId, l.subjectId, l.skillId, l.rating, l.reviewedAt, l.responseMs, l.elapsedDays, l.stabilityBefore, l.stabilityAfter],
        );
      },
      async list(filter) {
        const clauses: string[] = [];
        const params: unknown[] = [];
        if (filter?.subjectId) {
          params.push(filter.subjectId);
          clauses.push(`subject_id = $${params.length}`);
        }
        if (filter?.since) {
          params.push(filter.since);
          clauses.push(`reviewed_at >= $${params.length}`);
        }
        const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
        return (await db.select<LogRow>(`SELECT * FROM review_logs ${where} ORDER BY reviewed_at`, params)).map(toLog);
      },
    },

    mistakes: {
      async append(m) {
        await db.execute(
          'INSERT INTO mistakes (id, subject_id, skill_id, tag, expected, given, occurred_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [m.id, m.subjectId, m.skillId, m.tag, m.expected, m.given, m.occurredAt],
        );
      },
      async list(filter) {
        const rows = await db.select<{
          id: string;
          subject_id: SubjectId;
          skill_id: string;
          tag: string;
          expected: string;
          given: string;
          occurred_at: string;
        }>(
          filter?.subjectId ? 'SELECT * FROM mistakes WHERE subject_id = $1 ORDER BY occurred_at' : 'SELECT * FROM mistakes ORDER BY occurred_at',
          filter?.subjectId ? [filter.subjectId] : [],
        );
        return rows.map(
          (r): Mistake => ({
            id: r.id,
            subjectId: r.subject_id,
            skillId: r.skill_id,
            tag: r.tag,
            expected: r.expected,
            given: r.given,
            occurredAt: r.occurred_at,
          }),
        );
      },
    },

    activity: {
      async get(day) {
        const [r] = await db.select<DailyActivity>('SELECT day, minutes, xp, reviews, correct FROM daily_activity WHERE day = $1', [day]);
        return r ?? null;
      },
      async list() {
        return db.select<DailyActivity>('SELECT day, minutes, xp, reviews, correct FROM daily_activity ORDER BY day');
      },
      async increment(day, delta) {
        await db.execute(
          `INSERT INTO daily_activity (day, minutes, xp, reviews, correct) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT(day) DO UPDATE SET minutes = minutes + excluded.minutes, xp = xp + excluded.xp,
             reviews = reviews + excluded.reviews, correct = correct + excluded.correct`,
          [day, delta.minutes ?? 0, delta.xp ?? 0, delta.reviews ?? 0, delta.correct ?? 0],
        );
        const [r] = await db.select<DailyActivity>('SELECT day, minutes, xp, reviews, correct FROM daily_activity WHERE day = $1', [day]);
        return r!;
      },
    },

    aiMessages: {
      async list(limit) {
        const rows = await db.select<{ id: string; role: AiMessage['role']; content: string; subject_id: SubjectId | null; created_at: string }>(
          'SELECT * FROM (SELECT *, rowid AS seq FROM ai_messages ORDER BY created_at DESC, rowid DESC LIMIT $1) ORDER BY created_at, seq',
          [limit],
        );
        return rows.map((r) => ({ id: r.id, role: r.role, content: r.content, subjectId: r.subject_id ?? undefined, createdAt: r.created_at }));
      },
      async append(m) {
        await db.execute('INSERT INTO ai_messages (id, role, content, subject_id, created_at) VALUES ($1, $2, $3, $4, $5)', [
          m.id,
          m.role,
          m.content,
          m.subjectId ?? null,
          m.createdAt,
        ]);
      },
      async clear() {
        await db.execute('DELETE FROM ai_messages');
      },
    },

    settings: {
      async get<T>(key: string) {
        const [r] = await db.select<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
        return r ? (JSON.parse(r.value) as T) : null;
      },
      async set<T>(key: string, value: T) {
        await db.execute('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
          key,
          JSON.stringify(value),
        ]);
      },
    },

    async wipeAll() {
      for (const table of ['profile', 'subjects', 'skill_edges', 'skills', 'review_items', 'review_logs', 'mistakes', 'daily_activity', 'ai_messages', 'settings']) {
        await db.execute(`DELETE FROM ${table}`);
      }
    },
  };
}
