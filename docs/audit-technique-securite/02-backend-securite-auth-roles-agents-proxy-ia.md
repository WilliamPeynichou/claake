# Audit sécurité backend, authentification, rôles, agents, proxy et IA

## 1. Synthèse exécutive

Le backend NestJS présente une base de sécurité structurée : validation globale des DTO, CORS différencié développement/production, en-têtes Helmet, garde d’authentification Supabase, rôles issus de la base comme source d’autorité après création du profil, permissions administrateur fines, chiffrement AES-256-GCM des clés API et contrôles de propriété sur les agents, sessions de chat, fichiers et collections.

Cependant, l’exposition publique ne doit pas être considérée comme prête sans corrections. Les principaux risques côté backend portent sur :

- **SSRF résiduel sur les endpoints vendeurs et URLs de configuration** : les validations bloquent plusieurs IP privées explicites, mais ne résolvent pas le DNS et ne couvrent pas toutes les représentations/évolutions d’adresses privées.
- **Propagation d’erreurs de fournisseurs IA vers le client** : les messages d’erreur bruts des endpoints externes peuvent être renvoyés dans le flux de chat.
- **Limites insuffisamment spécialisées** : le throttling global `100/min` ne suffit pas pour chat, upload, paiement, création d’agents, clés API et endpoints externes.
- **Validation incomplète des contenus utilisateurs longs** : plusieurs champs d’agents n’ont pas de `MaxLength`, limites d’array ou taille maximale de configuration distante.
- **Flux IA et fichiers** : les fichiers uploadés sont stockés en URL publique et transmis à des modèles externes selon les agents, sans garde-fous de confidentialité/documentation suffisants dans le backend.
- **Traçabilité partielle** : les changements de rôle, clés API, uploads et actions sensibles ne sont pas tous journalisés.

**Décision backend proposée : non prêt pour production publique large.** Le projet peut viser un environnement pilote contrôlé après correction des points critiques SSRF/proxy, erreurs, rate limiting et tests de non-régression associés.

## 2. Périmètre et fichiers examinés

Fichiers backend importants vérifiés :

- Bootstrap/configuration : `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/package.json`.
- Authentification/rôles : `backend/src/common/guards/supabase-auth.guard.ts`, `backend/src/common/guards/optional-supabase-auth.guard.ts`, `backend/src/common/guards/roles.guard.ts`, `backend/src/common/guards/admin-permission.guard.ts`, `backend/src/common/auth/role-normalization.ts`, `backend/src/modules/users/infrastructure/controllers/user.controller.ts`, `backend/src/modules/users/application/usecases/update-user-role.usecase.ts`.
- Agents : `backend/src/modules/agents/infrastructure/controllers/agent.controller.ts`, `backend/src/modules/agents/application/dtos/create-agent.dto.ts`, `backend/src/modules/agents/application/dtos/update-agent.dto.ts`, `backend/src/modules/agents/application/usecases/create-agent.usecase.ts`, `backend/src/modules/agents/application/usecases/update-agent.usecase.ts`, `backend/src/modules/agents/application/usecases/validate-agent.usecase.ts`, `backend/src/modules/agents/application/usecases/review-agent.usecase.ts`, `backend/src/modules/agents/infrastructure/repositories/prisma-agent.repository.ts`.
- Chat/IA/proxy : `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts`, `backend/src/modules/chat/application/usecases/create-session.usecase.ts`, `backend/src/modules/chat/application/usecases/send-message.usecase.ts`, `backend/src/modules/chat/application/services/execution-strategy.resolver.ts`, `backend/src/modules/chat/infrastructure/providers/endpoint-proxy.provider.ts`, `backend/src/modules/chat/infrastructure/providers/openai.provider.ts`, `backend/src/modules/chat/infrastructure/providers/anthropic.provider.ts`, `backend/src/modules/chat/application/dtos/send-message.dto.ts`.
- Uploads liés au chat/agents : `backend/src/modules/uploads/infrastructure/controllers/upload.controller.ts`, `backend/src/modules/uploads/application/upload.service.ts`.
- Paiements/access control : `backend/src/modules/payments/infrastructure/controllers/payment.controller.ts`, `backend/src/modules/payments/application/usecases/create-checkout.usecase.ts`, `backend/src/modules/payments/application/usecases/check-access.usecase.ts`, `backend/src/modules/payments/application/usecases/handle-webhook.usecase.ts`, `backend/src/modules/payments/infrastructure/stripe/stripe.service.ts`.
- Logs/erreurs/sanitisation : `backend/src/common/filters/all-exceptions.filter.ts`, `backend/src/common/interceptors/logging.interceptor.ts`, `backend/src/common/interceptors/sanitize.interceptor.ts`, `backend/src/modules/activity/infrastructure/controllers/activity.controller.ts`.
- Modèle de données : `backend/prisma/schema.prisma`.
- Tests consultés/exécutés : `backend/src/modules/chat/infrastructure/providers/endpoint-proxy.provider.spec.ts`, `backend/src/modules/agents/application/usecases/update-agent.usecase.spec.ts`, `backend/src/modules/chat/application/usecases/get-session-messages.usecase.spec.ts`.

