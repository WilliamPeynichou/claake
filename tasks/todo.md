# Phase B — Open redirect et rate limiting ciblé

Branche : `fix/phase-b-open-redirect-rate-limit`

## Plan

- [x] Ajouter tests unitaires exhaustifs à `safeRedirectPath` (open redirect encodé inclus).
- [x] Auditer les quotas ciblés déjà présents (chat, coûts IA, upload, paiement, agents, clés API).
- [x] Fermer les routes sensibles non limitées : webhook, onboarding Stripe, suppression clé API.
- [x] Centraliser les profils de throttling pour éviter les valeurs divergentes.
- [x] Vérifier lint, tests backend, tsc/build web.

## Review

- Open redirect : implémentation existante déjà sûre (origine locale + allowlist stricte des chemins) ;
  5 tests couvrent URL absolue, `//`, encodage `%2f/%5c`, slash inverse, chemin hors allowlist.
- Profils sensibles centralisés dans `RATE_LIMITS` : chat (10/min), upload (20/min), checkout
  (10/min), webhook Stripe (120/min), onboarding Stripe et mutations de clés API (5/min).
- Trous fermés : webhook n'est plus `SkipThrottle`, onboarding et suppression de clé désormais limités.
- Défense en profondeur existante confirmée : `ChatQuotaService` persistant par utilisateur
  (20/min, 300/jour, prompt 12k), quotas MCP/tool-calls par message, agents/import/reindex déjà limités.
- 7 tests de métadonnées garantissent que les routes sensibles conservent leur profil.
- Vérifié : 46 suites / 290 tests backend, 5 tests safe redirect, lint vert, builds API/web verts.
