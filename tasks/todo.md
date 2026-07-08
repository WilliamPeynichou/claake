# Plan — Tests e2e MVP

Date : 2026-07-08
Branche : `feature/e2e-mvp-flow`
Réf : `docs/roadmap-claake-agents-chat.md` — priorité e2e MVP

## Objectif

Couvrir parcours MVP critique :

```txt
création agent draft
→ test draft créateur
→ soumission review
→ test admin pending
→ approbation
→ chat public
```

## Contraintes

- Playwright absent. Utiliser infra e2e existante backend Jest.
- Pas DB réelle : repos in-memory, use cases réels.
- Backend reste source vérité : status, review, chat access, send message.
- Pas UI e2e complet tant qu'infra Playwright pas installée.

## Plan

- [x] Vérifier branche/état git.
- [x] Explorer infra e2e existante.
- [x] Créer branche `feature/e2e-mvp-flow`.
- [x] Ajouter `backend/test/mvp-flow.e2e-spec.ts`.
- [x] Lancer e2e ciblé.
- [x] Corriger erreurs si besoin.
- [x] Documenter dans `docs/suivi_roadmap/`.

## Review

- Branche créée : `feature/e2e-mvp-flow`.
- Nouveau test : `backend/test/mvp-flow.e2e-spec.ts`.
- `backend/test/jest-e2e.json` aligné avec le mapper `.js` → TS déjà utilisé par les tests unitaires.
- Test e2e couvre :
  - création agent `draft` ;
  - blocage chat public sur draft ;
  - test draft par créateur ;
  - soumission `DRAFT → PENDING` ;
  - test admin sur pending ;
  - approbation `PENDING → APPROVED` ;
  - `AgentChatConfig` public `can_chat` ;
  - session + message chat public.
- Choix : use cases réels + repositories in-memory + provider/quota mocks. Pas DB/Supabase.
- Docs ajoutées :
  - `docs/suivi_roadmap/plans/2026-07-08-tests-e2e-mvp.md` ;
  - `docs/suivi_roadmap/comptes-rendus/2026-07-08-tests-e2e-mvp.md`.

## Vérifications

- `npm -w @claake/backend run test:e2e -- mvp-flow.e2e-spec.ts` OK : 1 suite, 1 test.
- `npx biome check backend/test/mvp-flow.e2e-spec.ts backend/test/jest-e2e.json tasks/todo.md` OK sur fichiers traités ; `tasks/todo.md` ignoré par config Biome.
- `npm run api-build` OK.
