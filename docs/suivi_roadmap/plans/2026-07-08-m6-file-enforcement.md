# Plan — Milestone 6 : Fichiers et connaissance

> **Statut lot F5.2 : ✅ Réalisé et livré.** Voir `docs/suivi_roadmap/comptes-rendus/2026-07-08-m6-file-enforcement.md`.

Date : 2026-07-08
Branche : `feature/m6-file-enforcement`
Réf : `docs/roadmap-claake-agents-chat.md` — Phase 5 / Milestone 6.
Réf archi : `docs/architecture/analyse-technique-architecture-claake.md`.

## Objectif M6

Permettre aux agents de travailler sur des documents, sans casser le noyau ni la sécurité
uploads déjà en place.

Sous-étapes (par priorité) :

```txt
F5.2 enforcement upload par agent (capabilities)   ← ce lot
F5.1 upload fichier utilisateur dans le chat        (déjà partiel)
F5.3 base de connaissances agent + recherche        (plus tard)
```

## Ce lot — F5.2 : enforcement par agent

Aujourd'hui `UploadService.upload` valide MIME/taille/contenu globalement
(`upload-file.validator.ts`), mais **n'applique pas** les `capabilities` de l'agent.
Un agent qui déclare `images:false` accepte quand même une image en chat.

### Règle cible (backend = source de vérité)

Quand l'upload cible une **session de chat** (`opts.sessionId`) :

- résoudre l'agent via `session.agentId` ;
- `capabilities = { files: boolean, images: boolean }` (défaut `false`) ;
- fichier `IMAGE` refusé si `images !== true` ;
- fichier `DOCUMENT` (PDF) refusé si `files !== true` ;
- erreur actionnable FR (`BadRequestException`).

Les uploads d'**auteur** (`opts.agentId` seul, créateur qui attache des docs à son agent)
ne sont pas restreints par capabilities : ils relèvent de la future base de connaissances.

### Frontend

Le chat masque déjà l'upload via `AgentChatConfig.capabilities` (web + desktop). Ce lot
ajoute la garde backend correspondante (défense en profondeur). Aucun changement UI requis.

## Implémentation

- `backend/.../uploads/application/upload.service.ts` :
  - après `validateUploadFile`, si `opts.sessionId`, charger `agent.capabilities` et appeler
    un helper `assertAgentAcceptsFile(type, capabilities)`.
- Helper `agent-capabilities.ts` (normalisation `{files, images}`) partagé entre
  `GetAgentChatConfigUseCase` et l'upload, pour une seule source de vérité.
- Erreurs : « Cet agent n'accepte pas les images. » / « Cet agent n'accepte pas les fichiers. »

## Tests

`upload.service.spec.ts` :

- image refusée si `images:false` ;
- PDF refusé si `files:false` ;
- image acceptée si `images:true` ;
- upload auteur (agentId seul) non restreint ;
- capabilities nulles = tout refusé en chat.

## Critère terminé

```txt
upload chat vérifie les capabilities de l'agent avant stockage
→ helper capabilities partagé (une source de vérité)
→ erreurs actionnables FR
→ tests backend verts + api-build
→ merge --no-ff dans main + push + suppression branche
```

## Hors périmètre (M6 suite)

- Base de connaissances agent (F5.3) : ingestion docs + recherche contextuelle.
- Types de fichiers additionnels (texte/code) au-delà de image/PDF.
- Quotas nombre de fichiers (Phase 6).
