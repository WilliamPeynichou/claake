# Cartographie technique et surfaces d’attaque

## 1. Objet et méthode

Ce document couvre la phase **cartographie technique** du plan d’audit technique et sécuritaire. Il repose uniquement sur l’exploration statique du dépôt local, sans action destructive et sans accès à des données réelles.

Objectifs couverts :

- identifier les composants applicatifs, responsabilités et interactions ;
- clarifier les flux critiques : inscription/connexion, création d’agent, chat, upload, paiement, administration ;
- recenser les dépendances externes et services tiers ;
- identifier les données sensibles manipulées ;
- cartographier les surfaces d’attaque et frontières de confiance.

Fichiers et répertoires particulièrement inspectés :

- `package.json`, `backend/package.json`, `frontendWeb/package.json`, `frontendApp/package.json`, `frontendAppMob/package.json`, `shared/package.json` ;
- `backend/src/main.ts`, `backend/src/app.module.ts` ;
- contrôleurs backend sous `backend/src/modules/**/infrastructure/controllers/*.ts` ;
- sécurité commune backend sous `backend/src/common/**` ;
- schéma de données `backend/prisma/schema.prisma` ;
- configuration environnement `backend/.env.example`, `backend/.env.production.example`, `frontendWeb/.env.example`, `frontendWeb/.env.production.example` ;
- clients partagés `shared/api/client.ts`, `shared/hooks/*` ;
- routage/protection web `frontendWeb/middleware.ts`, `frontendWeb/lib/supabase/middleware.ts`, `frontendWeb/app/(admin)/layout.tsx` ;
- configuration desktop `frontendApp/src-tauri/*`, `frontendApp/src/lib/*` ;
- prototype mobile `frontendAppMob/App.tsx`, `frontendAppMob/src/data/mock.ts`.

## 2. Vue d’ensemble de l’architecture

Le dépôt est un monorepo Node/TypeScript avec workspaces déclarés dans `package.json` :

| Composant | Chemin | Rôle observé | Surface exposée principale |
|---|---|---|---|
| Backend API | `backend/` | API NestJS, règles métier, authentification backend via Supabase, Prisma/PostgreSQL, paiements, uploads, chat/IA | HTTP `/v1/*`, webhook Stripe, proxy endpoints vendeurs, Supabase Storage |
| Web | `frontendWeb/` | Application Next.js publique, dashboard, chat, administration, auth Supabase SSR | Navigateur, cookies/session Supabase, appels API backend |
| Desktop | `frontendApp/` | Application React/Vite empaquetée Tauri | App locale, appels API/Supabase depuis client desktop |
| Mobile | `frontendAppMob/` | Application Expo/React Native actuellement principalement maquettée | Stockage local potentiel, navigation mobile ; pas d’intégration API significative observée |
| Shared | `shared/` | Client API, hooks React, types partagés | Sérialisation requêtes/réponses, propagation tokens Bearer |
| Présentation | `ClaakePresentation/` | Support de présentation/remotion | Non critique pour les flux applicatifs audités |

### Backend comme source d’autorité

Le backend NestJS est configuré dans `backend/src/main.ts` :

- préfixe global `v1` pour l’API ;
- CORS différencié dev/prod ;
- `helmet` et `compression` ;
- `ValidationPipe` global avec `whitelist`, `forbidNonWhitelisted`, `transform` ;
- filtres/intercepteurs globaux : `AllExceptionsFilter`, `SanitizeInterceptor`, `LoggingInterceptor`, `ResponseTransformInterceptor`.

Les modules métier sont déclarés dans `backend/src/app.module.ts` : `ActivityModule`, `AgentModule`, `CategoryModule`, `ChatModule`, `FavoriteModule`, `NotificationModule`, `PaymentModule`, `ReviewModule`, `StatsModule`, `UploadsModule`, `UserModule`, `PrismaModule`.

