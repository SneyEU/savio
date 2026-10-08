import { useEffect, useState } from 'react';
import { services } from '../app/store';
import { checkForUpdate, UPDATE_SETTING, type AvailableUpdate } from '../services/updates';

/** Délai avant la vérification automatique, pour ne pas ralentir le démarrage. */
const CHECK_DELAY_MS = 4000;

/** Bandeau discret affiché quand une nouvelle version de Savio est disponible. */
export function UpdateBanner() {
  const [update, setUpdate] = useState<AvailableUpdate | null>(null);
  const [progress, setProgress] = useState<number | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const auto = (await services().repos.settings.get<boolean>(UPDATE_SETTING)) ?? true;
        if (auto) setUpdate(await checkForUpdate());
      } catch {
        // Hors ligne ou GitHub injoignable : on réessaiera au prochain lancement.
      }
    }, CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!update || dismissed) return null;
  const installing = progress !== undefined;

  return (
    <div className="update-banner" role="status">
      <div>
        <strong>Savio {update.version} est disponible.</strong>{' '}
        {installing ? (
          <span className="muted">
            {progress === null ? 'Téléchargement…' : `Téléchargement ${Math.round((progress ?? 0) * 100)} %`} — Savio redémarrera tout seul.
          </span>
        ) : (
          <span className="muted">Tu utilises la version {update.currentVersion}. Ta progression est conservée.</span>
        )}
        {error && <p className="notice notice-danger">{error}</p>}
      </div>
      {!installing && (
        <div className="row">
          <button type="button" className="btn btn-ghost" onClick={() => setDismissed(true)}>
            Plus tard
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              setError(null);
              setProgress(null);
              try {
                await update.install(setProgress);
              } catch (e) {
                setProgress(undefined);
                setError(`La mise à jour a échoué : ${e instanceof Error ? e.message : String(e)}`);
              }
            }}
          >
            Mettre à jour
          </button>
        </div>
      )}
    </div>
  );
}
