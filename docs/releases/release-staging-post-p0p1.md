# Release candidate staging post-corrections P0/P1

## Décision courte

**GO pour une release candidate staging contrôlée**, avec secrets dédiés staging, données non réelles et checklist de déploiement stricte.

**Pas encore GO pour une production publique large.**

## Fait

- Audit technique et sécurité complet produit.
- Corrections P0/P1 appliquées sur backend, auth/rôles, proxy/SSRF, IA, uploads, Stripe, configuration, secrets et frontend auth redirects.
- Tests backend complets verts selon validation agents : 27 suites / 148 tests.
- Build backend vert.
- Scan secrets vert.
- Audit high/critical vert.
- Migration Prisma Stripe idempotence ajoutée.
- Snippets Supabase Storage ajoutés.
- Documentation d’audit rangée dans `docs/audit-technique-securite/`.

## À faire maintenant

1. Appliquer migration Prisma staging.
2. Créer/vérifier bucket privé `agent-files-private`.
3. Appliquer policies Supabase Storage.
4. Configurer variables staging réelles.
5. Configurer webhook Stripe test.
6. Nettoyer `.next` et valider build web CI/staging reproductible.
7. Corriger/exclure `ClaakePresentation/**` du lint release.
8. Lancer smoke test staging complet.

## Risques résiduels à décider

- SSRF sans allowlist domaines ou agent HTTP custom.
- Pas d’AV/CDR réel pour les uploads.
- `.agentjson` publics à assumer ou migrer.
- Remboursements/chargebacks/subscriptions Stripe non couverts.
- Vulnérabilités modérées Expo/mobile.
- Absence d’E2E complète.
