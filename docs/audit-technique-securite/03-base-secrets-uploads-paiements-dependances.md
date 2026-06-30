# Audit base de données, secrets, uploads, paiements et dépendances

Périmètre couvert par ce rapport : base de données et modèles sensibles, stockage de secrets et clés API, uploads et stockage fichiers, paiements Stripe/webhooks, dépendances et chaîne d’approvisionnement. Revue réalisée à partir du dépôt local, sans action destructive ni accès à des données réelles. Les valeurs secrètes observées localement ne sont volontairement pas reproduites.

## 1. Synthèse exécutive

Décision pour ce périmètre : **non prêt pour production publique sans corrections préalables**.

Les protections de base existent : authentification sur les routes d’upload et paiement, prix calculé côté backend, signature Stripe vérifiée, chiffrement AES-256-GCM des clés API utilisateur, contraintes Prisma sur plusieurs doublons métier, verrouillage npm centralisé, limite d’upload à 10 Mo et rate limit global.

Les risques majeurs restent toutefois bloquants :

- **Secrets réels ou assimilables présents dans l’environnement local du dépôt** : `backend/.env` contient des variables sensibles Supabase service role, OAuth, Stripe et clé de chiffrement. Même si `.gitignore` exclut `.env`, leur présence dans le workspace exige rotation/assainissement avant toute exposition.
- **Uploads stockés en lecture publique** : `backend/src/modules/uploads/application/upload.service.ts` génère des URLs publiques Supabase pour `agent-files`; `supabase/snippets/storage-policies.sql` confirme une policy `public read`. Les fichiers de chat/agent peuvent contenir données personnelles ou documents confidentiels.
- **Validation de fichiers insuffisante** : contrôle basé sur `file.mimetype` et extension d’origine uniquement, sans vérification de signature magique, antivirus/CDR, détection de contenu actif PDF/GIF ou purge de métadonnées.
- **Webhook paiement incomplet** : signature Stripe vérifiée, mais l’événement `checkout.session.completed` n’est pas recroisé avec `payment_status`, montant, devise, agent courant et statut de l’agent. Les remboursements/annulations/échecs ne sont pas gérés.
- **Modèle de données partiellement robuste mais conservation non formalisée** : pas de politique claire de rétention/suppression pour `ChatMessage`, `UploadedFile`, `apiKeysEncrypted`, achats et logs; soft delete seulement pour `Agent`.
- **Dépendances avec vulnérabilités modérées** : `npm audit --json --workspaces` remonte 12 vulnérabilités modérées, principalement chaîne Expo/mobile, `qs`, `uuid`, `ws`.

## 2. Cartographie des surfaces d’attaque

### Base de données et modèles sensibles