La limitation de débit globale est activée via `ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])` dans `backend/src/app.module.ts`. Le webhook Stripe est explicitement exempté via `@SkipThrottle()` dans `backend/src/modules/payments/infrastructure/controllers/payment.controller.ts`.

## 3. Frontières de confiance et flux d’authentification

### Authentification

- Côté client web, les sessions Supabase sont maintenues via `@supabase/ssr` et le middleware `frontendWeb/lib/supabase/middleware.ts`.
- Le backend vérifie les tokens Bearer via Supabase dans :
  - `backend/src/common/guards/supabase-auth.guard.ts` ;
  - `backend/src/common/guards/optional-supabase-auth.guard.ts`.
- La garde backend utilise `SUPABASE_SERVICE_ROLE_KEY` pour interroger Supabase Auth et crée automatiquement l’utilisateur local via `prisma.user.upsert` si nécessaire.
- La source d’autorité des rôles est la base locale : le rôle Supabase n’est utilisé qu’à la création initiale du profil local.

### Autorisation/rôles

Rôles définis dans `backend/prisma/schema.prisma` : `USER`, `CREATOR`, `ADMIN`, `SUPER_ADMIN`.

Contrôles observés :

- `RolesGuard` dans `backend/src/common/guards/roles.guard.ts` ;
- `AdminPermissionGuard` dans `backend/src/common/guards/admin-permission.guard.ts` ;
- permissions administrateur stockées en JSON dans `User.adminPermissions` (`backend/prisma/schema.prisma`) ;
- routes admin backend protégées, par exemple :
  - `GET /v1/users` avec `@Roles("ADMIN", "SUPER_ADMIN")` et `@RequirePermission("canManageUsers")` dans `backend/src/modules/users/infrastructure/controllers/user.controller.ts` ;
  - `PATCH /v1/users/:id/role` réservé `SUPER_ADMIN` ;
  - `PATCH /v1/agents/:id/review` avec rôle admin et permission `canManageAgents` ;
  - `GET /v1/admin/activity` dans `backend/src/modules/activity/infrastructure/controllers/activity.controller.ts`.

Côté web, `frontendWeb/lib/supabase/middleware.ts` protège `/dashboard`, `/chat`, `/checkout` par présence de session. Les routes `/admin` ne sont filtrées côté edge que par authentification ; le layout `frontendWeb/app/(admin)/layout.tsx` masque l’interface selon le rôle, mais les contrôles fins reposent bien sur le backend.

## 4. Cartographie des points d’entrée backend

### Points d’entrée publics ou optionnellement authentifiés

| Route logique | Fichier | Authentification | Données/risques |
|---|---|---|---|
| `GET /health` | `backend/src/modules/health/health.controller.ts` | Public | Santé application |
| `GET /v1/categories` | `backend/src/modules/categories/infrastructure/controllers/category.controller.ts` | Public | Catalogue catégories |
| `GET /v1/agents` | `backend/src/modules/agents/infrastructure/controllers/agent.controller.ts` | Optionnelle | Recherche catalogue ; paramètre `all=true` nécessite permission admin |
| `GET /v1/agents/:id` | même fichier | Optionnelle | Détail agent ; agents non approuvés masqués sauf créateur/admin |
| `GET /v1/agents/:agentId/reviews` | `backend/src/modules/reviews/infrastructure/controllers/review.controller.ts` | Public | Avis publiés |
| `GET /v1/creators/:id` | `backend/src/modules/users/infrastructure/controllers/user.controller.ts` | Public | Profil créateur public |
| `POST /v1/payments/webhook` | `backend/src/modules/payments/infrastructure/controllers/payment.controller.ts` | Public avec signature Stripe attendue | Évènements paiement ; surface critique webhook |

### Points d’entrée authentifiés utilisateur

