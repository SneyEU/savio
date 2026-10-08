/**
 * Mises à jour de l'application (Tauri uniquement).
 * Les mises à jour sont publiées sur GitHub Releases et signées : l'application refuse
 * tout fichier dont la signature ne correspond pas à la clé publique intégrée.
 */
import { isTauri } from './container';

export interface AvailableUpdate {
  version: string;
  currentVersion: string;
  notes?: string;
  /** Télécharge, installe puis relance Savio. `onProgress` reçoit une valeur entre 0 et 1 (ou null si la taille est inconnue). */
  install(onProgress: (ratio: number | null) => void): Promise<void>;
}

export const UPDATE_SETTING = 'updates.autoCheck';

export async function currentAppVersion(): Promise<string | null> {
  if (!isTauri()) return null;
  const { getVersion } = await import('@tauri-apps/api/app');
  return getVersion();
}

/** Contacte GitHub pour savoir si une version plus récente existe. Retourne null si l'application est à jour. */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  if (!isTauri()) return null;
  const [{ check }, { relaunch }] = await Promise.all([import('@tauri-apps/plugin-updater'), import('@tauri-apps/plugin-process')]);
  const update = await check();
  if (!update) return null;

  return {
    version: update.version,
    currentVersion: update.currentVersion,
    notes: update.body ?? undefined,
    async install(onProgress) {
      let total = 0;
      let received = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength ?? 0;
          onProgress(total > 0 ? 0 : null);
        } else if (event.event === 'Progress') {
          received += event.data.chunkLength;
          onProgress(total > 0 ? Math.min(1, received / total) : null);
        } else {
          onProgress(1);
        }
      });
      // Sous Windows, l'installateur ferme déjà l'application ; ailleurs on relance nous-mêmes.
      await relaunch();
    },
  };
}
