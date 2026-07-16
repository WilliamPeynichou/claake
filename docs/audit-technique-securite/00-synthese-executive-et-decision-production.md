# Synthèse exécutive consolidée et décision de préparation production

> **Mise à jour 2026-07-16 :** constats P0/P1 ci-dessous = état audit initial. Résolution et
> acceptations : `cloture-phase-b-p0-p1.md`. Phase B code fermée ; staging, rotation fournisseur
> et E2E live restent gates obligatoires avant beta.

> Livrable consolidé du plan d’audit technique et sécuritaire.
> Source : rapports détaillés `audit-technique-securite/01-*`, `02-*`, `03-*`, `04-*` et exploration statique/dynamique non destructive du dépôt local.
> Aucun code applicatif ni donnée réelle n’a été modifié.

## 1. Synthèse exécutive

Le projet Claake repose sur une architecture monorepo cohérente : backend NestJS/Prisma/Supabase/Stripe, frontend web Next.js, application desktop Tauri/Vite, application mobile Expo et paquet partagé `@claake/shared`. Le backend est globalement conçu comme source d’autorité pour les permissions et règles métier : validation DTO globale, guards Supabase, rôles/permissions backend, chiffrement AES-256-GCM des clés API, contrôles de propriété sur plusieurs ressources et webhook Stripe signé.

Malgré ces fondations positives, l’audit conclut à une décision consolidée : **non prêt pour une production publique large**. Les risques résiduels touchent directement les zones prioritaires du plan : auth/rôles, agents publiés, proxy IA, uploads, paiements, secrets, dépendances et tests.

Les blocages majeurs sont :

1. **Risque SSRF résiduel** sur endpoints vendeurs et URLs de configuration : validation URL présente mais sans résolution DNS/IP effective complète.
2. **Secrets sensibles présents dans le workspace local** (`backend/.env`, valeurs volontairement non reproduites) nécessitant rotation/assainissement.
3. **Uploads runtime en lecture publique** via Supabase Storage, validation fichier insuffisante et absence de scan/quarantaine.
4. **Webhook Stripe incomplet** : signature vérifiée, mais recoupements paiement/montant/devise/statut/idempotence à renforcer.
5. **Absence de tests automatisés clients et couverture insuffisante des flux critiques** : aucun test `frontendWeb`, `frontendApp`, `frontendAppMob`, `shared`; e2e absents.
6. **Rate limiting trop générique** pour chat, upload, paiement, agents, clés API et coûts IA.
7. **Interfaces non durcies** : risque d’open redirect post-auth, fallbacks API localhost, desktop Tauri minimal, mobile mocké.
8. **Dépendances et qualité CI à corriger** : `npm run lint` en échec, `npm audit` signale 12 vulnérabilités modérées.

Une mise en pilote contrôlé peut être envisagée uniquement après correction des P0/P1, avec données non sensibles, accès restreints, surveillance renforcée et acceptation explicite des risques résiduels.

## 2. Cartographie des surfaces d’attaque

### 2.1 Composants applicatifs

| Composant | Chemins clés | Rôle | Surfaces d’attaque principales |
|---|---|---|---|
| Backend API | `backend/src/main.ts`, `backend/src/app.module.ts`, `backend/src/modules/**` | API métier, auth backend, paiements, uploads, chat/IA, admin | HTTP `/v1/*`, webhook Stripe, proxy endpoints vendeurs, données Prisma, Supabase Storage |
| Auth/rôles | `backend/src/common/guards/*`, `backend/src/modules/users/**` | Validation token Supabase, création profil, rôles/permissions | Token forgé/expiré, élévation initiale via `app_metadata`, accès admin/super-admin |
| Agents | `backend/src/modules/agents/**`, `frontendWeb/app/(dashboard)/dashboard/agents/**` | Création, validation, revue, publication | Prompts malveillants, endpoint vendeur, champs trop longs, agent rejeté/suspendu exécuté |
| Chat/IA/proxy | `backend/src/modules/chat/**`, `shared/hooks/use-chat.ts`, `frontendWeb/app/(chat)/**` | Sessions, messages, streaming, appels IA | Prompt injection, accès historique, coût IA, SSRF, erreurs fournisseur exposées |
| Uploads | `backend/src/modules/uploads/**`, `frontendWeb/components/uploads/*`, `frontendWeb/lib/supabase/storage.ts` | Fichiers agents/chat, stockage Supabase | Fichiers publics, MIME forgé, PDF actif, accès croisé, fuite vers IA |
| Paiements | `backend/src/modules/payments/**`, `shared/api/client.ts`, `frontendWeb/app/(public)/checkout/*` | Stripe checkout/webhook/access | Webhook rejoué/incomplet, montant/devise incohérents, contournement accès payant |
| Base de données | `backend/prisma/schema.prisma`, migrations Prisma | Données utilisateurs, agents, clés, achats, chats, fichiers | Absence RLS explicite, rétention non formalisée, contraintes Stripe/rétention incomplètes |
| Web Next.js | `frontendWeb/app`, `frontendWeb/lib/supabase/middleware.ts`, `frontendWeb/next.config.mjs` | Interface publique/dashboard/admin/chat | Routes privées, open redirect, erreurs exposées, Markdown/liens |
| Desktop Tauri | `frontendApp/src`, `frontendApp/src-tauri` | Client desktop chat/auth | Capabilities non explicites, endpoint localhost par défaut, liens externes |
| Mobile Expo | `frontendAppMob` | Prototype mobile | Données mockées, pas d’auth/API réelle, AsyncStorage pour préférences/navigation |
| Shared | `shared/api/client.ts`, `shared/hooks/*` | Client API/hooks | Propagation Bearer token, erreurs API, streaming SSE |
| Supply chain | `package.json`, `package-lock.json`, `*/package.json` | Dépendances | Vulnérabilités transitives, lockfile, lint/CI |