Vérification dynamique non destructive réalisée :

```bash
cd backend
npm test -- --runInBand src/modules/chat/infrastructure/providers/endpoint-proxy.provider.spec.ts src/modules/agents/application/usecases/update-agent.usecase.spec.ts src/modules/chat/application/usecases/get-session-messages.usecase.spec.ts
```

Résultat : **3 suites passées, 25 tests passés**.

## 3. Cartographie des surfaces d’attaque backend

### 3.1 API publiques ou semi-publiques

- `GET /v1/agents` et `GET /v1/agents/:id` : accès public avec authentification optionnelle via `OptionalSupabaseAuthGuard`; filtre les agents non approuvés sauf créateur/admin (`backend/src/modules/agents/infrastructure/controllers/agent.controller.ts`).
- `GET /v1/categories`, `GET /health`, `GET /v1/creators/:id`, `GET /v1/agents/:agentId/reviews` : surfaces de lecture publiques.
- `POST /v1/payments/webhook` : endpoint webhook Stripe sans auth utilisateur, protégé par signature Stripe (`backend/src/modules/payments/infrastructure/controllers/payment.controller.ts`, `stripe.service.ts`).

### 3.2 API authentifiées

- Profil et clés API : `/v1/auth/profile`, `/v1/auth/api-keys`.
- Agents créateur : création, mise à jour, suppression, dépublication, download info.
- Chat : création/listing/suppression de sessions, lecture/envoi de messages.
- Uploads : upload mémoire vers Supabase Storage, listing par agent/session, suppression.
- Paiements : checkout, achats, accès, onboarding Stripe Connect.
- Collections/favoris/reviews.

### 3.3 Administration

- `GET /v1/users`, `PATCH /v1/users/:id/role`.
- `PATCH /v1/agents/:id/review`.
- `GET /v1/stats/admin`, `GET /v1/admin/activity`.
- Contrôles : `SupabaseAuthGuard`, `RolesGuard`, `AdminPermissionGuard`, décorateurs `@Roles` et `@RequirePermission`.

### 3.4 Flux IA et endpoints externes

- `SELLER_ENDPOINT` : proxy backend vers URL fournie par un créateur d’agent (`EndpointProxyProvider`).
- `SELLER_API_KEY` : clé vendeur chiffrée puis déchiffrée côté serveur pour appeler OpenAI/Anthropic compatible.
- `USER_API_KEY` : clé API utilisateur chiffrée en base puis déchiffrée côté serveur selon provider.
- Uploads multimodaux : URLs publiques de fichiers injectées dans les messages envoyés aux fournisseurs IA.

### 3.5 Données sensibles manipulées

- Jetons Supabase reçus en `Authorization`.
- Rôles et permissions administrateur.
- Clés API utilisateurs/vendeurs chiffrées.
- Prompts système, prompts agents, historique de chat.
- URLs de fichiers uploadés et documents PDF/images.
- Données de paiement Stripe, achats, identifiants Stripe.
- Logs d’activité admin.

## 4. Liste priorisée des vulnérabilités et faiblesses

### BSEC-01 — SSRF résiduel sur endpoints vendeurs et URLs de configuration

