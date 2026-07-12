# Compte rendu — M11 Skills : ressources Markdown

Date : 2026-07-11
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 11
Plan : `docs/suivi_roadmap/plans/2026-07-11-m11-skills-markdown-resources.md`

## Livré

Un créateur peut désormais créer un skill pour un agent et importer ses ressources depuis :

- un ou plusieurs fichiers Markdown ;
- un dossier local, transmis par le navigateur comme lot de fichiers.

Les ressources sont persistées dans `agent_skills` et `agent_skill_resources`, liées à l'agent et
supprimées en cascade avec leur skill ou l'agent.

## Validation Markdown stricte

Le backend est autorité et refuse, avant écriture :

- extension différente de `.md` ;
- MIME différent de `text/markdown` ou `text/plain` (ou absent, comportement de certains navigateurs) ;
- fichier vide, > 1 Mo ou lot > 100 fichiers ;
- contenu non UTF-8 ou contenant un octet NUL ;
- chemin absolu, segment vide, `.` ou `..` ;
- chemins relatifs en doublon dans un même import.

`application/octet-stream`, PDF, Office, image, archive et binaire renommé `.md` sont refusés.
Le chemin relatif du dossier est conservé après validation ; aucune archive ni accès au système de
fichiers serveur n'est utilisé.

## API et interface

- `GET /agents/:id/skills` : liste owner/admin, contenu des ressources inclus.
- `POST /agents/:id/skills` : création vide d'un skill lié à l'agent.
- `POST /agents/:id/skills/import` : multipart `files`, création atomique d'un skill lié à l'agent avec ses ressources.
- `DELETE /agents/:id/skills/:skillId` : suppression owner/admin.
- `shared/types/skills.ts` et `apiClient.agents.skills`.
- `SkillManager` dans page d'édition agent : sélection fichiers `.md` ou dossier, import, liste et suppression.

## Vérifications

- Prisma generate : OK.
- Tests ciblés `AgentSkillService` : 7/7 OK, dont lot dossier, extension, MIME, UTF-8, traversal, doublon et ownership.
- Build backend : OK.
- Biome ciblé + `git diff --check` : OK.
- Web : compilation et typecheck OK. Collecte finale des pages bloquée par `NEXT_PUBLIC_SUPABASE_URL` absente de l'environnement local, hors M11.

## Suite V2

- Injection contextuelle par déclencheurs puis embeddings M9.
- Bibliothèque et partage de skills entre agents (remplacer le lien direct actuel par une relation n-n).
- Marketplace skills et workflow DRAFT/PENDING/APPROVED/review admin.
- Validation des dépendances tools M8 et MCP M10.
