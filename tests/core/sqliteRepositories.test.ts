/**
 * Tests d'intégration des dépôts SQLite avec le vrai schéma de migration,
 * exécutés sur `node:sqlite` (Node ≥ 22.13) — même moteur SQLite que l'application.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
import { Rating } from '../../src/core/domain/types';
import { LearningEngine } from '../../src/core/engine/learningEngine';
import { completeOnboarding } from '../../src/core/engine/onboarding';
import { createSqliteRepositories, type SqlDatabase } from '../../src/infrastructure/sqlite/sqliteRepositories';
import { FakeClock, SequentialIds } from './helpers';

function openTestDatabase(): SqlDatabase {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../../database/migrations/0001_init.sql', import.meta.url), 'utf8'));
  // $1 → ?1 : paramètres numérotés, même sémantique que sqlx dans tauri-plugin-sql.
  const prepare = (sql: string) => db.prepare(sql.replace(/\$(\d+)/g, '?$1'));
  type Bindable = null | number | string;
  const bind = (params: unknown[] = []) => params.map((p) => (p === undefined ? null : p)) as Bindable[];
  return {
    async execute(sql, params) {
      prepare(sql).run(...bind(params));
    },
    async select<T>(sql: string, params?: unknown[]) {
      return prepare(sql).all(...bind(params)) as T[];
    },
  };
}

describe('Dépôts SQLite', () => {
  it('parcours complet : onboarding, révisions, échéances, progression', async () => {
    const repos = createSqliteRepositories(openTestDatabase());
    const clock = new FakeClock();
    const ids = new SequentialIds();
    const engine = new LearningEngine(repos, clock, ids);

    await completeOnboarding(
      { displayName: 'Matt', subjects: [{ subjectId: 'islam', level: 'beginner' }], dailyGoalMinutes: 15, motivation: 'faith', longTermGoal: '' },
      repos,
      clock,
      ids,
    );
    expect((await repos.profile.get())?.displayName).toBe('Matt');
    expect((await repos.skills.list('islam')).length).toBeGreaterThan(0);

    const plan = await engine.planToday(15);
    expect(plan.newCount).toBeGreaterThan(0);
    for (const item of plan.queue) await engine.recordReview(item.id, Rating.Good, 2500);

    const stored = await repos.items.get(plan.queue[0]!.id);
    expect(stored?.srs.reps).toBe(1);
    expect(stored?.source).toBeTruthy();
    expect(await repos.logs.list({ subjectId: 'islam' })).toHaveLength(plan.queue.length);

    clock.advanceDays(30);
    expect((await repos.items.listDue(clock.now(), 100, 'islam')).length).toBe(plan.queue.length);

    const progress = await engine.progress();
    expect(progress.streak).toBe(0);
    expect(progress.totalXp).toBeGreaterThan(0);
  });

  it('activité, réglages, historique IA et effacement total', async () => {
    const repos = createSqliteRepositories(openTestDatabase());
    await repos.activity.increment('2026-10-08', { xp: 5, reviews: 1 });
    const day = await repos.activity.increment('2026-10-08', { xp: 3, minutes: 2 });
    expect(day).toMatchObject({ xp: 8, reviews: 1, minutes: 2 });

    await repos.settings.set('theme', { mode: 'dark' });
    expect(await repos.settings.get<{ mode: string }>('theme')).toEqual({ mode: 'dark' });

    for (let i = 0; i < 5; i++) {
      await repos.aiMessages.append({ id: `m${i}`, role: 'user', content: `msg ${i}`, createdAt: `2026-10-08T10:00:0${i}.000Z` });
    }
    expect((await repos.aiMessages.list(2)).map((m) => m.content)).toEqual(['msg 3', 'msg 4']);

    await repos.wipeAll();
    expect(await repos.activity.list()).toEqual([]);
    expect(await repos.aiMessages.list(10)).toEqual([]);
    expect(await repos.settings.get('theme')).toBeNull();
  });
});