Sources vérifiées :

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/0001_init/migration.sql`
- `backend/prisma/migrations/0002_add_execution_strategy/migration.sql`
- `backend/prisma/migrations/0003_add_fk_soft_delete/migration.sql`
- `backend/prisma/migrations/0004_normalize_collections_pipelines/migration.sql`
- `backend/prisma/migrations/0005_add_runtime_tables_and_columns/migration.sql`
- `supabase/config.toml`

Données sensibles identifiées :

- `User` : `email`, `role`, `adminPermissions`, `stripeAccountId`, `apiKeysEncrypted`, `preferences`, `portfolioLinks`.
- `Agent` : `systemPrompt`, `endpointUrl`, `sellerApiKeyEncrypted`, `sellerApiProvider`, `requiredUserProvider`, `downloadUrl`, `pricingModel`, `price`, statut de publication.
- `Purchase` / `Subscription` : `amount`, `currency`, `stripePaymentId`, `stripeSubId`, liens user/agent.
- `ChatSession` / `ChatMessage` : historique conversationnel et contenus potentiellement personnels/confidentiels.
- `UploadedFile` : URL publique, nom d’origine, MIME, taille, propriétaire, rattachements agent/session/message.
- `ActivityLog` : actions sensibles et métadonnées.

Contraintes positives observées :

- `User.email` unique.
- `Agent.slug` unique; index sur `creatorId`, `category`, `status`, `tags`.
- `Purchase` unique `[userId, agentId]`, limitant les achats dupliqués par agent.
- `Review` et `Favorite` uniques par couple user/agent.
- `CollectionAgent` clé composée `[collectionId, agentId]`.
- FK avec cascades sélectives : `AgentVersion` et `ChatMessage` en cascade; `UploadedFile` en `SetNull` côté agent/session/message.

Points d’exposition :

- Les tables Prisma sont dans le schéma `public`; `supabase/config.toml` expose `public` et `graphql_public` par défaut côté Supabase local. Aucune policy RLS SQL de tables applicatives n’a été trouvée dans le dépôt.
- Le backend utilise Prisma comme autorité d’accès, mais une mauvaise configuration Supabase/PostgREST en production pourrait exposer des tables si RLS/API ne sont pas verrouillées.

### Secrets et clés API

Sources vérifiées :

- `backend/.env` — valeurs sensibles présentes localement, non reproduites.
- `backend/.env.example`
- `backend/.env.production.example`
- `frontendApp/.env`
- `frontendWeb/.env.local`
- `frontendWeb/.env.example`
- `.gitignore`
- `backend/src/app.module.ts`
- `backend/src/common/services/aes-encryption.service.ts`
- `backend/src/modules/users/application/usecases/manage-api-keys.usecase.ts`
- `backend/src/modules/users/infrastructure/repositories/prisma-user.repository.ts`

Constats :

- `.gitignore` exclut `.env` et `.env*.local`, mais `backend/.env`, `frontendApp/.env`, `frontendWeb/.env.local` existent dans le workspace.
- `backend/.env` contient des variables sensibles : `SUPABASE_SERVICE_ROLE_KEY`, secrets OAuth, `ENCRYPTION_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- `backend/.env.example` ne documente pas Stripe alors que `backend/.env.production.example` le fait.
- `validateEnv` dans `backend/src/app.module.ts` exige `DATABASE_URL`, Supabase et `ENCRYPTION_KEY`, mais pas les variables Stripe malgré l’import du module paiement.
- `AesEncryptionService` exige une clé hexadécimale de 64 caractères et utilise AES-256-GCM avec IV 12 octets aléatoire.
- `ManageApiKeysUseCase` chiffre les clés avant stockage et ne retourne qu’un aperçu `début...fin`, mais déchiffre toutes les clés pour les lister afin de calculer l’aperçu.

### Uploads et stockage fichiers

Sources vérifiées :

- `backend/src/modules/uploads/infrastructure/controllers/upload.controller.ts`
- `backend/src/modules/uploads/application/upload.service.ts`
- `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts`
- `backend/src/modules/chat/application/dtos/send-message.dto.ts`
- `supabase/snippets/storage-policies.sql`
- `backend/prisma/schema.prisma`

Flux observé :

1. Route `POST /uploads` protégée par `SupabaseAuthGuard`.
2. `FileInterceptor` en mémoire avec limite `10 * 1024 * 1024`.
3. `UploadService` contrôle l’accès au rattachement agent/session/message.
4. MIME accepté : JPEG, PNG, WebP, GIF, PDF.
5. Stockage Supabase via `SUPABASE_SERVICE_ROLE_KEY` dans bucket `agent-files`.
6. URL publique récupérée via `getPublicUrl` et stockée en table `uploaded_files`.
7. En chat, les `file_ids` doivent appartenir au user et à la session courante ou être sans session.

Surfaces d’attaque :

- Fichiers actifs ou piégés : PDF, GIF, images avec métadonnées.
- Détournement par MIME forgé : la source de vérité est `file.mimetype`.
- Exposition par URL publique permanente.
- Usage de service role backend qui contourne RLS Supabase Storage.
- Uploads en mémoire : limite présente, mais coût RAM potentiel sous rafale.
- Absence de scan antivirus ou sandboxing avant envoi aux modèles IA.

### Paiements et webhooks

Sources vérifiées :

- `backend/src/modules/payments/infrastructure/controllers/payment.controller.ts`
- `backend/src/modules/payments/application/usecases/create-checkout.usecase.ts`
- `backend/src/modules/payments/application/usecases/handle-webhook.usecase.ts`
- `backend/src/modules/payments/application/usecases/check-access.usecase.ts`
- `backend/src/modules/payments/application/usecases/create-connect-account.usecase.ts`
- `backend/src/modules/payments/infrastructure/stripe/stripe.service.ts`
- `backend/src/modules/payments/infrastructure/repositories/prisma-payment.repository.ts`
- `backend/src/modules/chat/application/usecases/create-session.usecase.ts`
- `backend/src/modules/agents/application/usecases/get-agent-download-info.usecase.ts`

Flux observé :

