import { useMemo, useState } from 'react';
import { CATEGORIES, searchSubjects, type CategoryId } from '../core/content/catalog';
import { hasStarterContent } from '../core/content/starterDecks';
import type { SubjectId } from '../core/domain/types';

interface SubjectPickerProps {
  selected: ReadonlySet<SubjectId>;
  onToggle: (id: SubjectId) => void;
}

/** Choix des matières : recherche, filtre par catégorie, liste groupée qui défile. */
export function SubjectPicker({ selected, onToggle }: SubjectPickerProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryId | 'all'>('all');

  const groups = useMemo(() => {
    const found = searchSubjects(query);
    return CATEGORIES.filter((c) => category === 'all' || c.id === category)
      .map((c) => ({ category: c, subjects: found.filter((s) => s.category === c.id) }))
      .filter((g) => g.subjects.length > 0);
  }, [query, category]);

  return (
    <div className="picker">
      <input
        className="input"
        type="search"
        placeholder="Rechercher une matière (ex. japonais, torah, shogi…)"
        aria-label="Rechercher une matière"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="picker-tabs" role="tablist" aria-label="Catégories">
        {[{ id: 'all' as const, label: 'Tout' }, ...CATEGORIES].map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={category === c.id} onClick={() => setCategory(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="picker-scroll" tabIndex={0} aria-label="Liste des matières">
        {groups.length === 0 && <p className="muted">Aucune matière ne correspond. Le tuteur IA peut quand même t’aider sur ce sujet.</p>}
        {groups.map(({ category: c, subjects }) => (
          <section key={c.id} className="picker-group" aria-labelledby={`cat-${c.id}`}>
            <header>
              <h4 id={`cat-${c.id}`}>{c.label}</h4>
              <span className="muted">{c.description}</span>
            </header>
            <div className="choice-grid">
              {subjects.map((s) => (
                <button key={s.id} type="button" className="choice" aria-pressed={selected.has(s.id)} onClick={() => onToggle(s.id)}>
                  <span className="choice-emoji" aria-hidden="true">
                    {s.emoji}
                  </span>
                  <span>
                    {s.label}
                    <small>{hasStarterContent(s.id) ? 'Cartes incluses' : 'Avec le tuteur IA'}</small>
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="muted picker-count" aria-live="polite">
        {selected.size === 0 ? 'Aucune matière choisie' : `${selected.size} matière${selected.size > 1 ? 's' : ''} choisie${selected.size > 1 ? 's' : ''}`}
      </p>
    </div>
  );
}