### 2.2 Flux critiques audités

- **Inscription/connexion/profil** : Supabase Auth côté clients, token Bearer vers backend, création profil local via guards backend.
- **Administration** : routes web `/admin`, endpoints backend utilisateurs/rôles/revue/stats/activity protégés par rôles/permissions.
- **Création et revue d’agent** : fichiers `.agentjson`, images, champs textuels, endpoints, prompts, validation automatique et revue admin.
- **Chat et IA** : sessions utilisateur, messages, fichiers, choix stratégie d’exécution (`SELLER_ENDPOINT`, `SELLER_API_KEY`, `USER_API_KEY`).
- **Uploads** : multipart backend vers Supabase, uploads directs client pour assets/config agents, URLs publiques.
- **Paiements** : checkout authentifié, webhook public signé, achat et contrôle accès agent payant.
- **Clients web/desktop/mobile** : protection routes, stockage session, rendu Markdown, erreurs, configuration API.

## 3. Liste priorisée des vulnérabilités/faiblesses

| ID | Priorité | Gravité | Faiblesse | Preuves principales |
|---|---:|---:|---|---|
| P0-01 | Très haute | Critique | SSRF résiduel via endpoint vendeur/config URL sans résolution DNS/IP effective complète | `backend/src/common/validators/is-public-url.validator.ts`, `backend/src/modules/chat/infrastructure/providers/endpoint-proxy.provider.ts`, `backend/src/modules/agents/application/usecases/validate-agent.usecase.ts` |
| P0-02 | Très haute | Critique | Secrets sensibles présents dans le workspace local, à rotater et assainir | `backend/.env` observé, valeurs non reproduites |
| P0-03 | Très haute | Critique | Uploads runtime publics et fichiers potentiellement confidentiels accessibles par URL durable | `backend/src/modules/uploads/application/upload.service.ts`, `supabase/snippets/storage-policies.sql`, `frontendWeb/lib/supabase/storage.ts` |
| P0-04 | Haute | Élevée | Webhook Stripe insuffisamment recoupé : paiement, montant, devise, statut agent, idempotence Stripe | `backend/src/modules/payments/application/usecases/handle-webhook.usecase.ts`, `backend/prisma/schema.prisma` |
| P0-05 | Haute | Élevée | Absence de tests e2e/non-régression sur les flux critiques clients et paiements/uploads | aucun `*.spec/*.test` sous `frontendWeb`, `frontendApp`, `frontendAppMob`, `shared` |
| P1-01 | Haute | Élevée | Rate limiting global trop générique pour chat/upload/paiement/agents/clés API | `backend/src/app.module.ts`, contrôleurs chat/uploads/payments/users |
| P1-02 | Haute | Élevée | Erreurs fournisseurs IA/proxy exposables au client via stream | `backend/src/modules/chat/infrastructure/controllers/chat.controller.ts`, providers IA |
| P1-03 | Haute | Élevée | Champs agents/prompts/config distante insuffisamment bornés | DTO agents et `validate-agent.usecase.ts` |
| P1-04 | Haute | Élevée | Rôle initial pouvant provenir de `app_metadata` Supabase au premier login | `backend/src/common/guards/supabase-auth.guard.ts`, `optional-supabase-auth.guard.ts` |
| P1-05 | Haute | Élevée | Validation fichier insuffisante : MIME déclaratif, pas magic bytes/AV/CDR/purge métadonnées | `backend/src/modules/uploads/**` |
| P1-06 | Haute | Élevée | Mobile non prêt production : mock data, pas d’auth/API réelle | `frontendAppMob/src/data/mock.ts`, `frontendAppMob/App.tsx` |
| P1-07 | Haute | Élevée | Desktop Tauri non durci, capabilities non explicites, endpoint localhost par défaut | `frontendApp/src-tauri/tauri.conf.json`, `frontendApp/src/lib/api.ts` |
| P1-08 | Haute | Critique | Open redirect potentiel post-auth via `redirect`/`next` non allowlistés | `frontendWeb/app/(auth)/login/page.tsx`, `frontendWeb/app/(auth)/auth/callback/route.ts` |
| P2-01 | Moyenne | Moyenne | Journalisation incomplète des actions sensibles | activity/users/uploads/payments |
| P2-02 | Moyenne | Moyenne | Politique de rétention/suppression non formalisée | `backend/prisma/schema.prisma` |
| P2-03 | Moyenne | Moyenne | Rendu Markdown/liens non couverts par tests XSS/URL | `frontendWeb/components/chat/message.tsx`, `frontendApp/src/components/chat-message.tsx` |
| P2-04 | Moyenne | Moyenne | Lint et audit dépendances en échec | `npm run lint`, `npm audit --omit=dev --workspaces` |