- `POST /payments/checkout` est authentifié; le client ne transmet que `agent_id`.
- Le backend charge l’agent et calcule `priceInCents` depuis `agent.price`.
- Stripe Checkout reçoit `metadata.user_id` et `metadata.agent_id`.
- `POST /payments/webhook` est public, sans throttle, mais vérifie la signature via `constructWebhookEvent`.
- Sur `checkout.session.completed`, le webhook crée un `Purchase` si aucun achat user/agent n’existe.
- L’accès à un agent payant est contrôlé au démarrage de session de chat et au download-info via achat ou abonnement actif.

Surfaces d’attaque :

- Webhook Stripe : événements incomplets, rejoués, incohérents, ou changement de prix/statut entre checkout et webhook.
- Idempotence limitée à `[userId, agentId]`; `stripePaymentId` n’est pas unique.
- Subscriptions présentes dans le modèle, mais flux Stripe subscription/remboursement/annulation non implémentés.
- Stripe Connect partiellement implémenté : onboarding compte vendeur, mais checkout ne transmet pas `creatorStripeAccountId` et `StripeService` ne configure pas `transfer_data`/frais.

### Dépendances et chaîne d’approvisionnement

Sources vérifiées :

- `package.json`
- `package-lock.json`
- `backend/package.json`
- `frontendWeb/package.json`
- `frontendApp/package.json`
- `frontendAppMob/package.json`
- `shared/package.json`

Constats :

- Monorepo npm workspaces avec `package-lock.json` racine.
- Pas de `backend/package-lock.json` dédié, mais verrouillage centralisé effectif.
- Dépendances critiques backend : `@nestjs/*`, `@nestjs/throttler`, `@prisma/client`, `@supabase/supabase-js`, `class-validator`, `helmet`, `sanitize-html`, `stripe`, `multer` transitif via `@nestjs/platform-express`.
- Dépendances de rendu contenu utilisateur côté clients : `react-markdown`, `remark-gfm`; backend a `sanitize-html` et un intercepteur de sanitization hors périmètre détaillé ici.
- `npm audit --json --workspaces --include-workspace-root --audit-level=moderate` a identifié 12 vulnérabilités modérées : chaîne Expo (`expo`, `@expo/*`, `expo-splash-screen`, `xcode`), `qs`, `uuid`, `ws`.

## 3. Liste priorisée des vulnérabilités/faiblesses

| ID | Priorité | Gravité | Faiblesse | Preuves / chemins |
|---|---:|---:|---|---|
| DP-01 | P0 | Critique | Secrets sensibles présents dans le workspace local, dont service role Supabase, Stripe, OAuth et clé de chiffrement. Risque de fuite/usage non autorisé si archivage, partage, logs ou mauvaise manipulation. | `backend/.env`, `.gitignore`, `backend/.env.production.example` |
| DP-02 | P0 | Critique | Fichiers uploadés en lecture publique dans `agent-files`, incluant potentiellement documents de chat. | `upload.service.ts`, `supabase/snippets/storage-policies.sql`, `UploadedFile.url` dans `schema.prisma` |
| DP-03 | P0 | Élevée | Validation upload insuffisante : MIME déclaratif, extension d’origine conservée, pas de sniffing, AV, CDR, purge métadonnées ni blocage contenu actif PDF/GIF. | `upload.service.ts`, `upload.controller.ts` |
| DP-04 | P0 | Élevée | Webhook paiement crée l’achat sans vérifier explicitement `payment_status`, montant attendu, devise attendue, statut actuel de l’agent et cohérence Stripe complète. | `handle-webhook.usecase.ts`, `create-checkout.usecase.ts` |
| DP-05 | P1 | Élevée | `stripePaymentId` non unique et idempotence limitée au couple user/agent; traçabilité paiement incomplète en cas d’événement Stripe dupliqué/croisé. | `schema.prisma` modèle `Purchase`, `prisma-payment.repository.ts` |
| DP-06 | P1 | Élevée | Pas de gestion remboursements, chargebacks, annulations, paiements échoués ou subscriptions Stripe malgré modèle `Subscription`. | `handle-webhook.usecase.ts`, `schema.prisma` |
| DP-07 | P1 | Élevée | Pas de politique de conservation/suppression des chats, fichiers, clés API, logs; soft delete uniquement pour agents. | `schema.prisma`, migrations |
| DP-08 | P1 | Élevée | Supabase public schema exposé par config locale et absence de policies RLS applicatives dans le dépôt; dépendance forte aux contrôles backend/Prisma. | `supabase/config.toml`, absence de policies DB dans `supabase/snippets` |
| DP-09 | P1 | Moyenne | Liste des clés API utilisateur déchiffre chaque clé pour calculer l’aperçu; surface mémoire/log accrue. | `manage-api-keys.usecase.ts` |
| DP-10 | P1 | Moyenne | Variables Stripe non présentes dans la validation d’environnement backend et `.env.example` incomplet. | `app.module.ts`, `backend/.env.example`, `backend/.env.production.example` |
| DP-11 | P2 | Moyenne | Rate limiting global seulement; pas de limites dédiées upload/checkout/chat-webhook hormis webhook volontairement `SkipThrottle`. | `app.module.ts`, `payment.controller.ts`, `upload.controller.ts` |
| DP-12 | P2 | Moyenne | 12 vulnérabilités npm modérées détectées, surtout mobile/Expo et transitives `qs`, `uuid`, `ws`. | `npm audit`, `package-lock.json` |
| DP-13 | P2 | Moyenne | Stripe Connect incomplet : onboarding vendeur existe mais pas de transfert vendeur dans checkout; risque métier/financier plus que sécurité pure. | `create-connect-account.usecase.ts`, `create-checkout.usecase.ts`, `stripe.service.ts` |
| DP-14 | P2 | Moyenne | Pas de tests automatisés trouvés pour paiements et uploads. | absence de `backend/src/modules/payments/**/*.spec.ts`, `backend/src/modules/uploads/**/*.spec.ts` |

