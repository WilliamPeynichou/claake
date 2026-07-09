# Compte-rendu — Milestone 7 Beta publique contrôlée

Date : 2026-07-09
Réf : `docs/roadmap-claake-agents-chat.md` — M7

## Résultat

Milestone 7 terminé côté socle technique beta :

```txt
CI PR
→ e2e UI smoke Playwright
→ observabilité chat/provider
→ vérifications backend/web/desktop
```

## Changements livrés

### CI

- Ajout `.github/workflows/ci.yml`.
- Fusion des gates qualité et sécurité :
  - `npm ci` ;
  - `prisma:generate` ;
  - `npm run lint` ;
  - tests unitaires backend ;
  - e2e backend ;
  - build API ;
  - build web avec env placeholders HTTPS ;
  - install Chromium Playwright ;
  - e2e web smoke ;
  - build desktop ;
  - scan secrets ;
  - audit npm high/critical.
- Suppression ancien workflow `.github/workflows/security.yml`, devenu doublon.

### e2e UI Playwright

- Ajout `@playwright/test` dans `@claake/frontend-web`.
- Ajout `frontendWeb/playwright.config.ts`.
- Ajout `frontendWeb/e2e/public-smoke.spec.ts` :
  - landing expose liens `/chat` et `/catalogue` ;
  - catalogue charge heading + searchbox sans credentials ;
  - `/chat` affiche/dirige état non authentifié sans credentials.
- Ajout scripts :
  - `npm -w @claake/frontend-web run test:e2e` ;
  - `npm run web-e2e`.

### Observabilité beta

- Ajout `ChatObservabilityService` côté backend.
- Intégration dans `SendMessageUseCase` :
  - `chat.message.started` ;
  - `chat.provider.success` ;
  - `chat.provider.error` ;
  - `chat.message.completed`.
- Métriques loggées :
  - `sessionId` ;
  - `agentId` ;
  - `userId` hashé ;
  - provider ;
  - model ;
  - durée ;
  - taille input/output ;
  - nombre fichiers ;
  - erreur provider redigée.
- Architecture respectée : backend source de vérité, observabilité dans application service, aucune logique métier ajoutée au web.

### Tests

- Tests unitaires `SendMessageUseCase` étendus :
  - succès provider observé ;
  - erreur provider observée ;
  - sauvegarde assistant observée.
- e2e backend MVP mis à jour avec knowledge/observability mocks.

## Vérifications

- `npx biome check ...` ciblé M7 : OK.
- `npm -w @claake/backend run test -- send-message.usecase.spec.ts --runInBand` : OK, 21 tests.
- `npm -w @claake/backend run test -- --runInBand` : OK, 32 suites, 201 tests.
- `npm -w @claake/backend run test:e2e -- --runInBand` : OK, 1 suite, 1 test.
- `npm run api-build` : OK.
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build` : OK.
- `VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=ci-placeholder VITE_API_URL=http://localhost:3001 npm run desktop-build` : OK, warning chunk >500 kB déjà connu.
- `npm run web-e2e` : OK, 3 tests Playwright.

## Limites connues

- `npm run lint` local échoue à cause de `ClaakePresentation/`, dossier non suivi et hors scope roadmap. En CI checkout propre, ce dossier n'existe pas.
- e2e UI reste smoke public sans Supabase live. Parcours auth complet reste à brancher quand env test Supabase dédié disponible.
- Observabilité = logs structurés beta, pas encore dashboard métriques/OTel/Prometheus.
- Desktop build garde dette chunk Vite >500 kB.

## État M7

M7 passe de `~60%` à `100% fonctionnel beta technique`.

Reste avant ouverture réelle : créer env staging/Supabase test et inviter premiers développeurs, mais socle CI/e2e/observabilité demandé est livré.