| Route logique | Fichier | Surface critique |
|---|---|---|
| `GET/PATCH /v1/auth/profile` | `backend/src/modules/users/infrastructure/controllers/user.controller.ts` | Données profil utilisateur |
| `GET/POST/DELETE /v1/auth/api-keys` | même fichier | Clés API utilisateur chiffrées |
| `POST/PATCH/DELETE /v1/agents`, `GET /v1/agents/mine`, `PATCH /v1/agents/:id/unpublish`, `GET /v1/agents/:id/download-info` | `backend/src/modules/agents/infrastructure/controllers/agent.controller.ts` | Création/modification/publication d’agents, prompts, endpoints, clés vendeur |
| `POST/GET/DELETE /v1/chat/sessions*` | `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts` | Sessions et messages, streaming, coût IA, accès historique |
| `POST/GET/DELETE /v1/uploads*` | `backend/src/modules/uploads/infrastructure/controllers/upload.controller.ts` | Fichiers, stockage Supabase public, rattachement session/agent/message |
| `POST /v1/payments/checkout`, `GET /v1/payments/purchases`, `GET /v1/payments/access/:agentId` | `backend/src/modules/payments/infrastructure/controllers/payment.controller.ts` | Achat, accès agents payants |
| `POST /v1/payments/connect/onboard`, `GET /v1/payments/connect/status` | même fichier | Compte vendeur Stripe Connect |
| `POST/PATCH/DELETE /v1/agents/:agentId/reviews` | `backend/src/modules/reviews/infrastructure/controllers/review.controller.ts` | Avis, réputation, vérification achat/interaction |
| `POST/GET/DELETE /v1/favorites*`, `POST/GET/PATCH/DELETE /v1/collections*` | contrôleurs `favorites` | Bibliothèque utilisateur et collections |

### Points d’entrée administratifs

| Route logique | Fichier | Contrôle observé |
|---|---|---|
| `GET /v1/users` | `backend/src/modules/users/infrastructure/controllers/user.controller.ts` | `ADMIN`/`SUPER_ADMIN` + `canManageUsers` |
| `PATCH /v1/users/:id/role` | même fichier | `SUPER_ADMIN` |
| `PATCH /v1/agents/:id/review` | `backend/src/modules/agents/infrastructure/controllers/agent.controller.ts` | `ADMIN`/`SUPER_ADMIN` + `canManageAgents` |
| `GET /v1/stats/admin` | `backend/src/modules/stats/infrastructure/controllers/stats.controller.ts` | Admin + permission |
| `GET /v1/admin/activity` | `backend/src/modules/activity/infrastructure/controllers/activity.controller.ts` | Admin + permission |

## 5. Flux critiques

### 5.1 Inscription / connexion / profil

1. Les clients utilisent Supabase Auth (`frontendWeb/lib/supabase/*`, `frontendApp/src/lib/supabase.ts`).
2. Les appels API backend transportent le token d’accès en `Authorization: Bearer ...` via `shared/api/client.ts`.
3. Le backend valide le token avec Supabase (`SupabaseAuthGuard`).
4. Le backend crée si besoin l’utilisateur dans PostgreSQL (`User`) et s’appuie ensuite sur le rôle local.
5. Le profil est récupéré via `/v1/auth/profile`.

Données sensibles : email, identifiant Supabase, rôle, permissions admin, profil public/privé.

### 5.2 Création et publication d’agent

Fichiers clés :

- contrôleur : `backend/src/modules/agents/infrastructure/controllers/agent.controller.ts` ;
- DTO : `backend/src/modules/agents/application/dtos/create-agent.dto.ts`, `update-agent.dto.ts` ;
- validation automatique : `backend/src/modules/agents/application/usecases/validate-agent.usecase.ts` ;
- modèle : `Agent`, `AgentVersion` dans `backend/prisma/schema.prisma`.

Flux :