- **Gravité : critique** ; **probabilité : moyenne** ; **priorité : très haute**.
- **Constat** : `IsPublicUrl` et `EndpointProxyProvider.validateUrl()` bloquent `localhost`, plusieurs plages IPv4 privées et certaines IPv6 dans le validateur DTO, mais ne résolvent pas le DNS avant connexion et ne valident pas l’IP effective. Une URL publique contrôlée par un attaquant peut résoudre vers une IP interne, changer par DNS rebinding, ou utiliser des formes non couvertes selon le runtime URL/DNS.
- **Fichiers** : `backend/src/common/validators/is-public-url.validator.ts`, `backend/src/modules/chat/infrastructure/providers/endpoint-proxy.provider.ts`, `backend/src/modules/agents/application/usecases/validate-agent.usecase.ts`.
- **Impact** : relais vers métadonnées cloud, services internes, ports non exposés, exfiltration indirecte via erreurs/réponses.

### BSEC-02 — Erreurs fournisseurs IA/proxy renvoyées brutes dans le flux de chat

- **Gravité : élevée** ; **probabilité : moyenne** ; **priorité : haute**.
- **Constat** : `EndpointProxyProvider`, `OpenAIProvider` et `AnthropicProvider` construisent des erreurs contenant le corps de réponse externe. `ChatController.sendMsg()` écrit `err.message` dans le stream (`3:<message>`).
- **Fichiers** : `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts`, `backend/src/modules/chat/infrastructure/providers/endpoint-proxy.provider.ts`, `backend/src/modules/chat/infrastructure/providers/openai.provider.ts`, `backend/src/modules/chat/infrastructure/providers/anthropic.provider.ts`.
- **Impact** : fuite d’informations internes ou fournisseur, détails de configuration, messages verbeux non destinés au client, possible divulgation indirecte si un endpoint vendeur reflète des secrets.

### BSEC-03 — Rate limiting trop générique pour les routes à coût élevé

- **Gravité : élevée** ; **probabilité : moyenne** ; **priorité : haute**.
- **Constat** : un throttling global `100/min` est défini dans `backend/src/app.module.ts`, mais aucune limite spécifique n’est appliquée à `POST /chat/sessions/:id/messages`, upload, checkout, création d’agent, ajout de clés API. Le webhook Stripe est exclu du throttling, ce qui se justifie opérationnellement mais doit être compensé par surveillance/replay/idempotence renforcée.
- **Fichiers** : `backend/src/app.module.ts`, `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts`, `backend/src/modules/uploads/infrastructure/controllers/upload.controller.ts`, `backend/src/modules/payments/infrastructure/controllers/payment.controller.ts`, `backend/src/modules/users/infrastructure/controllers/user.controller.ts`.
- **Impact** : coût IA excessif, saturation mémoire via uploads, abus checkout/webhook, DoS applicatif.

### BSEC-04 — Champs agents/prompts insuffisamment bornés

- **Gravité : élevée** ; **probabilité : moyenne** ; **priorité : haute**.
- **Constat** : `CreateAgentDto` et `UpdateAgentDto` valident les types mais sans `MaxLength` sur `name`, `slug`, `description`, `long_description`, `system_prompt`, `seller_api_provider`, `required_user_provider`, `docker_image`, ni taille maximale des tableaux `tags`/`models`. `validate-agent.usecase.ts` télécharge le `configUrl` avec timeout mais sans limite stricte de taille avant `res.text()`.
- **Fichiers** : `backend/src/modules/agents/application/dtos/create-agent.dto.ts`, `backend/src/modules/agents/application/dtos/update-agent.dto.ts`, `backend/src/modules/agents/application/usecases/validate-agent.usecase.ts`.
- **Impact** : abus stockage/base, coûts de validation, entrées longues propagées aux modèles IA, risques de disponibilité.

### BSEC-05 — Initialisation de rôle à partir de `app_metadata` Supabase lors du premier login

