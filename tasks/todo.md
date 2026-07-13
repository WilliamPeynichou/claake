# Phase A (roadmap ouverture publique) — Lint strict et bloquant

Branche : `feat/phase-a-lint-bloquant`

## Plan

- [x] 1. Overrides Biome : autoriser `any`/non-null dans fichiers de test uniquement.
- [x] 2. Corriger warnings auto-fixables (imports/variables inutilisés, useTemplate).
- [x] 3. Corriger `noExplicitAny` backend (~50, typage req/Prisma JSON).
- [x] 4. Corriger `noNonNullAssertion` backend (~20).
- [x] 5. Corriger warnings frontend (noImgElement, any, unused).
- [x] 6. Rendre lint bloquant : `--error-on-warnings` dans script racine (CI l'utilise déjà).
- [x] 7. Vérifier : lint 0 warning, tests backend, builds.

## Review

- 164 warnings + 2 infos Biome → 0 diagnostic sur 447 fichiers.
- `biome.json` : overrides tests (`*.spec/*.test/test/e2e`) désactivant `noExplicitAny` et
  `noNonNullAssertion` — légitime pour doubles de test ; règles inchangées sur le code source.
- Backend : contrôleurs typés `AuthenticatedRequest`, JSON Prisma via types générés,
  providers SSE typés (`AnthropicStreamEvent`/`OpenAiStreamEvent`), Stripe
  `StripeCheckoutSessionData` typé (port + service + webhook), non-null remplacés par gardes
  explicites (`public-url.ts`, `aes-encryption`, `endpoint-proxy`).
- `npm run lint` = `biome check --error-on-warnings .` → tout warning casse la CI (step Lint existant).
- Vérifié : lint 0 warning ; `tsc --noEmit` backend src propre (6 erreurs specs préexistantes,
  identiques sur main) ; 277 tests backend passent ; `web-build` + `api-build` OK ; tsc web propre.