1. Utilisateur authentifié crée un agent avec nom, slug, description, tags, modèles, mode, prix, URLs et stratégie cloud.
2. Le backend applique validation DTO et sanitization globale.
3. Le cas d’usage crée l’agent puis lance `ValidateAgentUseCase`.
4. La validation inspecte certains champs textuels et éventuellement le fichier `config_url` distant.
5. Le statut devient `DRAFT`, `PENDING` ou autre selon validation ; l’approbation/rejet est fait via route admin.

Surfaces : prompt injection, contenus malveillants dans descriptions/prompts, endpoints vendeurs, URLs de téléchargement/configuration/image, prix/statut, clé API vendeur chiffrée.

### 5.3 Chat et exécution IA

Fichiers clés :

- `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts` ;
- `backend/src/modules/chat/application/usecases/send-message.usecase.ts` ;
- `backend/src/modules/chat/application/services/execution-strategy.resolver.ts` ;
- providers IA dans `backend/src/modules/chat/infrastructure/providers/*.ts`.

Flux :

1. Utilisateur authentifié crée une session pour un agent.
2. Il envoie un message, éventuellement avec fichiers attachés.
3. Le backend vérifie que la session appartient à l’utilisateur.
4. Le backend charge l’historique, résout la stratégie d’exécution :
   - mock local ;
   - clé vendeur chiffrée ;
   - clé API utilisateur ;
   - endpoint vendeur proxifié.
5. La réponse est streamée au client au format compatible Vercel AI SDK.

Surfaces : coût IA, prompt injection entre agent/système/utilisateur, accès à l’historique, pièces jointes transmises aux modèles, erreurs de streaming, proxy vers endpoints externes.

### 5.4 Uploads et fichiers

Fichiers clés :

- `backend/src/modules/uploads/infrastructure/controllers/upload.controller.ts` ;
- `backend/src/modules/uploads/application/upload.service.ts` ;
- modèle `UploadedFile` dans `backend/prisma/schema.prisma`.

Flux :

1. Upload authentifié via `multipart/form-data`, stockage en mémoire multer, limite 10 Mo.
2. Validation MIME déclarée : JPEG, PNG, WebP, GIF, PDF.
3. Contrôle du rattachement : agent du créateur, session/message de l’utilisateur.
4. Upload dans Supabase Storage bucket `agent-files`.
5. URL publique récupérée et stockée en base.

Surfaces : type MIME falsifié, fichiers actifs/PDF malveillants, bucket public, métadonnées sensibles, suppression/rétention, exposition des URLs dans prompts IA.

### 5.5 Paiements et webhooks

Fichiers clés :

- `backend/src/modules/payments/infrastructure/controllers/payment.controller.ts` ;
- `backend/src/modules/payments/application/usecases/create-checkout.usecase.ts` ;
- `backend/src/modules/payments/application/usecases/handle-webhook.usecase.ts` ;
- modèle `Purchase`, `Subscription` dans `backend/prisma/schema.prisma`.

Flux :

1. Utilisateur authentifié demande un checkout pour un agent non gratuit.
2. Le backend récupère prix/devise depuis l’agent côté serveur, pas depuis le client.
3. Stripe Checkout reçoit metadata `user_id`/`agent_id` via le service Stripe.
4. Webhook public `POST /v1/payments/webhook` vérifie la signature via service Stripe.
5. À `checkout.session.completed`, création d’un `Purchase` si non existant.
6. L’accès est vérifié via `/v1/payments/access/:agentId`.

Surfaces : signature webhook, rejeu/idempotence, cohérence montant/devise/statut agent, accès agents payants, onboarding vendeur Stripe Connect.

### 5.6 Administration

Flux :

- Interface web `/admin/*` affichée selon rôle dans `frontendWeb/app/(admin)/layout.tsx`.
- Backend impose rôles/permissions pour les endpoints sensibles.
- Actions sensibles observées : revue agents, gestion utilisateurs/rôles, consultation stats/admin/activity.

Surfaces : contournement de rôles, escalade de permissions JSON, exposition de données admin, journalisation insuffisante des actions sensibles.