- **Gravité : élevée** ; **probabilité : faible à moyenne selon gouvernance Supabase** ; **priorité : haute**.
- **Constat** : les guards créent automatiquement l’utilisateur local avec le rôle normalisé depuis `user.app_metadata?.role`. Ensuite la base locale devient source d’autorité, ce qui est positif. Mais le premier provisionnement peut créer un `ADMIN`/`SUPER_ADMIN` si l’app metadata Supabase est erronée ou compromise.
- **Fichiers** : `backend/src/common/guards/supabase-auth.guard.ts`, `backend/src/common/guards/optional-supabase-auth.guard.ts`, `backend/src/common/auth/role-normalization.ts`.
- **Impact** : élévation de privilège initiale si la source Supabase metadata n’est pas strictement contrôlée.

### BSEC-06 — Webhooks paiement : idempotence partielle mais contrôles métier à renforcer

- **Gravité : élevée** ; **probabilité : faible à moyenne** ; **priorité : haute**.
- **Constat** : la signature Stripe est vérifiée et l’achat n’est créé qu’en absence de couple `userId/agentId`, ce qui limite les replays. En revanche, le webhook ne compare pas explicitement le montant, la devise, le statut de paiement et l’agent courant avant création d’achat.
- **Fichiers** : `backend/src/modules/payments/application/usecases/handle-webhook.usecase.ts`, `backend/src/modules/payments/application/usecases/create-checkout.usecase.ts`, `backend/src/modules/payments/infrastructure/stripe/stripe.service.ts`, `backend/prisma/schema.prisma`.
- **Impact** : incohérence métier en cas de metadata altérée, session inattendue ou changement de prix/agent entre checkout et webhook.

### BSEC-07 — Uploads : validation MIME déclarative et exposition publique des fichiers

- **Gravité : élevée** ; **probabilité : moyenne** ; **priorité : haute**.
- **Constat** : le backend limite taille et MIME déclaré, mais ne vérifie pas la signature du fichier, ne scanne pas les contenus, ne retire pas les métadonnées et stocke dans un bucket prévu en lecture publique (`agent-files`). Les contrôles de propriété sont présents avant association agent/session/message.
- **Fichiers** : `backend/src/modules/uploads/application/upload.service.ts`, `backend/src/modules/uploads/infrastructure/controllers/upload.controller.ts`.
- **Impact** : upload de contenu actif/dangereux ou confidentiel exposé via URL publique ; fuite possible vers fournisseurs IA lors du chat.

### BSEC-08 — Fournisseurs IA directs sans timeout/taille de réponse explicites

- **Gravité : moyenne à élevée** ; **probabilité : moyenne** ; **priorité : moyenne à haute**.
- **Constat** : `EndpointProxyProvider` applique timeout et taille maximale de réponse. `OpenAIProvider` et `AnthropicProvider` n’ont pas de `AbortSignal.timeout`, ni compteur de taille pour le stream.
- **Fichiers** : `backend/src/modules/chat/infrastructure/providers/openai.provider.ts`, `backend/src/modules/chat/infrastructure/providers/anthropic.provider.ts`.
- **Impact** : connexions longues, consommation mémoire/CPU, erreurs non bornées en cas de fournisseur lent ou incident.

### BSEC-09 — Journalisation incomplète des actions sensibles

- **Gravité : moyenne** ; **probabilité : élevée** ; **priorité : moyenne**.
- **Constat** : des logs d’activité existent pour l’approbation/rejet d’agents et création d’achat, mais pas systématiquement pour changement de rôle, gestion des clés API, upload/suppression de fichiers, suppression/dépublication d’agent, échec webhook critique.
- **Fichiers** : `backend/src/modules/activity/domain/activity-log.service.ts`, `backend/src/modules/agents/application/usecases/review-agent.usecase.ts`, `backend/src/modules/users/application/usecases/update-user-role.usecase.ts`, `backend/src/modules/users/application/usecases/manage-api-keys.usecase.ts`.
- **Impact** : faible capacité d’investigation en cas d’abus ou incident.

### BSEC-10 — Pagination/paramètres numériques non bornés sur certaines routes

- **Gravité : moyenne** ; **probabilité : moyenne** ; **priorité : moyenne**.
- **Constat** : plusieurs contrôleurs convertissent `limit/offset/page` avec `Number()` ou `parseInt()` sans DTO borné. `ListAgentsUseCase` borne à `100`, mais `listSessions`, `getMessages`, activité et reviews doivent être vérifiés/normalisés systématiquement.
- **Fichiers** : `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts`, `backend/src/modules/activity/infrastructure/controllers/activity.controller.ts`, `backend/src/modules/reviews/infrastructure/controllers/review.controller.ts`.
- **Impact** : requêtes volumineuses, erreurs Prisma, dégradation de performance.

