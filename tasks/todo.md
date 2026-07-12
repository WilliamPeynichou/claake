# Milestone 11 — Ressources Skills importables

## Plan

- [x] 1. Ajouter les modèles Prisma `AgentSkill` et `AgentSkillResource`, avec migration.
- [x] 2. Créer le service backend : autorisation, CRUD skills, import Markdown strict et import batch de dossiers.
- [x] 3. Exposer les routes authentifiées agent skills et les enregistrer dans le module.
- [x] 4. Ajouter les tests unitaires de validation et d’import.
- [x] 5. Générer Prisma et vérifier tests, format et build backend.

## Review

- Modèles Prisma et migration `0018_add_agent_skills` : skills rattachés à un agent et ressources Markdown en cascade.
- API authentifiée : `GET/POST /agents/:id/skills`, `POST /agents/:id/skills/import` (`files` multipart) et `DELETE /agents/:id/skills/:skillId`.
- Import atomique de 1 à 100 fichiers/dossiers, `.md` exclusivement, MIME texte/Markdown, UTF-8, chemin relatif sûr, contenu non vide et 1 Mo maximum par ressource.
- Vérifications : `prisma generate`, 7 tests unitaires, Biome ciblé et build backend OK.