## 4. Matrice de risques

| Risque | Gravité | Probabilité | Priorité | Vérification attendue |
|---|---:|---:|---:|---|
| Fuite ou réutilisation des secrets locaux | Critique | Moyenne | Très haute | Rotation des secrets, suppression des `.env` sensibles du workspace partagé, scan Git et CI secrets |
| Lecture publique de documents uploadés | Critique | Moyenne | Très haute | Passer bucket runtime privé, URLs signées courtes, tests d’accès croisé |
| Upload de fichier malveillant ou trompeur | Élevée | Moyenne | Haute | Magic-number sniffing, AV/CDR, refus MIME incohérent, tests fichiers piégés |
| Achat validé sur événement Stripe incomplet/incohérent | Élevée | Faible à moyenne | Haute | Vérifier `payment_status`, montant, devise, metadata, agent publié, session Stripe récupérée côté serveur |
| Rejeu/doublon Stripe mal tracé | Élevée | Moyenne | Haute | Unicité `stripePaymentId`, table webhook events, idempotency key |
| Accès payant contourné par données d’achat incohérentes | Critique | Faible | Haute | Tests achat/sans achat/remboursement/subscription expirée |
| Exposition Supabase/PostgREST des tables public | Critique | Faible à moyenne | Haute | RLS DB explicite ou API Supabase désactivée/restreinte pour tables Prisma |
| Conservation excessive de PII/chat/fichiers | Moyenne | Moyenne | Moyenne | Politique de rétention, suppression utilisateur, purge storage + DB |
| Dépendances vulnérables modérées | Moyenne | Moyenne | Moyenne | Patch `qs`, `ws`, plan upgrade Expo/uuid |
| Absence de tests paiements/uploads | Élevée | Moyenne | Haute | Tests unitaires/intégration webhook, checkout, upload, accès croisé |

## 5. Recommandations

### Secrets et configuration

1. **Rotation immédiate** de toutes les valeurs présentes dans `backend/.env` : Supabase service role, OAuth, Stripe, `ENCRYPTION_KEY` si utilisée avec des données non jetables.
2. Supprimer les `.env` sensibles du workspace partagé; ne conserver que `.env.example` sans valeurs.
3. Ajouter un scan secret en CI : Gitleaks, TruffleHog ou équivalent.
4. Documenter une procédure de rotation `ENCRYPTION_KEY` : versionnage de clé, migration/rechiffrement, fallback lecture ancienne clé, révocation.
5. Compléter `validateEnv` avec les variables effectivement requises par les modules activés, notamment Stripe en production.
6. Aligner `backend/.env.example` avec `backend/.env.production.example` pour éviter une configuration paiement non documentée.

### Uploads