## 5. Matrice de risques

| ID | Risque | Gravité | Probabilité | Priorité | Fichiers clés | Vérification attendue |
|---|---|---:|---:|---:|---|---|
| BSEC-01 | SSRF via endpoint vendeur/config URL | Critique | Moyenne | Très haute | `is-public-url.validator.ts`, `endpoint-proxy.provider.ts`, `validate-agent.usecase.ts` | Résolution DNS + blocage IP effective privée, tests DNS rebinding/IPv6/encodages |
| BSEC-02 | Fuite d’erreurs fournisseurs IA | Élevée | Moyenne | Haute | `chat.controller.ts`, providers IA | Réponses client génériques, logs serveur redigés |
| BSEC-03 | Abus coût/DoS par absence de limites spécifiques | Élevée | Moyenne | Haute | `app.module.ts`, contrôleurs chat/upload/payment/users | Throttles par route et quotas utilisateur |
| BSEC-04 | Payload agents/prompts trop longs | Élevée | Moyenne | Haute | DTO agents, `validate-agent.usecase.ts` | MaxLength/ArrayMaxSize et taille max téléchargement config |
| BSEC-05 | Provisionnement initial de rôles depuis Supabase metadata | Élevée | Faible-Moyenne | Haute | guards Supabase | Création toujours `USER` sauf procédure admin contrôlée |
| BSEC-06 | Paiement validé sans recoupement complet | Élevée | Faible-Moyenne | Haute | webhook/checkout Stripe | Vérifier paiement payé, montant, devise, agent, event ID |
| BSEC-07 | Upload dangereux/public | Élevée | Moyenne | Haute | `upload.service.ts` | Magic bytes, AV, bucket privé/signé, politique rétention |
| BSEC-08 | Streams IA sans timeout/taille | Moyenne-Élevée | Moyenne | Moyenne-Haute | providers OpenAI/Anthropic | AbortSignal, limite bytes/tokens, annulation propre |
| BSEC-09 | Traçabilité incomplète | Moyenne | Élevée | Moyenne | activity/users/uploads/payments | Logs structurés pour actions sensibles |
| BSEC-10 | Pagination non bornée | Moyenne | Moyenne | Moyenne | chat/activity/reviews | DTO de pagination bornés et tests |

## 6. Recommandations

### 6.1 Authentification, rôles et administration

1. Ne plus attribuer `ADMIN` ou `SUPER_ADMIN` automatiquement depuis `app_metadata` lors de la création locale ; créer tout nouvel utilisateur en `USER`, puis promouvoir via route super-admin ou script d’amorçage hors ligne.
2. Ajouter un log d’activité pour `PATCH /users/:id/role` avec ancien rôle, nouveau rôle, acteur, cible et permissions admin.
3. Ajouter des tests e2e sur : utilisateur standard vers routes admin, admin sans permission fine, admin vers route super-admin, super-admin valide.
4. Documenter une procédure de bootstrap du premier super-admin et une procédure de révocation.

### 6.2 Agents et validation

1. Ajouter `MaxLength`, `ArrayMaxSize`, `IsUUID`/formats stricts lorsque possible : `name`, `slug`, `description`, `long_description`, `system_prompt`, `tags`, `models`, providers, `docker_image`.
2. Limiter la taille téléchargée depuis `config_url` avant lecture en mémoire ; refuser au-delà d’un seuil court.
3. Ne pas considérer le scan regex de `ValidateAgentUseCase` comme suffisant : maintenir revue manuelle obligatoire pour agents à endpoint externe, clé vendeur ou prompts système sensibles.
4. Revalider automatiquement un agent après modification d’un `DRAFT/REJECTED` avant soumission/approbation.

### 6.3 Proxy endpoints externes et SSRF