## 4. Matrice de risques

| Risque | Gravité | Probabilité | Priorité | Vérification attendue |
|---|---:|---:|---:|---|
| SSRF via endpoint vendeur/config URL | Critique | Moyenne | Très haute | Résolution DNS, blocage IP effective privée/réservée, tests rebinding/IPv6/encodages |
| Fuite ou réutilisation de secrets locaux | Critique | Moyenne | Très haute | Rotation, suppression `.env` sensibles, scan secrets CI/historique Git |
| Lecture publique de documents uploadés | Critique | Moyenne | Très haute | Bucket privé, URLs signées courtes, tests accès croisé/suppression |
| Paiement validé sur webhook incomplet/incohérent | Élevée | Faible-Moyenne | Haute | Vérifier `payment_status`, montant, devise, metadata, agent publié, idempotence event |
| Absence de tests critiques clients/e2e | Élevée | Élevée | Très haute | Playwright/Vitest/Jest couvrant auth, admin, chat, uploads, paiement |
| Abus coût IA/DoS par limites génériques | Élevée | Moyenne | Haute | Throttles par route, quotas utilisateur/plan, alertes |
| Exposition d’erreurs fournisseur/proxy | Élevée | Moyenne | Haute | Réponses génériques client, logs serveur redigés |
| Upload de fichier malveillant/trompeur | Élevée | Moyenne | Haute | Magic bytes, AV/CDR, refus MIME incohérent, tests fichiers piégés |
| Élévation initiale de rôle via metadata Supabase | Élevée | Faible-Moyenne | Haute | Création locale toujours `USER` sauf procédure admin contrôlée |
| Open redirect post-auth | Critique | Moyenne | Très haute | Allowlist stricte chemins internes, tests `http(s)://`, `//`, backslashes |
| Mobile/desktop exposés sans durcissement | Élevée | Moyenne-Élevée | Haute | Exclusion release ou durcissement + tests spécifiques |
| Conservation excessive de données personnelles | Moyenne | Moyenne | Moyenne | Politique RGPD, purge/anonymisation, tests suppression |
| Dépendances vulnérables modérées | Moyenne | Moyenne | Moyenne | Patch `qs/ws`, plan upgrade Expo/uuid, Renovate/Dependabot |

## 5. Recommandations

### 5.1 Sécurité backend/auth/rôles/IA

1. Renforcer la validation SSRF : résolution DNS, validation de chaque IP retournée, blocage IPv4/IPv6 privées/link-local/réservées/multicast, protection rebinding, HTTPS obligatoire en production si possible.
2. Remplacer les erreurs fournisseur/proxy envoyées au client par des messages génériques; conserver les détails redigés uniquement côté logs serveur.
3. Ajouter des throttles dédiés : chat, upload, checkout, création agent, ajout clés API, revue admin.
4. Ajouter `MaxLength`, `ArrayMaxSize`, limites de fichiers/config distante et bornes de pagination.
5. Ne plus initialiser de rôle admin/super-admin depuis Supabase `app_metadata`; bootstrap super-admin via procédure dédiée.
6. Ajouter timeouts/limites de stream aux providers OpenAI/Anthropic directs.