1. Remplacer les URLs publiques par un bucket privé pour les fichiers runtime de chat/upload; générer des URLs signées à durée courte.
2. Séparer buckets : assets publics d’agents vs pièces jointes privées de chat.
3. Contrôler la signature binaire réelle du fichier et comparer avec MIME/extension.
4. Ajouter scan antivirus ou service de désarmement (CDR) pour PDF/images avant stockage exploitable.
5. Supprimer ou neutraliser métadonnées sensibles des images/PDF si le cas d’usage le permet.
6. Ajouter quotas par utilisateur : nombre de fichiers, volume total, upload/minute, taille cumulée par session.
7. Ne pas inclure les messages d’erreur Supabase bruts dans les réponses client; journaliser côté serveur avec corrélation.
8. Valider la cohérence croisée `messageId -> sessionId -> agentId` quand plusieurs paramètres sont fournis.

### Paiements

1. Dans le webhook, vérifier explicitement : type d’événement, `payment_status === paid`, `amount_total`, `currency`, `metadata.user_id`, `metadata.agent_id`, existence et statut publié de l’agent, prix serveur attendu.
2. Récupérer la session Stripe côté serveur si nécessaire avant création d’achat.
3. Ajouter une table `stripe_webhook_events` ou équivalent pour stocker `event.id`, type, hash payload, statut traitement et idempotence.
4. Ajouter contrainte unique sur `Purchase.stripePaymentId` quand non nul, ou table séparée de transactions Stripe.
5. Implémenter les événements `charge.refunded`, `payment_intent.payment_failed`, `checkout.session.expired`, `customer.subscription.*` si subscriptions/remboursements sont dans le modèle économique.
6. Finaliser Stripe Connect : vérifier compte vendeur activé, `transfer_data[destination]`, frais plateforme, devise, pays, KYC.
7. Ajouter limites dédiées à `POST /payments/checkout`; laisser webhook exempté du throttle global mais protéger par signature + monitoring.

### Base de données et rétention

1. Formaliser une politique de rétention : chat, uploads, logs d’activité, clés API supprimées, achats/facturation.
2. Ajouter suppression utilisateur orchestrée : chats, uploads Supabase Storage, clés API, sessions, collections; conserver facturation selon obligations légales.
3. Évaluer chiffrement applicatif ou au repos renforcé pour `ChatMessage.content`, `UploadedFile.url` et métadonnées sensibles si exigence confidentialité.
4. Définir et appliquer RLS Supabase si les tables Prisma résident dans une instance Supabase exposée par PostgREST.
5. Ajouter contraintes de cohérence : `Subscription` unique ou index partiel pour abonnement actif user/agent; unicité Stripe IDs; checks `amount >= 0`, `currency` whitelist.

### Dépendances

1. Corriger `qs` et `ws` via mises à jour compatibles.
2. Planifier upgrade Expo/mobile pour résoudre la chaîne `@expo/*`, `uuid`, `xcode`, `expo-splash-screen`.
3. Ajouter `npm audit --workspaces --audit-level=high` en CI bloquant; suivre modérés via ticketing.
4. Mettre en place Dependabot/Renovate avec regroupement par écosystème.
5. Documenter la source du lockfile racine pour éviter des installations partielles non verrouillées.

## 6. Scénarios de tests de non-régression

### Secrets/configuration

- Démarrer backend sans `ENCRYPTION_KEY` : échec contrôlé au boot.
- Démarrer en production sans `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` : échec contrôlé si paiements activés.
- Scanner le dépôt CI : échec si clé `sk_`, `whsec_`, JWT service role ou clé hex 64 caractères non autorisée apparaît hors fichiers d’exemple.
- Vérifier que `GET /auth/api-keys` ne retourne jamais de clé complète, seulement `id`, provider, label, aperçu.
- Supprimer une clé API utilisateur puis tenter l’usage d’un agent `USER_API_KEY` : refus immédiat.

### Uploads

- Upload non authentifié : refus 401/403.
- Upload fichier > 10 Mo : refus.
- Upload `.jpg` contenant PDF/JS ou MIME forgé : refus après magic-number sniffing.
- Upload PDF avec contenu actif/macro/script : quarantaine/refus selon politique.
- Utilisateur A tente de lister/supprimer fichier de session de B : refus.
- Utilisateur A tente de joindre `file_id` de B dans chat : refus.
- URL publique ancienne après suppression fichier : inaccessible.
- Test quota : rafale de 50 uploads/minute pour un user standard : throttling dédié.

### Paiements

