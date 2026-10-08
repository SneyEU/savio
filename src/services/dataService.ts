import type { Repositories } from '../core/ports';

export const EXPORT_FORMAT_VERSION = 1;

/** Export complet et lisible des données de l'utilisateur (portabilité, sauvegarde). */
export async function exportAllData(repos: Repositories, now: Date): Promise<string> {
  const [profile, subjects, skills, items, logs, mistakes, activity, aiMessages] = await Promise.all([
    repos.profile.get(),
    repos.subjects.list(),
    repos.skills.list(),
    repos.items.list(),
    repos.logs.list(),
    repos.mistakes.list(),
    repos.activity.list(),
    repos.aiMessages.list(100_000),
  ]);
  return JSON.stringify(
    { format: 'savio-export', version: EXPORT_FORMAT_VERSION, exportedAt: now.toISOString(), profile, subjects, skills, items, logs, mistakes, activity, aiMessages },
    null,
    2,
  );
}

export function exportFileName(now: Date): string {
  return `savio-export-${now.toISOString().slice(0, 10)}.json`;
}