## 6. Données sensibles et actifs à protéger

| Actif / donnée | Emplacement modèle/configuration | Sensibilité |
|---|---|---|
| Tokens Supabase utilisateur | Clients, en-tête Bearer | Authentification, usurpation de session |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend env (`backend/.env*`) | Critique : accès privilégié Supabase |
| `DATABASE_URL` | Backend env | Critique : accès base PostgreSQL |
| `ENCRYPTION_KEY` | Backend env | Critique : déchiffrement clés API utilisateur/vendeur |
| Clés API utilisateur | `User.apiKeysEncrypted` | Critique : accès fournisseurs IA tiers |
| Clés API vendeur | `Agent.sellerApiKeyEncrypted` | Critique : accès fournisseurs IA vendeurs |
| Clés Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Critique : paiements/webhooks |
| Rôles et permissions | `User.role`, `User.adminPermissions` | Critique : autorisation |
| Prompts et contenus agents | `Agent.systemPrompt`, descriptions, `configUrl` | Sensible : comportement IA, injection, propriété intellectuelle |
| Conversations | `ChatSession`, `ChatMessage` | Potentiellement confidentiel/personnel |
| Fichiers uploadés | `UploadedFile`, Supabase bucket `agent-files` | Potentiellement personnel/confidentiel ; bucket public observé |
| Achats/abonnements | `Purchase`, `Subscription` | Données commerciales et d’accès |
| Logs activité | `ActivityLog` | Audit trail, emails acteurs, métadonnées sensibles possibles |

## 7. Dépendances et services externes

### Backend

Dépendances critiques dans `backend/package.json` :

- NestJS (`@nestjs/*`) pour API ;
- Prisma/PostgreSQL (`@prisma/client`, `prisma`) ;
- Supabase (`@supabase/supabase-js`) pour auth/storage ;
- Stripe (`stripe`) pour paiements ;
- `helmet`, `compression` ;
- `@nestjs/throttler` ;
- `class-validator`, `class-transformer` ;
- `sanitize-html`.

### Web

Dépendances critiques dans `frontendWeb/package.json` :

- Next.js 15, React 19 ;
- Supabase SSR/client ;
- `react-markdown`, `remark-gfm` pour rendu contenu généré ;
- `@ai-sdk/react` côté expérience chat.

### Desktop/mobile

- Desktop : Tauri 2, Vite, Supabase JS, React Router (`frontendApp/package.json`, `frontendApp/src-tauri/Cargo.toml`).
- Mobile : Expo/React Native et `@react-native-async-storage/async-storage` (`frontendAppMob/package.json`). Le code mobile inspecté utilise des données mock dans `frontendAppMob/src/data/mock.ts`.

### Infrastructure locale

`docker-compose.yml` démarre uniquement PostgreSQL 16 avec identifiants locaux `postgres/postgres`. Le schéma Prisma active `pgvector` et `pg_trgm` (`backend/prisma/schema.prisma`), mais aucun dossier `backend/prisma/migrations` n’a été trouvé lors de la cartographie.

## 8. Surfaces d’attaque priorisées

