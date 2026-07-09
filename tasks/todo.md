# Plan — Milestone 7 Beta publique contrôlée

Date : 2026-07-09
Branche : `main` locale
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 7

## Objectif

Finir la consolidation beta avant Phase 8 :

```txt
CI PR
→ e2e UI Playwright MVP
→ observabilité beta minimale
→ vérifications documentées
```

## Contraintes architecture

- Respecter `docs/architecture/analyse-technique-architecture-claake.md`.
- Garder le backend source de vérité métier.
- Ne pas déplacer logique métier dans Next.js.
- Observabilité backend via service dédié, sans polluer les use cases avec formatage de logs.
- UI e2e limitée à smoke/parcours non destructifs tant que Supabase/env test live absents.

## Plan

- [x] Relire architecture et suivi roadmap.
- [x] Auditer scripts, CI, tests, points logs/observabilité.
- [x] Ajouter workflow CI PR : install, lint, tests backend, e2e backend, builds web/api/desktop, sécurité.
- [x] Ajouter Playwright web minimal : configuration + smoke catalogue/chat sans credentials.
- [x] Ajouter observabilité beta backend : métriques chat/provider latence/succès/erreur via service application dédié.
- [x] Ajouter tests unitaires observabilité.
- [x] Lancer vérifications ciblées.
- [x] Documenter plan et compte-rendu dans `docs/suivi_roadmap/`.

## Review

- CI ajoutée : `.github/workflows/ci.yml`.
- Ancien workflow sécurité supprimé car intégré au nouveau CI.
- Playwright ajouté côté web : `frontendWeb/playwright.config.ts` + `frontendWeb/e2e/public-smoke.spec.ts`.
- Scripts ajoutés : `npm run web-e2e`, `npm -w @claake/frontend-web run test:e2e`.
- Observabilité ajoutée : `ChatObservabilityService` + intégration `SendMessageUseCase`.
- Événements observés : `chat.message.started`, `chat.provider.success`, `chat.provider.error`, `chat.message.completed`.
- Données sensibles évitées : `userId` hashé, pas de clés API, pas de contenu prompt/réponse dans logs.
- Docs ajoutées/mises à jour :
  - `docs/suivi_roadmap/plans/2026-07-09-finir-milestone-7.md` ;
  - `docs/suivi_roadmap/comptes-rendus/2026-07-09-finition-milestone-7.md` ;
  - `docs/suivi_roadmap/README.md` ;
  - `docs/roadmap-claake-agents-chat.md`.

## Vérifications

- `npx biome check ...` ciblé M7 : OK.
- `npm -w @claake/backend run test -- send-message.usecase.spec.ts --runInBand` : OK, 21 tests.
- `npm -w @claake/backend run test -- --runInBand` : OK, 32 suites, 201 tests.
- `npm -w @claake/backend run test:e2e -- --runInBand` : OK, 1 suite, 1 test.
- `npm run api-build` : OK.
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build` : OK.
- `VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=ci-placeholder VITE_API_URL=http://localhost:3001 npm run desktop-build` : OK, warning chunk Vite >500 kB connu.
- `npm run web-e2e` : OK, 3 tests.
- `npm run lint` local : KO uniquement à cause de `ClaakePresentation/` non suivi/hors scope. CI checkout propre non concerné.
