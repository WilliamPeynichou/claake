# Compte-rendu — Tests e2e MVP

Date : 2026-07-08
Branche : `feature/e2e-mvp-flow`
Réf plan : `docs/suivi_roadmap/plans/2026-07-08-tests-e2e-mvp.md`

## 1. Résumé

Couverture e2e MVP ajoutée côté backend avec Jest. Le test couvre le flux métier complet :

```txt
create draft
→ creator tests draft
→ submit for review
→ admin tests pending
→ approve
→ public chat
```

Aucune DB réelle requise. Le test utilise repositories in-memory et use cases réels.

## 2. Fichiers modifiés

- `backend/test/mvp-flow.e2e-spec.ts` — nouveau test e2e MVP.
- `backend/test/jest-e2e.json` — ajout `moduleNameMapper` pour imports `.js` utilisés par TS.
- `tasks/todo.md` — plan + review de tâche.

## 3. Couverture métier

Le test vérifie :

1. création agent retourne un agent `draft` ;
2. chat public normal bloque agent `DRAFT` ;
3. créateur peut tester agent `DRAFT` en `testMode` ;
4. soumission passe agent en `PENDING` ;
5. admin peut tester agent `PENDING` en `testMode` ;
6. review admin approuve agent ;
7. `AgentChatConfig` public autorise le chat après approbation ;
8. utilisateur public peut créer session et envoyer message.

## 4. Architecture respectée

Le test traverse les use cases backend existants :

- `CreateAgentUseCase`
- `SubmitAgentForReviewUseCase`
- `ValidateAgentUseCase`
- `ReviewAgentUseCase`
- `GetAgentChatConfigUseCase`
- `CreateSessionUseCase`
- `SendMessageUseCase`

Le frontend ne décide rien. Règles métier restent backend.

## 5. Vérifications

E2E ciblé :

```txt
npm -w @claake/backend run test:e2e -- mvp-flow.e2e-spec.ts
```

Résultat :

```txt
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

Suite complète `test:e2e` (après suppression du boilerplate obsolète) :

```txt
npm --workspace backend run test:e2e
```

Résultat : **1 suite, 1 test, tout vert**. Le boilerplate Nest
`backend/test/app.e2e-spec.ts` (endpoint obsolète `Hello World!`, boot `AppModule`
nécessitant les credentials Supabase/`ENCRYPTION_KEY`) a été **supprimé** : il faisait
échouer `test:e2e` en local et allait à l'encontre de l'approche in-memory de `mvp-flow`.
Un smoke test HTTP réel (boot + supertest) reste en dette (§7).

Biome ciblé :

```txt
npx biome check backend/test/mvp-flow.e2e-spec.ts backend/test/jest-e2e.json tasks/todo.md
```

Résultat : OK sur fichiers traités (`tasks/todo.md` ignoré par config Biome).

Build backend :

```txt
npm run api-build
```

Résultat : OK.

## 6. Limites

- Ce n'est pas un e2e navigateur. Playwright reste à ajouter pour vraie UI : création web,
  clic tester, soumission, admin review, chat public.
- Auth Supabase réelle non testée.
- Provider IA réel non appelé.

## 7. Suite recommandée

- Ajouter Playwright quand credentials/env test disponibles.
- Ajouter un seed e2e minimal Postgres/Supabase ou une stratégie testcontainers.
- Étendre e2e au cas clé API manquante → ajout clé → retour chat.