| Surface | Chemins/fichiers | Niveau d’exposition | Points d’attention |
|---|---|---:|---|
| Authentification Bearer Supabase | `supabase-auth.guard.ts`, clients `shared/api/client.ts` | Très élevé | Tokens absents/expirés, création automatique d’utilisateur, cohérence rôle Supabase/base |
| Autorisation admin/rôles | `roles.guard.ts`, `admin-permission.guard.ts`, `user.controller.ts`, `agent.controller.ts` | Très élevé | Super-admin, permissions JSON, routes admin exposées côté web mais contrôlées backend |
| Agents publiés par utilisateurs | `create-agent.dto.ts`, `validate-agent.usecase.ts`, `agent.controller.ts` | Très élevé | Prompts, URLs, stratégies cloud, revue automatique/manuelle, statut publication |
| Chat/IA/streaming | `chat.controller.ts`, `send-message.usecase.ts`, providers IA | Très élevé | Coûts IA, historique, pièces jointes, erreurs stream, prompt injection |
| Proxy endpoints vendeurs | `endpoint-proxy.provider.ts`, `is-public-url.validator.ts` | Très élevé | SSRF, DNS privé, redirections, taille/timeout, erreurs fournisseur exposées |
| Uploads/Supabase Storage | `upload.controller.ts`, `upload.service.ts` | Élevé | MIME, PDF/images, bucket public, suppression, rattachement propriétaire |
| Paiements/webhooks Stripe | `payment.controller.ts`, `handle-webhook.usecase.ts` | Très élevé | Signature, idempotence, cohérence achat/agent/prix, replay |
| Clés API utilisateur/vendeur | `manage-api-keys.usecase.ts`, `aes-encryption.service.ts`, schema `User`/`Agent` | Très élevé | Chiffrement, aperçus, rotation `ENCRYPTION_KEY`, non-exposition logs/réponses |
| Rendu Markdown/contenus générés | `frontendWeb/components/chat/message.tsx`, `react-markdown` | Moyen à élevé | Liens, HTML, XSS, phishing via contenu IA |
| Configuration/CORS/headers | `backend/src/main.ts`, `frontendWeb/next.config.mjs`, `.env*.example` | Élevé | Origines, HSTS, CSP, variables prod/dev |
| Base de données/modèle | `backend/prisma/schema.prisma` | Très élevé | Données multi-tenant, contraintes, suppression logique, migrations absentes |
| Desktop/mobile | `frontendApp/*`, `frontendAppMob/*` | Moyen | Stockage local, API URL, sessions, capacités Tauri, mobile mock non aligné backend |

## 9. Observations de cartographie utiles pour l’audit sécurité

Ces points ne remplacent pas la revue sécurité détaillée, mais orientent les vérifications prioritaires :

1. **Le backend a bien un rôle central** pour les contrôles sensibles : Guards NestJS, validation DTO globale, DB comme source d’autorité des rôles.
2. **Les routes critiques existent et sont nombreuses** : agents, chat, uploads, paiements, clés API, admin. Les tests doivent couvrir l’accès croisé par propriétaire sur chaque ressource.
3. **Le proxy vendeur est une surface SSRF majeure** : le code bloque plusieurs IP privées numériques et les redirections (`redirect: "error"`), mais la cartographie doit vérifier aussi DNS, IPv6, encodages et domaines résolvant vers des IP privées.
4. **Les uploads sont stockés via URL publique Supabase** (`getPublicUrl`) avec commentaire indiquant bucket public dans `upload.service.ts`. Cela augmente fortement l’exposition des fichiers utilisateur.
5. **Le mobile semble être un prototype mocké** (`frontendAppMob/src/data/mock.ts`) et ne valide pas encore la cohérence avec le backend de production.
6. **L’application desktop utilise une URL API par défaut sans `/v1`** (`frontendApp/src/lib/api.ts`), alors que le backend expose un préfixe global `/v1`. C’est une incohérence fonctionnelle/configuration à vérifier avant production.
7. **Les migrations Prisma ne sont pas présentes** dans `backend/prisma/migrations` selon l’exploration, malgré scripts `prisma:migrate:prod`. C’est une zone de risque pour déploiement reproductible et sécurité des migrations.
8. **La couverture de tests observée est surtout backend unitaires** (`*.spec.ts` sous agents/chat/users/health). Aucun répertoire e2e backend n’a été trouvé malgré script `test:e2e`.
9. **Le rendu Markdown IA côté web utilise `react-markdown` sans plugins HTML observés**, ce qui limite l’injection HTML directe, mais les liens/contenus trompeurs restent une surface phishing/contenu actif.
10. **La configuration production documente les secrets essentiels** (`backend/.env.production.example`), mais l’audit complet doit vérifier l’absence de secrets réels dans le dépôt et la robustesse des valeurs prod.

