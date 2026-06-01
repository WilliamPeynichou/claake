# Audit technique et sécurité — corrections P0/P1 et release candidate

## Résumé

Ce dossier regroupe les livrables d’audit, les corrections réalisées et l’état de préparation release/staging après le traitement des risques P0/P1.

Décision actuelle : **GO pour une release candidate staging contrôlée, sous conditions obligatoires de déploiement**.

Le projet n’est **pas encore recommandé pour une production publique large** tant que les vérifications staging réelles, les migrations/policies Supabase, Stripe test mode et les risques résiduels ne sont pas formellement traités ou acceptés.

## Documents disponibles

- `00-synthese-executive-et-decision-production.md` : synthèse initiale de l’audit et décision production.
- `01-cartographie-surfaces-attaque.md` : cartographie architecture, flux critiques et surfaces d’attaque.
- `02-backend-securite-auth-roles-agents-proxy-ia.md` : audit backend/auth/rôles/agents/proxy/IA.
- `03-base-secrets-uploads-paiements-dependances.md` : audit base de données, secrets, uploads, paiements et dépendances.
- `04-interfaces-tests-decision-production.md` : audit interfaces, tests et décision production.
- `audit-interfaces-tests-production.md` : copie de travail détaillée côté interfaces/tests.
- `README.md` : présent document de synthèse post-corrections.

## Ce qui a été fait

### Backend, authentification et rôles

- Création locale des nouveaux utilisateurs forcée au rôle `USER`.
- Suppression de l’élévation possible via `app_metadata.role` Supabase au premier login.
- Rôle en base considéré comme source de vérité.
- Tests de non-régression ajoutés sur `SupabaseAuthGuard` et `OptionalSupabaseAuthGuard`.

### Proxy externe, SSRF et IA

- Ajout d’un validateur partagé d’URL publique.
- Blocage des URLs avec credentials, protocoles non HTTP(S), IP privées/réservées/link-local/multicast/loopback, IPv4 et IPv6.
- Résolution DNS effective avant appel aux endpoints vendeurs/config URLs.
- Redirections bloquées avec `redirect: "error"`.
- Timeouts et limite de stream ajoutés aux providers IA.
- Erreurs fournisseurs/proxy rendues génériques côté client.

### Validations, limites et rate limiting

- DTO agents/chat renforcés : tailles maximales, bornes numériques, limites de tableaux et pièces jointes.
- Throttles dédiés ajoutés pour création de session, message IA, création/update agent, ajout clé API, uploads et checkout.

### Uploads et stockage

- Uploads runtime déplacés vers un bucket privé `agent-files-private`.
- Remplacement des URLs publiques durables par des chemins internes et URLs signées courtes.
- Validation fichiers renforcée : magic bytes, cohérence MIME/extension, limite 10 Mo, rejet basique de PDF actifs.
- Contrôles ownership renforcés entre utilisateur, agent, session et message.
- Suppression des fuites d’erreurs Supabase brutes côté client.

### Paiements et Stripe

- Checkout refusé pour les agents non publiés.
- Webhook Stripe renforcé : signature, `payment_status=paid`, metadata user/agent, agent publié/payant, montant serveur, devise EUR.
- Idempotence ajoutée via table `stripe_webhook_events`.
- Unicité de `stripePaymentId` ajoutée.
- Migration Prisma ajoutée : `0006_stripe_webhook_idempotency`.

### Configuration, secrets et dépendances

- Validation environnement production renforcée.
- `ENCRYPTION_KEY` exigée au format hex 64 caractères.
- Stripe et `WEB_URL` requis en production.
- Placeholders refusés.
- CORS production limité à `WEB_URL`.
- Headers Helmet/Next renforcés.
- Fallbacks localhost supprimés en production côté web/desktop/mobile.
- Exemples `.env` complétés et secrets locaux assainis.
- Scanner de secrets ajouté : `scripts/scan-secrets.mjs`.
- Workflow CI sécurité ajouté.
- Scripts ajoutés : `secrets:scan`, `audit:high`, `security:check`.
- Correctifs compatibles appliqués pour `qs` et `ws`.

### Frontend et redirections

- Ajout de `safeRedirectPath`.
- Redirections login/callback limitées à une allowlist interne : `/dashboard`, `/chat`, `/checkout`, `/admin`.
- Blocage des URLs externes, `//`, backslashes, encodages ambigus et chemins hors allowlist.

## Vérifications effectuées

Les agents ont rapporté les validations suivantes :

- Backend tests : **27 suites / 148 tests PASS**.
- Backend build : **PASS**.
- Tests ciblés uploads + Stripe : **2 suites / 10 tests PASS**.
- Tests ciblés P0/P1 backend : **PASS**.
- `secrets:scan` : **PASS**.
- `audit:high` : **PASS**, 0 vulnérabilité high/critical.
- `prisma validate` : **PASS** avec URL factice.
- Build frontend web : **PASS après build propre avec variables requises**, mais un agent a observé un échec local `.next/pages-manifest.json` à reproduire/nettoyer.
- Build desktop frontend : **PASS**.

## Ce qui reste à faire avant staging

Actions obligatoires :

1. Appliquer la migration Prisma `0006_stripe_webhook_idempotency` sur staging.
2. Créer ou vérifier le bucket privé Supabase `agent-files-private`.
3. Appliquer et vérifier les policies Supabase Storage depuis `supabase/snippets/storage-policies.sql`.
4. Configurer les vraies variables staging : DB, Supabase, `ENCRYPTION_KEY`, Stripe, `WEB_URL`, `NEXT_PUBLIC_API_URL`.
5. Configurer Stripe webhook en test mode sur l’URL staging.
6. Obtenir un build web reproductible et vert en CI/staging, avec nettoyage `.next` si nécessaire.
7. Clarifier le gate lint : corriger ou exclure explicitement `ClaakePresentation/**` si hors périmètre release.
8. Exécuter un smoke test staging complet : auth, agent payant, checkout/webhook, chat, upload.

## Ce qui reste à faire avant production publique large

1. Finaliser ou accepter formellement le risque SSRF résiduel : idéalement allowlist domaines vendeurs ou agent HTTP custom forçant la connexion à l’IP validée.
2. Ajouter antivirus/CDR/quarantaine pour les uploads si exposition publique large.
3. Clarifier les buckets publics `agent-images` et `agent-files`, notamment les `.agentjson` publics.
4. Confirmer qu’aucun `.agentjson` public ne contient secret, prompt sensible ou information confidentielle.
5. Implémenter ou documenter remboursements, chargebacks, subscriptions Stripe et révocation d’accès.
6. Traiter ou accepter formellement les 10 vulnérabilités modérées Expo/mobile.
7. Déclarer mobile hors périmètre release si non traité.
8. Documenter la rotation réelle des secrets côté fournisseurs : Supabase, OAuth, Stripe, etc.
9. Ajouter une suite E2E/Playwright ou équivalent pour les parcours critiques.
10. Vérifier les politiques RLS/PostgREST ou documenter le verrouillage d’accès via backend uniquement.

## Décision

- **Staging fermée** : GO sous conditions obligatoires listées ci-dessus.
- **Production publique large** : pas encore GO.
