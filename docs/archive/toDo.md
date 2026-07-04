Plan to implement                                                                                                       │
│                                                                                                                         │
│ Plan v0.03 — Claake : Marketplace complète + Sécurité + Desktop                                                         │
│                                                                                                                         │
│ Contexte                                                                                                                │
│                                                                                                                         │
│ Le MVP (V0.01 + V0.02) est livré : vitrine d'agents, chat SSE, publication avec validation, admin. Claake doit          │
│ maintenant devenir une vraie marketplace avec paiements, reviews, favoris, et être sécurisée avant mise en production.  │
│ En parallèle, documenter l'architecture de l'app desktop Tauri (chat-only + accès boutique).                            │
│                                                                                                                         │
│ ---                                                                                                                     │
│ Découpage en features                                                                                                   │
│                                                                                                                         │
│ ┌─────┬────────────────────────────┬────────────┬─────────────┬───────┐                                                 │
│ │  #  │          Feature           │ Complexité │ Dépendances │ Jours │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F1  │ Favoris + Collections      │ Moyenne    │ —           │ 2-3   │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F2  │ Stripe Payments            │ Complexe   │ —           │ 4-5   │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F3  │ Recherche avancée          │ Simple     │ —           │ 1-2   │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F4  │ Profil créateur public     │ Simple     │ —           │ 1-2   │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F5  │ Activity Logs admin        │ Moyenne    │ —           │ 2     │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F6  │ Reviews & Ratings          │ Moyenne    │ F1, F2      │ 3     │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F7  │ Notifications email        │ Moyenne    │ F2, F6      │ 3     │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F8  │ Sécurisation               │ Moyenne    │ après F1-F7 │ 2     │                                                 │
│ ├─────┼────────────────────────────┼────────────┼─────────────┼───────┤                                                 │
│ │ F9  │ Architecture desktop (doc) │ Simple     │ après F8    │ 0.5   │                                                 │
│ └─────┴────────────────────────────┴────────────┴─────────────┴───────┘                                                 │
│                                                                                                                         │
│ Total estimé : ~19-23 jours                                                                                             │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F1 — Favoris + Collections                                                                                              │
│                                                                                                                         │
│ Schéma Prisma                                                                                                           │
│                                                                                                                         │
│ Modèles Favorite et Collection déjà en base — aucun changement schema.                                                  │
│                                                                                                                         │
│ Backend : src/modules/favorites/                                                                                        │
│                                                                                                                         │
│ Domain :                                                                                                                │
│ - domain/entities/favorite.entity.ts — FavoriteEntity(id, userId, agentId, createdAt)                                   │
│ - domain/entities/collection.entity.ts — CollectionEntity(id, name, description, isPublic, agentIds[], userId,          │
│ createdAt) + canBeEditedBy(userId), canBeViewedBy(userId)                                                               │
│ - domain/ports/favorite.repository.port.ts — Token FAVORITE_REPOSITORY, interface : toggle, findByUser, isFavorited,    │
│ isFavoritedBatch                                                                                                        │
│ - domain/ports/collection.repository.port.ts — Token COLLECTION_REPOSITORY, interface : CRUD + addAgent, removeAgent    │
│                                                                                                                         │
│ Application :                                                                                                           │
│ - DTOs : favorite-response.dto.ts, collection-response.dto.ts, create-collection.dto.ts, update-collection.dto.ts       │
│ - UseCases : ToggleFavoriteUseCase, ListFavoritesUseCase, CreateCollectionUseCase, UpdateCollectionUseCase,             │
│ DeleteCollectionUseCase, AddAgentToCollectionUseCase, RemoveAgentFromCollectionUseCase, ListCollectionsUseCase          │
│ - Transformers : FavoriteTransformer, CollectionTransformer                                                             │
│                                                                                                                         │
│ Infrastructure :                                                                                                        │
│ - controllers/favorite.controller.ts :                                                                                  │
│   - POST /v1/favorites/:agentId — toggle (auth)                                                                         │
│   - GET /v1/favorites — list (auth)                                                                                     │
│   - GET /v1/favorites/check/:agentId — check (auth)                                                                     │
│ - controllers/collection.controller.ts :                                                                                │
│   - POST /v1/collections — create (auth)                                                                                │
│   - GET /v1/collections — list user's (auth)                                                                            │
│   - GET /v1/collections/:id — get (public ou owner)                                                                     │
│   - PATCH /v1/collections/:id — update (owner)                                                                          │
│   - DELETE /v1/collections/:id — delete (owner)                                                                         │
│   - POST /v1/collections/:id/agents/:agentId — add (owner)                                                              │
│   - DELETE /v1/collections/:id/agents/:agentId — remove (owner)                                                         │
│ - repositories/ : prisma-favorite.repository.ts, prisma-collection.repository.ts                                        │
│ - mappers/ : favorite.mapper.ts, collection.mapper.ts                                                                   │
│                                                                                                                         │
│ Module : favorite.module.ts — importe AgentModule                                                                       │
│                                                                                                                         │
│ Shared :                                                                                                                │
│ - shared/api/client.ts — ajouter favorites et collections namespaces                                                    │
│ - shared/hooks/use-favorites.ts, shared/hooks/use-collections.ts                                                        │
│                                                                                                                         │
│ Frontend :                                                                                                              │
│ - frontendWeb/components/agents/favorite-button.tsx — coeur toggle                                                      │
│ - frontendWeb/app/(dashboard)/dashboard/library/page.tsx — tabs Favoris | Collections                                   │
│ - frontendWeb/components/collections/collection-dialog.tsx — modal create/edit                                          │
│ - frontendWeb/components/collections/add-to-collection-dialog.tsx — sélecteur collection                                │
│ - Modifier : cards agent (catalogue + détail) pour ajouter FavoriteButton                                               │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F2 — Stripe Payments                                                                                                    │
│                                                                                                                         │
│ Nouvelle dépendance                                                                                                     │
│                                                                                                                         │
│ npm install stripe dans backend/                                                                                        │
│                                                                                                                         │
│ Backend : src/modules/payments/                                                                                         │
│                                                                                                                         │
│ Domain :                                                                                                                │
│ - domain/entities/purchase.entity.ts — PurchaseEntity(id, userId, agentId, amount, currency, stripePaymentId,           │
│ createdAt)                                                                                                              │
│ - domain/entities/subscription.entity.ts — SubscriptionEntity(...) + isActive()                                         │
│ - domain/ports/payment.repository.port.ts — Token PAYMENT_REPOSITORY, interface : createPurchase,                       │
│ findPurchaseByUserAndAgent, findPurchasesByUser, createSubscription, updateSubscriptionStatus, hasAccess                │
│ - domain/ports/stripe.port.ts — Token STRIPE_SERVICE, interface : createCheckoutSession, constructWebhookEvent,         │
│ createConnectAccount, createAccountLink                                                                                 │
│                                                                                                                         │
│ Application :                                                                                                           │
│ - DTOs : checkout-request.dto.ts, purchase-response.dto.ts, checkout-response.dto.ts                                    │
│ - UseCases : CreateCheckoutUseCase, HandleWebhookUseCase, ListPurchasesUseCase, CheckAccessUseCase,                     │
│ CreateConnectAccountUseCase                                                                                             │
│                                                                                                                         │
│ Infrastructure :                                                                                                        │
│ - stripe/stripe.service.ts — implémente StripeServicePort (SDK Stripe)                                                  │
│ - controllers/payment.controller.ts :                                                                                   │
│   - POST /v1/payments/checkout — crée session Stripe (auth)                                                             │
│   - POST /v1/payments/webhook — sans auth, raw body, vérif signature Stripe, @SkipTransform()                           │
│   - GET /v1/payments/purchases — historique (auth)                                                                      │
│   - GET /v1/payments/access/:agentId — vérif accès (auth)                                                               │
│   - POST /v1/payments/connect/onboard — Stripe Connect créateur (auth)                                                  │
│   - GET /v1/payments/connect/status — statut compte (auth)                                                              │
│ - repositories/prisma-payment.repository.ts                                                                             │
│ - mappers/purchase.mapper.ts, subscription.mapper.ts                                                                    │
│                                                                                                                         │
│ Config critique :                                                                                                       │
│ - main.ts — app.use('/v1/payments/webhook', express.raw({ type: 'application/json' })) avant body parsing               │
│ - Variables env : STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET                                                              │
│                                                                                                                         │
│ Frontend :                                                                                                              │
│ - Page agent détail → bouton achat → redirige Stripe Checkout                                                           │
│ - frontendWeb/app/(public)/checkout/success/page.tsx et cancel/page.tsx                                                 │
│ - Dashboard settings → section "Devenir créateur" avec onboarding Stripe Connect                                        │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F3 — Recherche avancée                                                                                                  │
│                                                                                                                         │
│ Backend (étend l'existant)                                                                                              │
│                                                                                                                         │
│ Modifier AgentListParams dans agent.repository.port.ts :                                                                │
│ + pricingModel?: string       // "free" | "one_time" | "subscription"                                                   │
│ + mode?: string               // "local" | "cloud" | "hybrid"                                                           │
│ + minRating?: number          // 0-5                                                                                    │
│ + tags?: string[]             // hasSome                                                                                │
│ + sortBy?: string             // "popularity" | "rating" | "newest"                                                     │
│ + page?: number                                                                                                         │
│ + limit?: number                                                                                                        │
│                                                                                                                         │
│ Modifier prisma-agent.repository.ts — clauses where + orderBy + pagination skip/take                                    │
│ Modifier agent.controller.ts — query params additionnels                                                                │
│ Modifier list-agents.usecase.ts — retourne PaginatedResponse<AgentResponseDto> avec meta                                │
│                                                                                                                         │
│ Shared : mettre à jour agents.list() dans shared/api/client.ts                                                          │
│                                                                                                                         │
│ Frontend :                                                                                                              │
│ - frontendWeb/components/catalogue/search-filters.tsx — sidebar filtres : pricing, mode, rating, catégorie, tri         │
│ - Modifier catalogue/page.tsx — intégrer filtres, état dans URL search params                                           │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F4 — Profil créateur public                                                                                             │
│                                                                                                                         │
│ Schéma Prisma                                                                                                           │
│                                                                                                                         │
│ Ajouter au model User : portfolioLinks Json? @map("portfolio_links")                                                    │
│                                                                                                                         │
│ Backend (étend users/)                                                                                                  │
│                                                                                                                         │
│ - application/usecases/get-creator-profile.usecase.ts — fetch user (CREATOR+), agents publiés, stats agrégées           │
│ - application/dtos/creator-profile-response.dto.ts — id, display_name, avatar_url, bio, portfolio_links[{label, url}],  │
│ published_agents[], stats                                                                                               │
│ - Controller : GET /v1/creators/:id — public, pas d'auth                                                                │
│ - Validation liens : regex HTTPS obligatoire, max 5 liens                                                               │
│ - Modifier UserEntity + UserRepositoryPort.updateProfile + mapper pour portfolioLinks                                   │
│                                                                                                                         │
│ Shared : type CreatorProfile, creators.get(id) dans API client                                                          │
│                                                                                                                         │
│ Frontend :                                                                                                              │
│ - frontendWeb/app/(public)/creators/[id]/page.tsx — page profil avec agents grid                                        │
│ - Liens portfolio avec icônes (globe, github, linkedin…)                                                                │
│ - Lien vers profil créateur depuis les cards agent                                                                      │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F5 — Activity Logs admin                                                                                                │
│                                                                                                                         │
│ Schéma Prisma — nouveau modèle                                                                                          │
│                                                                                                                         │
│ model ActivityLog {                                                                                                     │
│   id         String   @id @default(uuid())                                                                              │
│   actorId    String   @map("actor_id")                                                                                  │
│   actorEmail String   @map("actor_email")                                                                               │
│   action     String   // "agent.approved", "user.role_changed"...                                                       │
│   targetType String   @map("target_type")                                                                               │
│   targetId   String   @map("target_id")                                                                                 │
│   metadata   Json?                                                                                                      │
│   createdAt  DateTime @default(now()) @map("created_at")                                                                │
│   @@index([action])                                                                                                     │
│   @@index([targetType, targetId])                                                                                       │
│   @@index([createdAt])                                                                                                  │
│   @@map("activity_logs")                                                                                                │
│ }                                                                                                                       │
│                                                                                                                         │
│ Backend : src/modules/activity/                                                                                         │
│                                                                                                                         │
│ - ActivityLogService — injectable, exporté, utilisé par les autres modules via activityLogService.log({...})            │
│ - ListActivityLogsUseCase — paginé, filtrable par action/targetType/date                                                │
│ - Controller : GET /v1/admin/activity — admin + canViewActivity                                                         │
│                                                                                                                         │
│ Intégration : ajouter appels log() dans :                                                                               │
│ - review-agent.usecase.ts — agent approuvé/rejeté                                                                       │
│ - update-user-role.usecase.ts — rôle modifié                                                                            │
│ - Futurs : modération reviews, paiements                                                                                │
│                                                                                                                         │
│ Frontend : implémenter /admin/activity — table paginée + filtres                                                        │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F6 — Reviews & Ratings                                                                                                  │
│                                                                                                                         │
│ Schéma Prisma                                                                                                           │
│                                                                                                                         │
│ Ajouter au model Review : verifiedInteraction Boolean @default(false) @map("verified_interaction")                      │
│                                                                                                                         │
│ Backend : src/modules/reviews/                                                                                          │
│                                                                                                                         │
│ Domain :                                                                                                                │
│ - ReviewEntity(id, userId, agentId, rating, comment, verifiedPurchase, verifiedInteraction, helpfulCount, createdAt,    │
│ updatedAt) + isOwnedBy(userId)                                                                                          │
│ - ReviewRepositoryPort — CRUD + findByAgentId (paginé) + computeAgentStats (avg + count)                                │
│                                                                                                                         │
│ Application :                                                                                                           │
│ - CreateReviewUseCase — logique clé :                                                                                   │
│   a. Vérifier pas de review existante (unique userId+agentId)                                                           │
│   b. Agent payant → vérifier Purchase existe via PaymentRepository.hasAccess() → verifiedPurchase = true                │
│   c. Agent gratuit → vérifier ChatSession existe via ChatSessionRepository.findByUserAndAgent() → verifiedInteraction = │
│  true                                                                                                                   │
│   d. Si aucun des deux → 403 "Vous devez utiliser cet agent avant de le noter"                                          │
│   e. Créer review + recalculer agent.rating et agent.reviewCount                                                        │
│ - UpdateReviewUseCase — ownership + recalcul stats                                                                      │
│ - DeleteReviewUseCase — ownership OU admin canManageReviews + recalcul                                                  │
│ - ListReviewsUseCase — par agentId, paginé, avec userName                                                               │
│ - DTOs : create-review.dto.ts (rating @Min(1) @Max(5) @IsInt, comment @MaxLength(2000)), review-response.dto.ts         │
│                                                                                                                         │
│ Infrastructure :                                                                                                        │
│ - POST /v1/agents/:agentId/reviews — auth                                                                               │
│ - PATCH /v1/agents/:agentId/reviews/:reviewId — auth, owner                                                             │
│ - DELETE /v1/agents/:agentId/reviews/:reviewId — auth, owner ou admin                                                   │
│ - GET /v1/agents/:agentId/reviews — public, paginé                                                                      │
│                                                                                                                         │
│ Modifier AgentRepositoryPort — ajouter updateRating(id, rating, reviewCount)                                            │
│                                                                                                                         │
│ Module : importe AgentModule, PaymentModule, ChatModule                                                                 │
│                                                                                                                         │
│ Frontend :                                                                                                              │
│ - frontendWeb/components/reviews/review-form.tsx — note étoiles + textarea                                              │
│ - frontendWeb/components/reviews/review-list.tsx — liste paginée avec badges vérifiés                                   │
│ - Intégrer sur la page agent détail                                                                                     │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F7 — Notifications email (Supabase)                                                                                     │
│                                                                                                                         │
│ Backend : src/modules/notifications/                                                                                    │
│                                                                                                                         │
│ Domain :                                                                                                                │
│ - EmailServicePort — Token EMAIL_SERVICE, interface : sendEmail({ to, subject, html })                                  │
│ - Types événements : agent.approved, agent.rejected, payment.confirmed, review.received                                 │
│                                                                                                                         │
│ Application :                                                                                                           │
│ - NotificationService — injectable, switch sur event type, construit HTML depuis template, envoie                       │
│ - application/templates/ — fonctions TS retournant HTML :                                                               │
│   - agent-approved.template.ts                                                                                          │
│   - agent-rejected.template.ts                                                                                          │
│   - payment-confirmed.template.ts                                                                                       │
│   - review-received.template.ts                                                                                         │
│   - Tous avec branding Claake : logo, #2a7a44, layout pro                                                               │
│                                                                                                                         │
│ Infrastructure :                                                                                                        │
│ - supabase-email.service.ts — implémente EmailServicePort via SMTP Supabase / nodemailer                                │
│                                                                                                                         │
│ Intégration : appels notificationService.notify() dans :                                                                │
│ - review-agent.usecase.ts — après approve/reject                                                                        │
│ - handle-webhook.usecase.ts — après achat confirmé                                                                      │
│ - create-review.usecase.ts — notifier le créateur                                                                       │
│                                                                                                                         │
│ Templates auth Supabase : personnaliser dans le dashboard Supabase (confirmation, reset, magic link) avec branding      │
│ Claake                                                                                                                  │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F8 — Sécurisation                                                                                                       │
│                                                                                                                         │
│ 1. Helmet — headers HTTP                                                                                                │
│                                                                                                                         │
│ npm install helmet + app.use(helmet({...})) dans main.ts                                                                │
│ - CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy                                                   │
│                                                                                                                         │
│ 2. Rate limiting granulaire                                                                                             │
│                                                                                                                         │
│ Decorators @Throttle() par endpoint :                                                                                   │
│ - Auth : 5 req/min                                                                                                      │
│ - Payments : 10 req/min                                                                                                 │
│ - Chat send : 30 req/min                                                                                                │
│ - Webhook : @SkipThrottle()                                                                                             │
│                                                                                                                         │
│ 3. Sanitization input                                                                                                   │
│                                                                                                                         │
│ - npm install sanitize-html                                                                                             │
│ - SanitizeInterceptor ou @Transform() sur DTOs                                                                          │
│ - Strip HTML dans : reviews comments, bio, agent descriptions                                                           │
│                                                                                                                         │
│ 4. CORS production                                                                                                      │
│                                                                                                                         │
│ origin: process.env.NODE_ENV === 'production'                                                                           │
│   ? [process.env.WEB_URL]                                                                                               │
│   : [dev origins]                                                                                                       │
│                                                                                                                         │
│ 5. Stripe webhook signature                                                                                             │
│                                                                                                                         │
│ Déjà couvert par F2 — stripe.webhooks.constructEvent(rawBody, sig, secret)                                              │
│                                                                                                                         │
│ 6. Audit sécurité                                                                                                       │
│                                                                                                                         │
│ - Vérifier aucune raw query Prisma (injection SQL)                                                                      │
│ - Vérifier validation sur tous les endpoints                                                                            │
│ - Vérifier ownership checks partout                                                                                     │
│ - Tester les guards sur chaque route                                                                                    │
│                                                                                                                         │
│ Fichiers clés :                                                                                                         │
│ - backend/src/main.ts                                                                                                   │
│ - backend/package.json                                                                                                  │
│ - Controllers (ajout @Throttle)                                                                                         │
│ - Nouveau : src/common/interceptors/sanitize.interceptor.ts                                                             │
│                                                                                                                         │
│ ---                                                                                                                     │
│ F9 — Architecture Desktop (documentation)                                                                               │
│                                                                                                                         │
│ Fichier : docs/architecture/desktop-architecture.md                                                                                  │
│                                                                                                                         │
│ Contenu documenté :                                                                                                     │
│                                                                                                                         │
│ 1. Périmètre app desktop — Chat uniquement avec les agents de l'utilisateur (favoris + achetés). Bouton "Accéder à la   │
│ boutique" → ouvre le navigateur système sur le catalogue web.                                                           │
│ 2. Stack — Tauri 2 + React/Vite + @claake/shared                                                                        │
│ 3. Auth — Même flow Supabase, token stocké dans @tauri-apps/plugin-store (secure storage natif). Deep link pour         │
│ callback OAuth.                                                                                                         │
│ 4. API — Même backend, même endpoints. Le createApiClient() de @claake/shared fonctionne tel quel.                      │
│ 5. Composants réutilisables — Les composants chat (chat-main, chat-input, chat-message-item) peuvent être extraits de   │
│ frontendWeb/components/chat/ vers shared/ ou dupliqués. Pas de shadcn côté desktop → Tailwind natif ou bibliothèque     │
│ légère.                                                                                                                 │
│ 6. Adaptations backend nécessaires :                                                                                    │
│   - CORS : tauri://localhost déjà configuré                                                                             │
│   - Endpoint GET /v1/agents/library — agents favoris + achetés de l'utilisateur (combinaison favorites + purchases)     │
│   - Aucun autre changement backend requis                                                                               │
│ 7. Fonctionnalités Tauri :                                                                                              │
│   - System tray avec indicateur de nouvelles conversations                                                              │
│   - Auto-update via @tauri-apps/plugin-updater                                                                          │
│   - Raccourcis clavier natifs                                                                                           │
│   - Fenêtre redimensionnable, min 800x600                                                                               │
│ 8. Offline — Non prévu V0.03. Messages en cache local pour consultation, mais envoi nécessite connexion.                │
│                                                                                                                         │
│ ---                                                                                                                     │
│ Vérification end-to-end                                                                                                 │
│                                                                                                                         │
│ 1. npx prisma migrate dev — Nouvelles tables + champs                                                                   │
│ 2. npm run api — Backend démarre                                                                                        │
│ 3. Toggle favori sur un agent → vérifier en base + re-fetch                                                             │
│ 4. Créer collection → ajouter agents → vérifier /dashboard/library                                                      │
│ 5. Acheter un agent payant → Stripe Checkout → webhook → Purchase en base                                               │
│ 6. Poster un review (après achat ou interaction) → note recalculée                                                      │
│ 7. Vérifier email reçu (agent approuvé, achat confirmé, nouveau review)                                                 │
│ 8. Page /creators/:id → affiche bio, liens HTTPS, agents publiés                                                        │
│ 9. Recherche avec filtres → résultats cohérents, pagination                                                             │
│ 10. /admin/activity → logs des actions récentes                                                                         │
│ 11. Headers de sécurité → vérifier avec curl -I                                                                         │
│ 12. Rate limiting → tester dépassement sur endpoint auth                                                                │
│                                                                                                                         │
│ ---                                                                                                                     │
│ Alternatives écartées                                                                                                   │
│                                                                                                                         │
│ ┌────────────────────────────────────────────┬───────────────────────────────────────────────────────────────────────┐  │
│ │                Alternative                 │                                Raison                                 │  │
│ ├────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤  │
│ │ Recherche sémantique (embeddings)          │ Coût récurrent par agent, complexité pgvector, recherche par champs   │  │
│ │                                            │ suffisante pour V0.03                                                 │  │
│ ├────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤  │
│ │ Notifications in-app (SSE/WebSocket)       │ Sur-ingénierie, email suffit pour les événements critiques            │  │
│ ├────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤  │
│ │ Event-driven (EventEmitter) pour           │ Complexité ajoutée, appels impératifs plus explicites et traçables    │  │
│ │ logs/notifications                         │                                                                       │  │
│ ├────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤  │
│ │ Queue (BullMQ) pour emails                 │ Latence acceptable en synchrone, pas de volume justifiant une queue   │  │
│ ├────────────────────────────────────────────┼───────────────────────────────────────────────────────────────────────┤  │
│ │ Composants partagés desktop/web via        │ Trop tôt, les composants chat seront dupliqués/adaptés pour Tauri     │  │
│ │ package                                    │                                                                       │  │
│ └────────────────────────────────────────────┴───────────────────────────────────────────────────────────────────────┘  │
╰─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