## 10. Scénarios de tests de non-régression issus de la cartographie

À intégrer dans les livrables de tests consolidés :

### Authentification/autorisation

- Appeler chaque route authentifiée sans token, avec token expiré, token malformé, token valide utilisateur A.
- Tester utilisateur standard sur routes `/v1/users`, `/v1/stats/admin`, `/v1/admin/activity`, `/v1/agents/:id/review`.
- Tester administrateur sans permission JSON requise.
- Tester admin simple sur `PATCH /v1/users/:id/role` réservé super-admin.

### Isolation multi-utilisateur

- Utilisateur A tente de lire/modifier/supprimer agent, session chat, fichier, collection, avis ou clé API de B.
- Utilisateur A tente d’attacher à un message un `file_id` appartenant à B.
- Utilisateur A tente de lister fichiers d’une session/agent de B.

### Agents et proxy

- Création agent avec `endpoint_url` vers `localhost`, `127.0.0.1`, `10.0.0.1`, `169.254.169.254`, IPv6 local, URL encodée, domaine redirigeant, domaine résolvant en IP privée.
- Création agent avec prompt contenant injections obfusquées, chaînes longues, tags nombreux, URLs de configuration invalides.
- Vérifier qu’un agent `REJECTED`, `SUSPENDED` ou `DRAFT` n’est pas exécutable/achetable par un tiers.

### Chat et coûts IA

- Messages > 10 000 caractères refusés.
- Nombre excessif de pièces jointes, doublons, pièces jointes non autorisées.
- Streaming interrompu ou fournisseur externe retournant erreur détaillée.
- Rafales de messages pour vérifier limites globales et limites spécifiques attendues.

### Uploads

- MIME falsifié, extension trompeuse, PDF malveillant de test inoffensif, fichier > 10 Mo.
- Vérifier public/private access des URLs Supabase.
- Suppression fichier puis indisponibilité effective dans storage et base.

### Paiements

- Checkout manipulé côté client : montant, devise, agent gratuit/payant, agent non publié.
- Webhook sans signature, signature invalide, replay, metadata manquante, montant incohérent.
- Achat existant et idempotence `Purchase @@unique([userId, agentId])`.

## 11. Recommandations de cartographie / documentation

1. Maintenir un inventaire officiel des routes backend avec niveau d’authentification, propriétaire de ressource et tests associés.
2. Documenter les frontières de confiance : client web/desktop/mobile, backend, Supabase Auth, Supabase Storage, Stripe, fournisseurs IA et endpoints vendeurs.
3. Documenter explicitement les données sensibles, leur durée de conservation et leur procédure de suppression.
4. Clarifier le statut production de l’application mobile : prototype mock ou client supporté.
5. Ajouter une documentation de déploiement DB avec migrations versionnées et extensions PostgreSQL requises (`pgvector`, `pg_trgm`).
6. Formaliser les contrôles attendus par route sensible : authentification, autorisation propriétaire, limitation de débit, journalisation, validation d’entrée.

## 12. Conclusion cartographique

L’application présente une architecture cohérente où le backend NestJS concentre les règles de sécurité et métier. Les surfaces d’attaque critiques se situent principalement sur :

- l’authentification/autorisation multi-rôles ;
- la publication et l’exécution d’agents utilisateurs ;
- le proxy vers endpoints vendeurs ;
- les uploads publics Supabase ;
- les paiements/webhooks Stripe ;
- le stockage/chiffrement des clés API ;
- le chat IA et les contenus générés.

La cartographie confirme que le projet nécessite une revue sécurité approfondie avant production, notamment sur les accès croisés, le SSRF, l’exposition des fichiers, l’idempotence paiement, les limites de débit par route critique et la couverture de tests e2e.
