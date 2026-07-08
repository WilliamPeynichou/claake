# Plan de correction — Tests e2e MVP backend

> **Statut : ✅ Appliqué.** `app.e2e-spec.ts` supprimé, `test:e2e` vert (1 suite).

Date : 2026-07-08
Réf : `docs/suivi_roadmap/plans/2026-07-08-tests-e2e-mvp.md`

## Constat de vérification

- `backend/test/jest-e2e.json` : `moduleNameMapper` (`^(\.\.?/.*)\.js$` → `$1`) fonctionne —
  les usecases src importés avec suffixe `.js` (ESM) sont résolus par ts-jest.
- `backend/test/mvp-flow.e2e-spec.ts` : **PASS** — parcours complet
  draft → test créateur → submit → review/test admin → approve → chat public.
- Docs conformes : plan marqué ✅, compte-rendu présent, README index et roadmap à jour.

## Erreur constatée

`npm --workspace backend run test:e2e` échoue globalement :

```txt
Test Suites: 1 failed, 1 passed, 2 total
FAIL test/app.e2e-spec.ts
```

Cause : `test/app.e2e-spec.ts` est le boilerplate Nest d'origine. Il boote `AppModule`
complet → `validateEnv` (`src/app.module.ts:36`) rejette car `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ENCRYPTION_KEY` sont vides en local.
Le test vérifie `GET / → "Hello World!"`, contrat qui n'existe plus.

## Correction

### Lot 1 — Supprimer le boilerplate obsolète (bloquant)

- [ ] Supprimer `backend/test/app.e2e-spec.ts` :
  - teste un endpoint obsolète (`Hello World!`) ;
  - requiert env réel complet, contraire à l'approche in-memory de `mvp-flow` ;
  - le vrai boot applicatif sera couvert par un smoke test dédié quand `backend/.env`
    aura des credentials (dette déjà tracée).
- [ ] Relancer `npm --workspace backend run test:e2e` → attendu : 1 suite, tout vert.

### Lot 2 — Traçabilité (bloquant)

- [ ] Commit : `test(e2e): remove obsolete Nest boilerplate app.e2e-spec`.
- [ ] Mentionner la suppression dans le compte-rendu
  `docs/suivi_roadmap/comptes-rendus/2026-07-08-tests-e2e-mvp.md` (section vérifications).

### Lot 3 — Dette (non bloquant)

- [ ] Smoke test e2e HTTP réel (boot AppModule + supertest) quand credentials disponibles.
- [ ] Brancher `test:e2e` en CI (déjà dans le reste à faire Milestone 7).

## Critère terminé

```txt
npm --workspace backend run test:e2e → vert
→ suppression commitée et documentée
→ dette smoke test réel + CI tracée
```
