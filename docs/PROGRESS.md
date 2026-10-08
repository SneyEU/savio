# Suivi d’avancement

Document de reprise : à lire en premier pour savoir où en est le projet.

## Dernière étape atteinte — 8 octobre 2026

**Phase 1, étapes 1 à 9 faites ; étape 10 (implémentation progressive) commencée.**

### Fait

- **8 oct., 11 h 45** : objectif quotidien par paliers de 5 à 120 min (sélecteur à jalons inspiré de 21st.dev), l’objectif n’est plus une limite (séances bonus de 5 min, « Objectif du jour atteint »), police Fredoka pour l’interface (OFL), Atkinson Hyperlegible pour la lecture

- **8 oct., 11 h** : mises à jour automatiques signées (bandeau au démarrage, section Réglages → Mises à jour, workflow « Publier une version »). Clé publique dans `tauri.conf.json` ; la clé privée vit uniquement dans les secrets GitHub du mainteneur.

- **8 oct., 10 h 30** : catalogue de 42 matières en 6 catégories (langues, maths et sciences, histoire et société, religions, jeux de stratégie, arts), sélecteur avec recherche, onglets et liste défilante, gestion des matières dans les réglages ; christianisme, judaïsme, shogi, xiangqi, go, dames ajoutés avec decks de démarrage ; nouveautés alternées entre matières ; pictogrammes compatibles Windows (pas de drapeaux emoji)

- Analyse, architecture, MVP, roadmap, licence : `docs/ARCHITECTURE.md`
- Dépôt prêt pour GitHub : README, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, `.env.example`, `.gitignore`, modèles d’issues et de PR
- CI : `ci.yml` (lint, types, tests, build web, fmt + clippy Rust) et `build-windows.yml` (Setup.exe en artifact, brouillon de Release sur tag)
- Shell Tauri 2 : SQLite avec migrations embarquées, HTTP limité à `localhost`, commande d’export, icônes, installateur NSIS
- **Cœur `src/core`** (TypeScript pur) :
  - FSRS-4.5 implémenté et testé, échelons Nouveau → Maîtrisé
  - XP pondérée par la difficulté du rappel, niveaux, série de jours
  - Modèle apprenant : réussite lissée par compétence, confusions récurrentes, graphe de prérequis, résumé pour le tuteur
  - Planificateur de session (révisions dues d’abord, points faibles en tête, nouveautés selon le temps et le retard)
  - Onboarding avec plan quotidien et decks de démarrage originaux (espagnol, anglais, échecs, islam sourcé)
  - Passerelle IA : Ollama, serveurs compatibles OpenAI, repli hors ligne, signalement local/distant ; tuteur avec prompt versionné ; extraction de cartes
  - Ports de la voix (STT, TTS, VAD) déclarés pour la phase 2
- Dépôts mémoire et SQLite (même comportement, testés sur le vrai schéma)
- Interface : onboarding en 5 étapes, tableau de bord (sillage des 14 derniers jours, objectif du jour, session suivante, matières, maîtrise), session de révision au clavier, tuteur en streaming avec indicateur de confidentialité et ajout de cartes, réglages (objectif, thème, IA, confidentialité, export, effacement)
- Thèmes clair / sombre / système, design system en jetons CSS

### Vérifications effectuées

| Vérification | Résultat |
|---|---|
| 41 tests du cœur et des dépôts SQLite | ✅ tous passent |
| Typage strict de `src/core`, `src/infrastructure/memory` et `tests` | ✅ |
| Bundle de l’interface + parcours complet dans un navigateur (onboarding → révision → tuteur → réglages, clair et sombre) | ✅ aucune erreur |
| `rustfmt` | ✅ |
| CI GitHub : `npm install`, ESLint, typage complet, tests, build web, `cargo fmt` + `clippy` | ✅ vert au premier passage |
| Build Windows : installateur NSIS (artifact `savio-windows-setup`) | ✅ généré en ~13 min |

### À faire tout de suite (par l’humain)

1. ~~Créer le dépôt GitHub public et pousser le code~~ : fait (github.com/SneyEU/savio).
2. Ajouter le fichier `LICENSE` : sur GitHub, **Add file → Create new file**, nommer `LICENSE`, choisir le modèle **GNU Affero General Public License v3.0**.
3. `npm install` puis committer `package-lock.json` (rend la CI reproductible).
4. ~~Remplacer `OWNER`~~ fait (SneyEU).
5. Lancer `npm run tauri:dev` une première fois et signaler toute erreur de compilation.

## Prochaines étapes (ordre prévu)

1. **Corriger ce que remonte le premier build réel** (npm, ESLint, Rust).
2. Tests de composants (Vitest + Testing Library) pour l’onboarding et la session de révision.
3. Saisie de la réponse (mode « écrire ») en plus du mode « se souvenir », avec comparaison tolérante aux accents : vraie détection d’erreurs pour les langues.
4. Statistiques détaillées par matière et par compétence.
5. Quêtes quotidiennes simples (« Réviser 20 cartes », « 10 minutes d’espagnol ») calculées par le moteur.
6. Version `v0.1.0` : tag, Release, captures d’écran dans le README.
7. Phase 2 : exercices de langue, synthèse vocale (voix Windows puis Piper), reconnaissance whisper.cpp, commandes vocales.

## Décisions prises

| Date | Décision | Raison |
|---|---|---|
| 2026-10-08 | Nom « Savio » (remplace « Sillage ») | *Savio* = « sage » en italien, évoque savoir/savvy ; court, international, vendeur |
| 2026-10-08 | AGPL-3.0-or-later (code), CC BY-SA 4.0 (contenu) | Garder le logiciel libre y compris en SaaS ; compatible Stockfish |
| 2026-10-08 | FSRS implémenté en interne | Algorithme public, ~150 lignes, aucune dépendance |
| 2026-10-08 | Pas de bibliothèque d’état (store maison sur `useSyncExternalStore`) | Une dépendance de moins pour un besoin minime |
| 2026-10-08 | Réseau Tauri limité à `localhost` | Confidentialité par défaut ; l’ouverture aux API distantes sera explicite |
| 2026-10-08 | Ollama comme runtime IA par défaut | Gratuit, local, MIT, installation simple sous Windows |
