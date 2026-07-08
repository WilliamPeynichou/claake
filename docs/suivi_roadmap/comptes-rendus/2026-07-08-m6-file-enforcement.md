# Compte-rendu — M6 : enforcement upload par agent (F5.2)

Date : 2026-07-08
Branche : `feature/m6-file-enforcement`
Réf plan : `docs/suivi_roadmap/plans/2026-07-08-m6-file-enforcement.md`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 6 / Feature 5.2

## Résumé

Démarrage du Milestone 6. Les uploads en contexte chat respectent désormais les
`capabilities` de l'agent côté backend (défense en profondeur : le front masque déjà
l'upload via `AgentChatConfig.capabilities`).

## Règle

Upload ciblant une session (`opts.sessionId`) :

- `IMAGE` refusé si `capabilities.images !== true` → « Cet agent n'accepte pas les images. »
- `DOCUMENT` (PDF) refusé si `capabilities.files !== true` → « Cet agent n'accepte pas les fichiers. »
- capabilities absentes = tout refusé en chat.
- Uploads auteur (`agentId` seul, créateur) non restreints (relèvent de la future KB).

## Fichiers

- `backend/.../agents/domain/agent-capabilities.ts` (nouveau) — `normalizeAgentCapabilities`,
  source de vérité unique `{files, images}`.
- `backend/.../agents/application/usecases/get-agent-chat-config.usecase.ts` — réutilise le
  helper (fin de la duplication).
- `backend/.../uploads/application/upload.service.ts` — garde `assertAgentAcceptsFile`
  après validation MIME/taille, avant stockage.
- `backend/.../uploads/application/upload.service.spec.ts` — 5 tests capabilities.

## Vérifications

- `npm -w @claake/backend run test` : **190/190 OK** (31 suites, +5).
- `npm -w @claake/backend run build` (nest build) : OK.
- Biome sur le périmètre : OK.

## Livraison Git

- Commit `feat(uploads): enforce agent capabilities on chat file uploads (M6/F5.2)`.
- Merge `--no-ff` → `main`, push, branche supprimée.

## Suite M6

- F5.1 : finir l'upload fichier utilisateur dans le chat (déjà partiel).
- F5.3 : base de connaissances agent (ingestion docs + recherche contextuelle).
- Types additionnels (texte/code) au-delà d'image/PDF.
- Test live bloqué tant que `backend/.env` vide.
