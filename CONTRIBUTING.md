# Contribuer à Savio

Merci de vouloir aider. Savio est un logiciel libre construit pour durer : chaque contribution doit rester simple à comprendre et à maintenir.

## Façons de contribuer

- **Contenu** (aucune programmation) : cartes, leçons, corrections, sources. Ouvre une issue « Contribuer du contenu ».
- **Traduction** de l’interface et des contenus.
- **Code** : moteur d’apprentissage, interface, IA, voix.
- **Tests utilisateurs** : installe une version, note ce qui bloque, ouvre une issue.

## Principes

À chaque changement, demande-toi :

1. Est-ce que ça aide réellement à apprendre ?
2. Est-ce que ça fonctionne sans abonnement, et si possible hors ligne ?
3. Les données de l’utilisateur restent-elles sous son contrôle ?
4. Est-ce simple à maintenir ?

## Organisation du code

| Dossier | Règle |
|---|---|
| `src/core` | TypeScript pur. Aucun import de React, Tauri ou `src/infrastructure` (vérifié par ESLint). Toute la logique métier vit ici. |
| `src/infrastructure` | Adaptateurs : SQLite, mémoire, HTTP. |
| `src/services` | Assemblage des dépendances. |
| `src/features` | Écrans. Ils appellent le moteur ; ils ne calculent pas eux-mêmes. |
| `database/migrations` | Une migration = un nouveau fichier numéroté. On ne modifie jamais une migration publiée. |

## Démarrer

```powershell
npm install
npm run dev        # interface dans le navigateur
npm run tauri:dev  # application native
npm run check      # avant chaque PR
```

## Pull requests

- Une PR = un sujet. Petite de préférence.
- Tests obligatoires pour tout changement de `src/core`.
- Captures d’écran pour tout changement visuel.
- Messages de commit clairs, au présent : `Ajoute la dictée en espagnol`.

## Certificat d’origine (DCO)

Nous n’utilisons pas de CLA. Chaque commit doit être signé pour certifier que tu as le droit de le contribuer sous la licence du projet ([developercertificate.org](https://developercertificate.org)) :

```powershell
git commit -s -m "Ajoute …"
```

## Contenus et licences

- Contenu original : publié sous CC BY-SA 4.0.
- Contenu tiers : uniquement domaine public, CC0, CC BY ou CC BY-SA, avec la source. Ajoute-le à `docs/CONTENT_LICENSES.md`.
- Jamais de contenu copié depuis des applications commerciales (Duolingo, Babbel, Chess.com, Quizlet…).
- Contenus religieux et historiques : chaque fait doit avoir une référence vérifiable. En cas de divergence entre écoles, présenter les positions sans trancher.

## Bonnes premières contributions

Les issues étiquetées `good first issue` sont choisies pour être faisables en quelques heures avec peu de contexte.
