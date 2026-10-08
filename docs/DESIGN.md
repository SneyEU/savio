# Direction artistique — « Orrery »

Savio est un **planétarium mécanique du savoir**. L'apprenant est au centre de son propre système : son niveau est un soleil, ses matières sont des planètes, sa régularité dessine une constellation, et le tuteur IA est un noyau lumineux.

## Pourquoi cette refonte

L'interface 0.1 reprenait le gabarit de la plupart des SaaS : barre latérale, grand titre de salutation, cartes empilées, emojis comme icônes, statistiques en texte (« 0 / 15 min »), chat en bulles. Rien n'était reconnaissable sans le logo.

| Supprimé | Remplacé par |
|---|---|
| Barre latérale | Dock flottant en bas, qui disparaît en mode séance |
| Cartes empilées | Sections séparées par des filets, compositions qui se chevauchent |
| Emojis | Glyphes typographiques (`ES`, `あ`, `∑`, `♞`, `Ⅻ`…) et icônes dessinées |
| Statistiques en texte | Soleil de niveau, anneau d'XP, constellation, spectre de maîtrise |
| Chat en bulles | Noyau animé + réponse en grand + fil de questions |
| Mascotte | Présence abstraite (le noyau), plus adulte |

## Jetons

- **Couleurs (nuit)** : fond pétrole-nuit `#0f0c29`, laiton/ambre `#ffb938` pour l'action, menthe `#3ee6b0` pour la réussite, rose `#ff6f9c` pour les erreurs (jamais de rouge), violet `#8b6cff` en accent rare. Mode clair : ciel d'aube `#f4f1ff`, encre `#1b1547`.
- **Planètes** : une couleur par catégorie (langues ciel, sciences menthe, histoire laiton, religions parchemin sobre, stratégie corail, arts rose).
- **Typographie** : Fredoka (titres, chiffres, boutons, navigation), Atkinson Hyperlegible (lecture). Titres très grands (jusqu'à 6 rem) pour l'impact.
- **Forme** : boutons « touches » avec épaisseur (`--depth`), pastilles, cercles et orbites. Les cartes de révision ont un **coin taillé**, signature des surfaces Savio.
- **Mouvement** : `--ease-spring` (ressort, via `linear()`), `--ease-bounce`, durées 140 / 280 / 600 ms. Tout est coupé avec `prefers-reduced-motion`.

## Animations et leur raison d'être

| Animation | Pourquoi |
|---|---|
| Planètes en orbite, ralentissent au survol | Montrer les matières comme un système vivant ; rendre le clic facile |
| Planètes qui pulsent | Signaler les cartes à réviser sans badge criard |
| Anneau d'XP qui se remplit | Rendre visible la progression vers le niveau suivant |
| Constellation qui se trace | La série devient une image qu'on n'a pas envie de casser |
| Morphing soleil → noyau (View Transitions) | Continuité : le tuteur « sort » du système |
| Carte qui se retourne en 3D et suit le curseur | Le geste de réviser devient physique |
| Envolée menthe + étincelles / tremblement rose | Retour immédiat et lisible, sans infantiliser |
| « +XP » qui s'envole, série ×N | Récompense au moment exact de l'effort |
| Séquence de fin en temps successifs | Le bilan se lit comme une histoire : précision → XP → niveau → compétences → erreurs → suite |
| Cérémonie de niveau | Marquer un vrai palier |
| Noyau : respire / se resserre / pulse | Comprendre instantanément « prêt / réfléchit / parle » |
| Révélations au scroll | Le tableau de bord se découvre au lieu de s'empiler |
| Démarrage : orbites qui s'assemblent | Pas de « Chargement… » |

## Technique

Zéro dépendance d'animation : CSS (keyframes, `linear()`, `animation-timeline: view()`), SVG, Canvas 2D (ciel, noyau, célébrations), API View Transitions native de WebView2. Les positions des planètes et le tilt écrivent directement dans le DOM, sans re-rendu React.

## À venir

Écrans qui auront leur propre univers dans la même grammaire : échiquier animé (stratégie), visualisations (sciences), carte de progression par zones, conversation vocale avec écoute (le noyau a déjà l'état `listening`).
