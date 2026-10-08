import { useEffect, useState } from 'react';
import { createProvider } from '../../core/ai/gateway';
import type { ProviderConfig, ProviderHealth } from '../../core/ai/types';
import { applyProviderConfig, currentProviderConfig, SETTINGS } from '../../services/container';
import { exportAllData, exportFileName } from '../../services/dataService';
import { actions, services, useApp, type ThemeChoice } from '../../app/store';

const THEMES: { id: ThemeChoice; label: string }[] = [
  { id: 'system', label: 'Système' },
  { id: 'light', label: 'Clair' },
  { id: 'dark', label: 'Sombre' },
];

type Kind = ProviderConfig['kind'];

export function Settings() {
  const theme = useApp((s) => s.theme);
  const profile = useApp((s) => s.profile);
  const platform = services().platform;
  const [kind, setKind] = useState<Kind>('ollama');
  const [baseUrl, setBaseUrl] = useState('http://127.0.0.1:11434');
  const [model, setModel] = useState('qwen2.5:3b');
  const [health, setHealth] = useState<ProviderHealth | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [saveHistory, setSaveHistory] = useState(true);
  const [goal, setGoal] = useState(profile?.dailyGoalMinutes ?? 15);
  const [confirmWipe, setConfirmWipe] = useState(false);

  useEffect(() => {
    const svc = services();
    void currentProviderConfig(svc).then((c) => {
      setKind(c.kind);
      if (c.kind !== 'offline') {
        setBaseUrl(c.baseUrl);
        setModel(c.model);
      }
    });
    void svc.repos.settings.get<boolean>(SETTINGS.saveAiHistory).then((v) => setSaveHistory(v ?? true));
  }, []);

  const config = (): ProviderConfig => (kind === 'offline' ? { kind } : { kind, baseUrl: baseUrl.trim(), model: model.trim() });

  async function testConnection() {
    setHealth({ ok: false, detail: 'Test en cours…' });
    setHealth(await createProvider(config(), services().fetchFn).healthCheck());
  }

  async function saveProvider() {
    await applyProviderConfig(services(), config());
    setSaved('Fournisseur IA enregistré.');
  }

  async function saveGoal() {
    if (!profile) return;
    await services().repos.profile.save({ ...profile, dailyGoalMinutes: goal, updatedAt: new Date().toISOString() });
    await actions.refresh();
    setSaved('Objectif quotidien enregistré.');
  }

  async function exportData() {
    const svc = services();
    const now = svc.clock.now();
    const where = await svc.saveExport(exportFileName(now), await exportAllData(svc.repos, now));
    setSaved(`Export enregistré : ${where}`);
  }

  return (
    <div className="page settings">
      <h1>Réglages</h1>
      {saved && (
        <p className="notice" role="status">
          {saved}
        </p>
      )}

      <section className="surface stack" aria-labelledby="s-learning">
        <h3 id="s-learning">Apprentissage</h3>
        <div className="field">
          <label htmlFor="goal">Objectif quotidien : {goal} minutes</label>
          <input id="goal" type="range" min={5} max={120} step={5} value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
        </div>
        <div>
          <button type="button" className="btn btn-secondary" onClick={saveGoal}>
            Enregistrer l’objectif
          </button>
        </div>
      </section>

      <section className="surface stack" aria-labelledby="s-theme">
        <h3 id="s-theme">Apparence</h3>
        <div className="segmented" role="radiogroup" aria-labelledby="s-theme">
          {THEMES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={theme === t.id} onClick={() => actions.setTheme(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </section>

      <section className="surface stack" aria-labelledby="s-ai">
        <h3 id="s-ai">Intelligence artificielle</h3>
        <p className="muted">
          Par défaut, Savio utilise un modèle installé sur ton ordinateur avec Ollama : gratuit, hors ligne, privé. Sans modèle, tout fonctionne sauf
          le tuteur.
        </p>
        <div className="segmented" role="radiogroup" aria-label="Fournisseur">
          {(
            [
              ['ollama', 'Ollama (local)'],
              ['openai-compatible', 'Serveur compatible OpenAI'],
              ['offline', 'Sans IA'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={kind === id} onClick={() => setKind(id)}>
              {label}
            </button>
          ))}
        </div>
        {kind !== 'offline' && (
          <div className="grid-2">
            <div className="field">
              <label htmlFor="url">Adresse du serveur</label>
              <input id="url" className="input" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="model">Modèle</label>
              <input id="model" className="input" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
          </div>
        )}
        {kind === 'openai-compatible' && (
          <p className="muted">Compatible avec llama.cpp (llama-server), LM Studio ou vLLM. Exemple : http://127.0.0.1:8080/v1</p>
        )}
        {platform === 'tauri' && kind !== 'offline' && (
          <p className="muted">Pour protéger ta vie privée, cette version n’autorise que les serveurs installés sur cet ordinateur.</p>
        )}
        {health && <p className={health.ok ? 'notice' : 'notice notice-danger'}>{health.detail}</p>}
        <div className="row">
          {kind !== 'offline' && (
            <button type="button" className="btn btn-secondary" onClick={testConnection}>
              Tester la connexion
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={saveProvider}>
            Enregistrer
          </button>
        </div>
      </section>

      <section className="surface stack" aria-labelledby="s-privacy">
        <h3 id="s-privacy">Confidentialité et données</h3>
        <label className="row checkbox">
          <input
            type="checkbox"
            checked={saveHistory}
            onChange={async (e) => {
              setSaveHistory(e.target.checked);
              await services().repos.settings.set(SETTINGS.saveAiHistory, e.target.checked);
            }}
          />
          Enregistrer l’historique des conversations avec le tuteur
        </label>
        <p className="muted">
          Tes données sont stockées uniquement sur cet ordinateur{platform === 'browser' ? ' (en mode navigateur, elles sont perdues à la fermeture de l’onglet)' : ''}.
          Elles ne servent jamais à entraîner un modèle.
        </p>
        <div className="row">
          <button type="button" className="btn btn-secondary" onClick={exportData}>
            Exporter mes données
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={async () => {
              await services().repos.aiMessages.clear();
              setSaved('Historique du tuteur effacé.');
            }}
          >
            Effacer l’historique du tuteur
          </button>
        </div>
        <div className="danger-zone stack">
          {confirmWipe ? (
            <>
              <p>Tout supprimer : profil, progression, cartes et historique. Cette action est définitive.</p>
              <div className="row">
                <button type="button" className="btn btn-danger" onClick={() => actions.wipeAll()}>
                  Supprimer définitivement
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmWipe(false)}>
                  Annuler
                </button>
              </div>
            </>
          ) : (
            <div>
              <button type="button" className="btn btn-danger" onClick={() => setConfirmWipe(true)}>
                Supprimer toutes mes données
              </button>
            </div>
          )}
        </div>
      </section>

      <p className="muted">Savio 0.1.0 — logiciel libre sous licence AGPL-3.0-or-later.</p>
    </div>
  );
}
