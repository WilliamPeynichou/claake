# Plan — Tests e2e MVP

> **Statut : ✅ Réalisé et livré.** Voir
> `docs/suivi_roadmap/comptes-rendus/2026-07-08-tests-e2e-mvp.md`.

Date : 2026-07-08
Branche : `feature/e2e-mvp-flow`
Réf : `docs/roadmap-claake-agents-chat.md` — tests e2e MVP

## Objectif

Ajouter couverture automatisée du parcours MVP :

```txt
création agent draft
→ test draft créateur
→ soumission review
→ test admin pending
→ approbation
→ chat public
```

## État de départ

- Pas d'infra Playwright/Cypress dans le repo.
- Infra e2e backend existante : Jest + `backend/test/jest-e2e.json`.
- Test e2e initial `backend/test/app.e2e-spec.ts` obsolète pour le produit.
- Use cases backend déjà structurés : création, validation, review, chat session, send message.

## Choix technique

Créer un e2e applicatif backend, sans DB réelle :

- repositories in-memory ;
- use cases réels ;
- provider IA mocké ;
- quota mocké ;
- assertions sur transitions de statut et accès chat.

But : verrouiller le flux métier MVP sans dépendre de credentials Supabase/Postgres.

## Checklist

- [x] Créer branche `feature/e2e-mvp-flow`.
- [x] Ajouter `backend/test/mvp-flow.e2e-spec.ts`.
- [x] Aligner `backend/test/jest-e2e.json` avec resolver `.js` → TS.
- [x] Tester blocage chat public sur agent draft.
- [x] Tester chat draft créateur en mode test.
- [x] Tester soumission `DRAFT → PENDING`.
- [x] Tester chat admin sur agent pending.
- [x] Tester review `PENDING → APPROVED`.
- [x] Tester chat public après approbation.
- [x] Lancer e2e ciblé, Biome, build backend.

## Critère terminé

```txt
e2e backend MVP vert
→ flux create/test/submit/review/approve/public-chat couvert
```

## Hors périmètre

- E2E UI navigateur Playwright.
- DB Postgres réelle.
- Auth Supabase réelle.
- Streaming provider réel.
