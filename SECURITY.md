# Sécurité

## Signaler une faille

Ne publiez pas de faille dans une issue publique. Utilisez le formulaire privé de GitHub : onglet **Security → Report a vulnerability** du dépôt.

Indiquez la version concernée, les étapes pour reproduire et l’impact possible. Nous accusons réception sous 7 jours.

## Versions maintenues

Seule la dernière version publiée reçoit des correctifs pendant la phase 0.x.

## Engagements du projet

- Les données restent sur l’ordinateur de l’utilisateur ; rien n’est envoyé sans action explicite.
- Le réseau de l’application est limité par les permissions Tauri (`src-tauri/capabilities`) aux serveurs IA locaux.
- Aucun secret dans le dépôt : `.env` est ignoré, les secrets de CI passent par GitHub Secrets.
- L’export de données n’écrit que dans le dossier Téléchargements, avec un nom de fichier filtré.
- Les migrations SQL utilisent exclusivement des requêtes paramétrées.