1. Résoudre le DNS côté serveur, vérifier chaque IP retournée contre toutes les plages privées/link-local/loopback/multicast/réservées, y compris IPv6, puis connecter à l’IP validée ou revérifier juste avant la requête.
2. Bloquer HTTP en production sauf justification forte ; préférer HTTPS obligatoire.
3. Ajouter allowlist optionnelle par domaine ou vérification manuelle renforcée pour `SELLER_ENDPOINT`.
4. Maintenir `redirect: "error"`, déjà présent, et ajouter tests de redirection, DNS rebinding, IPv6, IP décimale/octal/hex si le runtime les accepte.
5. Remplacer les erreurs client par un message générique : « endpoint externe indisponible » ; conserver détail redigé uniquement en logs serveur.

### 6.4 Chat, IA et coûts

1. Ajouter throttling spécifique sur `POST /chat/sessions/:id/messages` et quotas par utilisateur/agent/plan.
2. Ajouter timeout et taille maximale de stream dans `OpenAIProvider` et `AnthropicProvider`, cohérents avec `EndpointProxyProvider`.
3. Ajouter limites du nombre de pièces jointes par message et taille cumulée, pas seulement taille par fichier.
4. Clarifier dans la réponse/API que les documents attachés peuvent être transmis au fournisseur IA sélectionné.
5. Masquer les erreurs détaillées dans le stream de réponse.

### 6.5 Uploads

1. Vérifier les magic bytes et l’extension réelle ; refuser incohérences MIME/extension.
2. Utiliser un bucket privé et des URLs signées à durée courte, ou compartimenter les fichiers publics d’agents des fichiers privés de chat.
3. Ajouter antivirus/sandbox ou au minimum désactivation de rendu direct pour documents à risque.
4. Supprimer métadonnées sensibles des images/documents lorsque possible.
5. Définir politique de suppression/rétention et suppression effective en cascade ou job d’entretien.

### 6.6 Paiements/webhooks

1. Persister l’ID d’événement Stripe et refuser les replays explicites.
2. Vérifier `payment_status === paid`, montant/devise attendus, agent existant et non supprimé, prix serveur courant ou prix figé en metadata.
3. Ajouter journaux d’échec webhook sans données sensibles.
4. Tester le scénario agent payant non approuvé/supprimé entre checkout et webhook.

### 6.7 Observabilité et erreurs

1. Rediger tokens, clés API, prompts sensibles et URLs signées des logs.
2. Journaliser actions sensibles : rôle, permissions, clés API, upload/suppression, dépublication/suppression agent, paiements.
3. Ajouter alertes sur rafales chat/upload/webhook, erreurs proxy, refus SSRF et tentatives admin interdites.

## 7. Scénarios de tests de non-régression

### 7.1 Authentification et rôles

- Requête sans `Authorization` vers `/v1/chat/sessions` → `401`.
- Token expiré ou mal formé vers route privée → `401`.
- Utilisateur standard vers `/v1/users` → `403`.
- Admin sans `canManageUsers` vers `/v1/users` → `403`.
- Admin simple vers `PATCH /v1/users/:id/role` → `403`.
- Super-admin change un rôle non super-admin → succès et log d’activité.
- Premier login avec `app_metadata.role=SUPER_ADMIN` ne doit pas créer localement un super-admin après correction.

### 7.2 Agents et propriété

- Créateur modifie son agent `DRAFT` → succès.
- Créateur tente de modifier agent `APPROVED` ou `PENDING` → refus.
- Utilisateur A tente de modifier/supprimer/dépublier agent de B → `403`.
- `GET /v1/agents?all=true` utilisateur standard → `403`.
- Agent avec `system_prompt` très long → rejet DTO.
- Agent avec `endpoint_url` privée, IPv6 locale, domaine résolvant vers IP privée → rejet.
- Agent `REJECTED/SUSPENDED` ne peut pas être exécuté ni acheté.

### 7.3 Proxy et IA

- `SELLER_ENDPOINT` vers `127.0.0.1`, `10.0.0.1`, `169.254.169.254`, `[::1]`, `fc00::/7`, domaine DNS vers privé → rejet.
- Endpoint externe retournant une erreur contenant un faux secret → client reçoit message générique, log serveur redigé.
- Endpoint lent > timeout → arrêt propre et message générique.
- Réponse SSE > limite → coupure et log sécurité.
- OpenAI/Anthropic timeout simulé → pas de stream infini.

### 7.4 Chat et données croisées

- Utilisateur A lit messages session B → `403`.
- Utilisateur A envoie message dans session B → `403`.
- Création session sur agent `PENDING`, `REJECTED`, `SUSPENDED` → rejet.
- Création session sur agent payant sans achat → `403`.
- Message > 10 000 caractères → rejet.
- Trop de pièces jointes ou fichiers non liés à l’utilisateur → rejet.

### 7.5 Uploads

- Upload sans auth → `401`.
- Upload > 10 Mo → rejet.
- Fichier `.jpg` avec contenu PDF ou exécutable → rejet après magic bytes.
- Utilisateur A liste/supprime fichier session B → `403` ou refus.
- URL de fichier privé expirée après délai attendu.

### 7.6 Paiements

- Checkout pour agent gratuit → rejet.
- Checkout pour agent payant utilise prix serveur, indépendamment de paramètres client.
- Webhook sans signature ou signature invalide → `400`.
- Webhook répété même event ID → pas de double achat.
- Webhook avec montant/devise incohérents → rejet/log.
- Accès agent payant sans achat/subscription → `false`/`403` selon endpoint.

### 7.7 Limites et abus

- Rafale sur chat → `429` avant coût fournisseur.
- Rafale upload → `429` et aucune saturation mémoire.
- Rafale ajout clé API → `429`.
- Pagination `limit=100000` → bornée à un maximum sûr.

## 8. Décision de préparation production

**Décision backend : non prêt en l’état pour une production publique large.**

Motifs :

- Risque SSRF résiduel sur les endpoints externes et fichiers de configuration distants.
- Erreurs externes encore susceptibles d’être exposées au client.
- Absence de quotas/rate limits adaptés aux routes coûteuses.
- Contrôles de taille incomplets sur agents/prompts/configs.
- Uploads publics et validation fichier insuffisante pour des contenus utilisateurs.
- Traçabilité sécurité encore partielle.

Une **préparation production sous conditions** peut être envisagée pour un pilote fermé si les conditions minimales suivantes sont remplies :

1. Corriger SSRF avec résolution DNS/IP effective et tests associés.
2. Masquer toutes les erreurs fournisseur/proxy côté client.
3. Mettre en place des limites par route sur chat/upload/checkout/agents/clés API.
4. Ajouter bornes DTO et taille maximale de téléchargement `config_url`.
5. Ajouter tests e2e des accès croisés et rôles admin.
6. Formaliser la stratégie uploads privés/publics.

## 9. Actions court terme et moyen terme

### Court terme — avant exposition publique

- [ ] Remplacer le provisionnement initial des rôles depuis `app_metadata` par `USER` par défaut.
- [ ] Renforcer `IsPublicUrl` et `EndpointProxyProvider.validateUrl()` par résolution DNS et blocage IP effective.
- [ ] Ajouter messages d’erreur client génériques pour IA/proxy ; logs serveur redigés.
- [ ] Ajouter throttles spécifiques : chat, upload, checkout, agent create/update, clés API.
- [ ] Borner DTO agents, providers et pagination.
- [ ] Limiter taille de réponse de `config_url` et de tous les streams IA.
- [ ] Ajouter tests e2e auth/rôles/ownership et tests SSRF avancés.
- [ ] Vérifier webhooks Stripe : statut payé, montant, devise, event ID.
- [ ] Journaliser changements de rôle et actions clés API.

### Moyen terme — durcissement durable

- [ ] Mettre en place bucket privé/signé pour fichiers de chat et politique de rétention.
- [ ] Ajouter antivirus/sandbox ou pipeline de validation fichiers.
- [ ] Ajouter quotas par utilisateur/plan et monitoring coût IA.
- [ ] Formaliser revue manuelle obligatoire des agents `SELLER_ENDPOINT`/`SELLER_API_KEY`.
- [ ] Mettre en place rotation de `ENCRYPTION_KEY` avec versionnement des clés chiffrées.
- [ ] Ajouter alertes de sécurité : refus SSRF, rafales, webhooks invalides, erreurs IA anormales.
- [ ] Étendre l’activité log aux suppressions, dépublications, uploads, paiements et clés API.
- [ ] Planifier revue périodique dépendances et audit des providers IA.
