# Plan de correction — Milestone 4 (Desktop chat)

Date : 2026-07-06
Branche : `feature/milestone-4-desktop-chat`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 4
Réf architecture : `docs/architecture/desktop-architecture.md`

## Constat de vérification

Le code du Milestone 4 est fonctionnel et vérifié :

- `frontendApp` réutilise `@claake/shared` (`useChat`, `apiClient`, `AgentChatConfig`) sans
  dupliquer de logique métier ; les états d'accès sont affichés tels que renvoyés par l'API.
- Parcours couvert : auth → liste agents → chat-config → sessions → streaming → retry →
  panneau clés API → déconnexion.
- `npm -w @claake/frontend-app run build` OK (`tsc -b` inclus), Biome clean sur les fichiers
  modifiés, aucune modification backend.

Les corrections portent sur la **finition process et documentation**, pas sur le code.

## Corrections à effectuer

### Lot 1 — Traçabilité git (bloquant)

- [ ] Commiter le travail desktop sur `feature/milestone-4-desktop-chat` :
  - `frontendApp/src/pages/chat.tsx`
  - `frontendApp/src/components/chat-input-da.tsx`
  - `frontendApp/src/components/chat-sidebar.tsx`
  - `frontendApp/src/components/chat-thread.tsx`
  - `tasks/todo.md`
  - message : `feat(desktop): finish milestone 4 chat-only desktop experience`
- [ ] Exclure le bruit non lié (`.claakecode/`, `.codex/`, `AGENTS.md`, `ClaakePresentation/`,
  sous-module `skills`).

### Lot 2 — Documentation suivi roadmap (bloquant)

- [ ] Créer `docs/suivi_roadmap/plans/2026-07-06-finir-milestone-4.md` à partir du plan
  actuellement dans `tasks/todo.md` (objectif, contraintes, checklist, critère terminé).
- [ ] Créer `docs/suivi_roadmap/comptes-rendus/2026-07-06-finition-milestone-4.md` :
  travail réalisé, fichiers modifiés, vérifications (build, Biome), état roadmap, dette.
- [ ] Mettre à jour `docs/suivi_roadmap/README.md` (liste plans/comptes-rendus).

### Lot 3 — Roadmap (bloquant)

- [ ] `docs/roadmap-claake-agents-chat.md` :
  - Milestone 4 : `~10%` → `100% fonctionnel V1 chat-only`.
  - Noter la dette : test live Tauri non effectué, code-split chunk >500 kB,
    auth desktop à durcir si flow Supabase complet requis.
  - Mettre à jour la section « prochaine priorité » si elle pointe encore vers M4.

### Lot 4 — Merge et nettoyage (bloquant)

- [ ] Merger `--no-ff` dans `main` :
  `merge: feature/milestone-4-desktop-chat → main (milestone 4)`.
- [ ] Push `main`, supprimer la branche locale et distante.

### Lot 5 — Dette technique (non bloquant, à planifier)

- [ ] Test live de l'app Tauri (`npm run desktop`) dès qu'un environnement avec
  credentials Supabase est disponible (`backend/.env` actuellement vide).
- [ ] Réduire le chunk vite >500 kB (dynamic import / `manualChunks`).
- [ ] E2E parcours complet : création → soumission → validation admin → chat public web +
  desktop (déjà en dette M3).

## Critère terminé

```txt
travail M4 commité sur feature/milestone-4-desktop-chat
→ plan + compte-rendu dans docs/suivi_roadmap/
→ roadmap M4 à jour avec dette
→ merge --no-ff dans main + push
→ branche supprimée
```

## Hors périmètre

- Toute évolution fonctionnelle desktop (offline, notifications, auto-update).
- Extraction de composants UI partagés web/desktop (prématurée pour V1).