- Checkout non authentifié : refus.
- Checkout agent gratuit : refus métier contrôlé.
- Client modifie montant/devise côté requête : ignoré, prix serveur utilisé.
- Webhook sans signature ou signature invalide : refus.
- Webhook `checkout.session.completed` avec `payment_status != paid` : aucun achat créé.
- Webhook montant/devise incohérents avec agent : aucun achat créé + alerte.
- Webhook rejoué même `event.id` : traité une seule fois.
- Webhook avec même `stripePaymentId` pour autre user/agent : refus.
- Paiement remboursé : accès agent payant révoqué ou statut conforme à règle métier.
- Agent non publié/suspendu au moment du webhook : achat non activé ou mis en attente.
- Utilisateur sans achat tente `POST /chat/sessions` sur agent payant : refus.
- Utilisateur avec achat valide tente `POST /chat/sessions` : succès.

### Base de données/rétention

- Suppression utilisateur de test : chats supprimés/anonymisés, fichiers storage supprimés, clés API supprimées, achats conservés/anonymisés selon politique.
- Soft delete agent : absent des listings publics et impossible à acheter/exécuter.
- Création double achat user/agent : contrainte unique maintenue.
- Création double abonnement actif user/agent : refus après ajout contrainte.
- Accès direct Supabase REST aux tables Prisma avec anon key : refus par RLS ou API désactivée.

### Dépendances

- CI exécute `npm ci` puis `npm audit --workspaces --audit-level=high`.
- Tests clients Markdown avec liens `javascript:`, HTML brut et images externes : rendu sûr.
- Mise à jour `qs/ws` : tests smoke backend/frontend/mobile.

## 7. Décision de préparation production

Pour le périmètre base/secrets/uploads/paiements/dépendances : **non prêt**.

Critères bloquants avant exposition publique :

- Rotation/assainissement des secrets observés dans le workspace.
- Passage des fichiers runtime privés ou URLs signées avec expiration.
- Renforcement validation/scan uploads.
- Webhook Stripe complet, idempotent et testé.
- Politique de rétention et suppression des données sensibles.
- Tests automatisés paiements/uploads/accès croisé.

Un passage à **prêt sous conditions** serait envisageable après correction de DP-01 à DP-06 et ajout des tests critiques associés. La correction des vulnérabilités npm modérées et de la rétention peut être planifiée court terme, mais doit être documentée et acceptée explicitement si mise en production progressive.

## 8. Actions court terme et moyen terme

### Court terme — 0 à 2 semaines

1. Révoquer/rotater tous les secrets présents dans `backend/.env`; supprimer les `.env` sensibles des environnements partagés.
2. Ajouter scan secrets CI + hooks pré-commit recommandés.
3. Rendre privés les uploads runtime ou introduire URLs signées courtes.
4. Ajouter tests unitaires/intégration upload : ownership, taille, MIME incohérent, suppression storage.
5. Ajouter tests webhook Stripe : signature, replay, montant/devise/statut, idempotence.
6. Renforcer `handle-webhook.usecase.ts` avec validations Stripe complètes.
7. Ajouter unicité/idempotence Stripe au modèle de données.
8. Mettre à jour `backend/.env.example` et `validateEnv`.
9. Corriger `qs`/`ws` si possible sans rupture.

### Moyen terme — 1 à 3 mois

1. Mettre en place antivirus/CDR et pipeline de quarantaine fichiers.
2. Formaliser rétention RGPD : chats, fichiers, logs, clés API, achats.
3. Implémenter suppression/anonymisation utilisateur complète.
4. Ajouter RLS Supabase ou désactiver l’exposition REST des tables applicatives si Supabase héberge la DB.
5. Finaliser flux Stripe Connect et subscriptions/remboursements selon modèle économique.
6. Mettre en place surveillance abus : pics upload, checkout répétés, webhooks anormaux, coûts IA liés aux fichiers.
7. Déployer Renovate/Dependabot et tableau de suivi vulnérabilités.
8. Revoir chiffrement de données sensibles au repos, dont conversations et URLs fichiers.

## 9. Limites de l’audit

- Aucun appel à des services réels Supabase/Stripe n’a été effectué.
- Aucun fichier réel n’a été uploadé; aucun webhook réel n’a été envoyé.
- L’audit dynamique s’est limité à `npm audit` local non destructif.
- Les valeurs secrètes observées localement ont été volontairement masquées et ne sont pas recopiées dans ce rapport.
