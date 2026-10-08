import { useEffect } from 'react';
import { Assistant } from '../features/assistant/Assistant';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Onboarding } from '../features/onboarding/Onboarding';
import { ReviewSession } from '../features/review/ReviewSession';
import { Settings } from '../features/settings/Settings';
import { actions, useApp, type Route } from './store';

const NAV: { route: Route; label: string; icon: string }[] = [
  { route: 'dashboard', label: 'Accueil', icon: '⌂' },
  { route: 'review', label: 'Réviser', icon: '◎' },
  { route: 'assistant', label: 'Tuteur', icon: '✦' },
  { route: 'settings', label: 'Réglages', icon: '⚙' },
];

export function App() {
  const status = useApp((s) => s.status);
  const error = useApp((s) => s.error);
  const profile = useApp((s) => s.profile);
  const route = useApp((s) => s.route);
  const dueCount = useApp((s) => s.progress?.dueCount ?? 0);

  useEffect(() => {
    void actions.init();
  }, []);

  if (status === 'loading') return <div className="splash muted">Ouverture de Savio…</div>;
  if (status === 'error')
    return (
      <div className="splash">
        <div className="stack">
          <h2>Savio n’a pas pu démarrer.</h2>
          <p className="notice notice-danger">{error}</p>
          <p className="muted">Ferme l’application et relance-la. Si le problème persiste, signale-le sur GitHub avec ce message.</p>
        </div>
      </div>
    );
  if (!profile) return <Onboarding />;

  return (
    <div className="shell">
      <nav className="sidebar" aria-label="Navigation principale">
        <div className="brand">
          <img src="/savio.svg" alt="" />
          Savio
        </div>
        {NAV.map((item) => (
          <button
            key={item.route}
            type="button"
            className="nav-item"
            aria-current={route === item.route ? 'page' : undefined}
            onClick={() => actions.navigate(item.route)}
          >
            <span aria-hidden="true">{item.icon}</span>
            {item.label}
            {item.route === 'review' && dueCount > 0 && <span className="nav-count">{dueCount}</span>}
          </button>
        ))}
        <p className="sidebar-foot">Libre, gratuit, et tes données restent ici.</p>
      </nav>
      <main className="main">
        {route === 'dashboard' && <Dashboard />}
        {route === 'review' && <ReviewSession key="review" />}
        {route === 'assistant' && <Assistant />}
        {route === 'settings' && <Settings />}
      </main>
    </div>
  );
}
