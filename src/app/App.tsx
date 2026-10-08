import { useEffect } from 'react';
import { Starfield } from '../components/fx/Starfield';
import { Icon, type IconName } from '../components/ui/Icon';
import { UpdateBanner } from '../components/UpdateBanner';
import { Assistant } from '../features/assistant/Assistant';
import { Dashboard } from '../features/dashboard/Dashboard';
import { Onboarding } from '../features/onboarding/Onboarding';
import { ReviewSession } from '../features/review/ReviewSession';
import { Settings } from '../features/settings/Settings';
import { actions, useApp, type Route } from './store';

const NAV: { route: Route; label: string; icon: IconName }[] = [
  { route: 'dashboard', label: 'Système', icon: 'orbit' },
  { route: 'review', label: 'Réviser', icon: 'cards' },
  { route: 'assistant', label: 'Tuteur', icon: 'core' },
  { route: 'settings', label: 'Réglages', icon: 'sliders' },
];

export function App() {
  const status = useApp((s) => s.status);
  const error = useApp((s) => s.error);
  const profile = useApp((s) => s.profile);
  const route = useApp((s) => s.route);
  const dueCount = useApp((s) => s.progress?.dueCount ?? 0);
  const reviewNonce = useApp((s) => s.reviewNonce);

  useEffect(() => {
    void actions.init();
  }, []);

  if (status === 'loading') {
    return (
      <div className="splash" aria-busy="true">
        <Starfield />
        <div className="boot">
          <div className="boot-orbits" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <p className="boot-word">Savio</p>
        </div>
      </div>
    );
  }

  if (status === 'error')
    return (
      <div className="splash">
        <div className="stack narrow">
          <h2>Savio n’a pas pu démarrer.</h2>
          <p className="notice notice-danger">{error}</p>
          <p className="muted">Ferme l’application et relance-la. Si le problème persiste, signale-le sur GitHub avec ce message.</p>
        </div>
      </div>
    );

  if (!profile)
    return (
      <>
        <Starfield />
        <Onboarding />
      </>
    );

  const focus = route === 'review';

  return (
    <div className={focus ? 'shell is-focus' : 'shell'} data-route={route}>
      <Starfield />
      <header className="topbar">
        <button type="button" className="wordmark" onClick={() => actions.navigate('dashboard')} aria-label="Savio, retour au système">
          <img src="/savio.svg" alt="" width={26} height={26} />
          <span>Savio</span>
        </button>
        <UpdateBanner />
      </header>

      <main className="view" key={route === 'review' ? `review-${reviewNonce}` : route}>
        {route === 'dashboard' && <Dashboard />}
        {route === 'review' && <ReviewSession />}
        {route === 'assistant' && <Assistant />}
        {route === 'settings' && <Settings />}
      </main>

      <nav className="dock" aria-label="Navigation principale">
        {NAV.map((item) => (
          <button
            key={item.route}
            type="button"
            className="dock-item"
            aria-current={route === item.route ? 'page' : undefined}
            onClick={() => (item.route === 'review' ? actions.startReview() : actions.navigate(item.route))}
          >
            <Icon name={item.icon} size={22} />
            <span className="dock-label">{item.label}</span>
            {item.route === 'review' && dueCount > 0 && <span className="dock-count">{dueCount}</span>}
          </button>
        ))}
      </nav>
    </div>
  );
}