### 5.2 Secrets, base, uploads, paiements

1. Rotater tous les secrets présents localement et supprimer les `.env` sensibles des espaces partagés.
2. Ajouter Gitleaks/TruffleHog ou équivalent en CI et pré-commit recommandé.
3. Passer les fichiers runtime en bucket privé, URLs signées courtes, séparation assets publics vs pièces jointes privées.
4. Ajouter sniffing magic bytes, scan antivirus/CDR, purge métadonnées et quotas fichiers.
5. Compléter webhook Stripe : `payment_status`, montant, devise, metadata, statut agent, event ID unique, `stripePaymentId` unique ou table transactions.
6. Formaliser rétention/suppression : chats, uploads, logs, clés API, données utilisateur, facturation.
7. Définir RLS Supabase ou désactiver/restreindre PostgREST sur tables Prisma si Supabase héberge la DB.

### 5.3 Interfaces et tests

1. Corriger les redirections post-auth avec allowlist de chemins internes.
2. Centraliser l’URL API et bloquer les fallbacks localhost en build production.
3. Ajouter tests Playwright web sur routes privées, admin, chat, upload, paiement.
4. Ajouter tests hooks/composants pour `shared/hooks/use-chat.ts`, rendu Markdown, erreurs et uploads.
5. Durcir Tauri : capabilities minimales, CSP/allowlist, gestion des liens externes, endpoint release obligatoire.
6. Déclarer mobile hors release production tant que l’app reste mockée, ou intégrer auth/API + stockage sécurisé + tests.
7. Corriger le lint produit et traiter les vulnérabilités npm modérées ou documenter l’acceptation.

## 6. Scénarios de tests de non-régression

### 6.1 Authentification, rôles et accès

- Non connecté vers `/dashboard`, `/chat`, `/checkout`, `/admin` : redirection login sans fuite de données.
- Token absent/expiré/malformé sur API sensible : rejet 401/403 systématique.
- Utilisateur standard vers endpoints/admin UI : refus UI et backend.
- Admin simple vers gestion super-admin : refus.
- Promotion/rétrogradation rôle : uniquement super-admin, journalisation, ancien/nouveau rôle.
- Login/callback avec `redirect=https://evil.test`, `//evil.test`, chemins non allowlistés : fallback interne sûr.
- Création nouvel utilisateur : rôle local `USER` par défaut.

### 6.2 Agents, proxy IA et contenus

- Création agent avec champs trop longs, tags/models nombreux : rejet contrôlé.
- Agent endpoint `localhost`, `127.0.0.1`, IPv6 loopback, IP encodée, domaine DNS rebinding : rejet.
- Config URL trop volumineuse ou redirigée : rejet.
- Agent rejeté/suspendu/non publié : non exécutable, non achetable, non listé public.
- Erreur fournisseur IA contenant détails sensibles : client reçoit message générique.
- Stream IA interrompu : état client propre, message d’interruption, pas de blocage.

### 6.3 Uploads et fichiers

- Upload non authentifié : 401/403.
- Upload > 10 Mo : refus client et backend.
- Extension/MIME incohérent ou magic bytes non conformes : refus.
- PDF actif ou fichier piégé : quarantaine/refus selon politique.
- Utilisateur A liste/supprime/attache fichier de B : refus.
- Suppression fichier : DB et storage purgés, ancienne URL inaccessible.
- Rafale uploads : throttle/quota déclenché.

### 6.4 Paiements

- Checkout non authentifié : refus.
- Checkout agent gratuit/non publié/supprimé : refus métier.
- Modification montant/devise côté client : ignorée, prix serveur utilisé.
- Webhook sans signature ou signature invalide : refus.
- Webhook `checkout.session.completed` avec `payment_status != paid` : aucun achat.
- Montant/devise/metadata incohérents : aucun achat + log/alerte.
- Rejeu même `event.id` : traitement unique.
- Remboursement/annulation/échec : accès révoqué ou statut conforme règle métier.
- Accès chat/download agent payant sans achat : refus; avec achat valide : succès.

### 6.5 Interfaces web/desktop/mobile

- Rendu Markdown avec `<script>`, HTML brut, `javascript:`, `data:` : pas d’exécution, liens neutralisés.
- Erreurs API détaillées : message UI générique.
- Desktop release sans endpoint prod : build/démarrage refuse localhost silencieux.
- Desktop lien externe depuis Markdown : ouverture contrôlée, pas de capacités système inutiles.
- Mobile build production avec `MOCK_AGENTS` : refus CI ou flag hors production.
- Mobile session expirée/offline : erreur maîtrisée, pas de secret en AsyncStorage.

### 6.6 CI, dépendances et configuration

- `npm ci` puis `npm run lint` : succès requis.
- Tests backend unitaires/intégration critiques : succès.
- Tests e2e Playwright : succès sur parcours auth/admin/chat/upload/paiement.
- `npm audit --workspaces --audit-level=high` bloquant; modérés suivis par ticket.
- Scan secrets CI : échec si clé réelle hors exemples.
- Démarrage production sans variables obligatoires Stripe/Supabase/chiffrement : échec contrôlé.

## 7. Décision de préparation production

**Décision consolidée : non prêt pour production publique large.**

Critères bloquants avant passage à “prêt sous conditions” :

- P0-01 à P0-05 corrigés ou compensés avec acceptation formelle.
- Tests automatisés couvrant auth/rôles, accès croisés, agents, proxy, uploads, paiements, chat et clients.
- Secrets rotatés, `.env` sensibles assainis, scan secrets actif.
- Uploads runtime privés/signés et validation fichiers renforcée.
- Webhook Stripe complet, idempotent et testé.
- SSRF/proxy durci par résolution DNS/IP effective.
- Interfaces web corrigées pour open redirect et configuration API production.
- Mobile/desktop explicitement exclus de la release ou durcis/testés.

Critères pour viser “prêt” :

- Tous les risques élevés résiduels documentés et acceptés.
- CI bloquante : lint, tests, audit dépendances, scan secrets.
- Observabilité et alertes sur abus chat/upload/webhook/proxy/admin.
- Politique de rétention/suppression documentée et testée.
- Procédures opérationnelles : rotation secrets, bootstrap/révocation admin, réponse incident.

## 8. Actions court terme et moyen terme

### Court terme — 0 à 2 semaines

1. Rotater/assainir les secrets locaux et ajouter scan secrets.
2. Corriger SSRF endpoint/config URL avec DNS/IP effective et tests dédiés.
3. Passer les uploads runtime en privé ou URLs signées courtes; séparer assets publics et fichiers privés.
4. Renforcer validation uploads : magic bytes, MIME/extension, quotas, suppression storage.
5. Compléter webhook Stripe : statut, montant, devise, event ID, idempotence, statut agent.
6. Corriger open redirect web `redirect`/`next`.
7. Ajouter throttles spécifiques chat/upload/checkout/agents/clés API.
8. Ajouter tests e2e Playwright minimaux auth/admin/chat/upload/paiement.
9. Ajouter tests backend paiement/uploads/proxy et tests hooks clients critiques.
10. Centraliser configuration API, supprimer les fallbacks localhost en production.
11. Corriger `npm run lint` ou exclure proprement les projets hors produit.
12. Traiter `qs`/`ws` et planifier upgrade Expo/uuid.

### Moyen terme — 1 à 3 mois

1. Mettre en place antivirus/CDR/quarantaine fichiers.
2. Formaliser et implémenter rétention RGPD : chats, fichiers, logs, clés API, achats.
3. Ajouter suppression/anonymisation utilisateur complète et tests associés.
4. Finaliser Stripe Connect, refunds, chargebacks, subscriptions si modèle économique applicable.
5. Déployer observabilité/alertes : abus IA, uploads, webhooks, refus SSRF, tentatives admin.
6. Durcir Tauri release : capabilities, CSP, allowlist, liens externes, stockage session.
7. Intégrer mobile réel ou retirer explicitement de la production publique.
8. Déployer Renovate/Dependabot et gouvernance dépendances.
9. Documenter procédures d’incident, rotation clé de chiffrement, bootstrap super-admin.
10. Réaliser une revue de sécurité périodique pré-release avec matrice de risques mise à jour.

## 9. Rapports détaillés produits

- `audit-technique-securite/01-cartographie-surfaces-attaque.md`
- `audit-technique-securite/02-backend-securite-auth-roles-agents-proxy-ia.md`
- `audit-technique-securite/03-base-secrets-uploads-paiements-dependances.md`
- `audit-technique-securite/04-interfaces-tests-decision-production.md`
- Copie de travail du rapport interfaces : `docs/audit-technique-securite/audit-interfaces-tests-production.md`
