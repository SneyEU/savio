import { describe, expect, it } from 'vitest';
import { CATEGORIES, normalize, searchSubjects, SUBJECT_CATALOG } from '../../src/core/content/catalog';
import { ALL_STARTER_DECKS } from '../../src/core/content/starterDecks';
import { LearningEngine } from '../../src/core/engine/learningEngine';
import { completeOnboarding, enrollSubjects } from '../../src/core/engine/onboarding';
import { createMemoryRepositories } from '../../src/infrastructure/memory/memoryRepositories';
import { FakeClock, SequentialIds } from './helpers';

describe('Catalogue des matières', () => {
  it('chaque matière a un identifiant unique et une catégorie connue', () => {
    const ids = SUBJECT_CATALOG.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    const categories = new Set(CATEGORIES.map((c) => c.id));
    for (const s of SUBJECT_CATALOG) expect(categories.has(s.category)).toBe(true);
  });

  it('chaque catégorie contient au moins une matière', () => {
    for (const c of CATEGORIES) expect(SUBJECT_CATALOG.some((s) => s.category === c.id)).toBe(true);
  });

  it('inclut les religions et les jeux de stratégie demandés', () => {
    const ids = new Set(SUBJECT_CATALOG.map((s) => s.id));
    for (const id of ['islam', 'christianity', 'judaism', 'chess', 'shogi', 'xiangqi', 'go', 'draughts']) expect(ids.has(id)).toBe(true);
  });

  it('la recherche ignore accents et majuscules, et couvre les mots-clés', () => {
    expect(normalize('Échecs')).toBe('echecs');
    expect(searchSubjects('echecs').map((s) => s.id)).toContain('chess');
    expect(searchSubjects('TORAH').map((s) => s.id)).toEqual(['judaism']);
    expect(searchSubjects('religions').length).toBe(3);
    expect(searchSubjects('').length).toBe(SUBJECT_CATALOG.length);
  });
});

describe('Decks de démarrage', () => {
  it('chaque deck correspond à une matière du catalogue', () => {
    const ids = new Set(SUBJECT_CATALOG.map((s) => s.id));
    for (const d of ALL_STARTER_DECKS) expect(ids.has(d.subjectId)).toBe(true);
  });

  it('chaque carte référence une compétence de son deck et a une clé unique', () => {
    const keys = new Set<string>();
    for (const d of ALL_STARTER_DECKS) {
      const skills = new Set(d.skills.map((s) => s.id));
      for (const card of d.cards) {
        expect(skills.has(card.skillId)).toBe(true);
        expect(keys.has(card.key)).toBe(false);
        keys.add(card.key);
      }
    }
  });

  it('les contenus religieux citent une source (sauf note explicative)', () => {
    for (const d of ALL_STARTER_DECKS.filter((d) => ['islam', 'christianity', 'judaism'].includes(d.subjectId))) {
      for (const card of d.cards) expect(card.source ?? card.note).toBeTruthy();
    }
  });
});

describe('Inscription aux matières', () => {
  it('ajouter une matière plus tard charge son deck ; la retirer la sort des sessions', async () => {
    const repos = createMemoryRepositories();
    const clock = new FakeClock();
    const ids = new SequentialIds();
    const engine = new LearningEngine(repos, clock, ids);
    await completeOnboarding(
      { displayName: 'Matt', subjects: [{ subjectId: 'shogi', level: 'beginner' }], dailyGoalMinutes: 20, motivation: 'curiosity', longTermGoal: '' },
      repos,
      clock,
      ids,
    );
    expect(await enrollSubjects([{ subjectId: 'judaism', level: 'beginner' }], repos, clock)).toBe(5);

    const plan = await engine.planToday(20);
    const subjects = new Set(plan.queue.map((i) => i.subjectId));
    expect(subjects).toEqual(new Set(['shogi', 'judaism']));
    // Nouveautés alternées entre matières.
    expect(plan.queue[0]!.subjectId).not.toBe(plan.queue[1]!.subjectId);

    await repos.subjects.remove('shogi');
    expect((await engine.planToday(20)).queue.every((i) => i.subjectId === 'judaism')).toBe(true);
  });
});
