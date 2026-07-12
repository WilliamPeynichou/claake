# Plan — Milestone 11 Skills : ressources Markdown

Date : 2026-07-11
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 11 / Feature 8.4

## Objectif

Permettre à un créateur de mettre à disposition les instructions et ressources d'une skill depuis
un fichier Markdown ou un dossier local contenant plusieurs fichiers Markdown.

```txt
fichier .md / dossier
→ navigateur transmet fichiers
→ API valide chaque fichier
→ ressources skill persistées
→ skill liée directement à un agent
→ injection contextuelle future
```

## Contrat V1 strict

- Seuls fichiers Markdown `.md` sont acceptés.
- Validation backend obligatoire : extension `.md`, MIME texte cohérent, buffer UTF-8 sans NUL,
  fichier non vide, taille et nombre de fichiers bornés.
- Un dossier est un lot de fichiers transmis par le navigateur : aucune archive ni chemin serveur.
- Les chemins relatifs sont normalisés, sans traversal (`..`), conservés comme métadonnée.
- PDF, Office, image, archive, binaire et fichier `.md` avec contenu binaire sont refusés.
- Backend reste autorité ; aucun secret ni ressource non validée dans le client.

## Lots

### Lot 1 — Domaine et persistance

- Modèles Prisma `AgentSkill` et `AgentSkillResource`, liés directement à l'agent.
- Migration, ownership créateur, cascade, unicité des chemins ressources.
- Service backend intégré au module `agents`.

### Lot 2 — Import sécurisé

- [x] Validator Markdown, bornes fichiers et lot.
- [x] Endpoint multipart de lot : le même endpoint couvre fichier unique ou dossier.
- [x] Lecture/listing, suppression du skill et réponse propriétaire avec contenu ressources.
- [x] Tests extension/MIME/binaire/taille/traversal/ownership.

### Lot 3 — Contrats et UI

- [x] Types shared et client API skills.
- [x] Gestionnaire créateur : création skill, import `.md`, sélection dossier (`webkitdirectory`).
- [x] État import détaillé, erreurs actionnables par fichier.

### Lot 4 — Livraison

- [x] Tests backend, Prisma generate, lint, builds ciblés.
- [x] Compte-rendu, index et roadmap.
- [x] Commit/push séparé.

## Critère terminé

```txt
créateur importe README.md ou un dossier de fichiers .md
→ backend refuse toute autre nature de fichier
→ ressources validées persistées sous skill
→ liste UI reflète fichiers importés
```
