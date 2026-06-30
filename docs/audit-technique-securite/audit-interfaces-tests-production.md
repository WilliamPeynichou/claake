# Audit interfaces, tests et décision de préparation production

> Périmètre agent `ClientsTests` — interfaces web, desktop, mobile, client API partagé, couverture de tests et éléments consolidables pour la décision production.
> Source de vérité : dépôt local, plan `.claakecode/plans/1780307664564-9379ecb6-plan-de-v-rification-technique-et-s-curitaire.md`.
> Aucune donnée réelle interrogée, aucune modification applicative effectuée.

## 1. Synthèse exécutive

Le projet dispose d’une séparation globale cohérente entre backend NestJS, frontend web Next.js, app desktop Tauri/Vite, app mobile Expo et paquet partagé `@claake/shared`. Côté interfaces, plusieurs garde-fous existent : middleware Supabase pour les routes privées web, en-têtes de sécurité Next.js, masquage UI des fonctionnalités admin, affichage Markdown via React sans `dangerouslySetInnerHTML`, taille maximale client sur certains uploads et authentification Supabase côté web/desktop.

La préparation production est cependant **non prête en l’état côté interfaces/tests** sans corrections préalables, principalement pour les raisons suivantes :

1. **Absence de tests automatisés clients** : aucun fichier `*.spec` ou `*.test` n’existe dans `frontendWeb`, `frontendApp`, `frontendAppMob` ou `shared`; les tests détectés sont uniquement backend (`backend/src/**/*.spec.ts`).
2. **Contrôles critiques dépendants du backend mais non vérifiés par tests E2E** : routes privées, accès admin/super-admin, sessions chat, uploads, paiement et erreurs ne disposent pas de scénarios de non-régression automatisés côté clients.
3. **Risque d’open redirect après login/callback** : `frontendWeb/app/(auth)/login/page.tsx` redirige vers le paramètre `redirect` sans validation stricte; `frontendWeb/app/(auth)/auth/callback/route.ts` concatène `next` à l’origine sans contrôle de chemin relatif attendu.
4. **Uploads directs côté client vers Supabase Storage pour les agents** : `frontendWeb/lib/supabase/storage.ts` retourne des URLs publiques pour images et fichiers `.agentjson`; la validation réelle doit être confirmée côté backend/RLS/storage policies.
5. **Configuration client incohérente ou permissive par défaut** : `frontendWeb/components/uploads/file-uploader.tsx` et `frontendWeb/components/chat/multimodal-input.tsx` ont un fallback `http://localhost:3002/v1` alors que `frontendWeb/lib/api.ts` échoue si `NEXT_PUBLIC_API_URL` est absent; desktop utilise `http://localhost:3001` par défaut dans `frontendApp/src/lib/api.ts`.
6. **Desktop et mobile pas au niveau production** : Tauri n’a pas de capabilities/policies dédiées visibles (`frontendApp/src-tauri`), l’app mobile utilise des données mockées (`frontendAppMob/src/data/mock.ts`) et n’intègre pas l’auth/API réelle.
7. **Qualité outillage en échec** : `npm run lint` échoue avec 39 erreurs et 109 warnings; `npm audit --omit=dev --workspaces --audit-level=moderate` remonte 12 vulnérabilités modérées.

Points favorables : les rôles admin sont relus via `/auth/profile` côté web (`frontendWeb/lib/hooks/use-auth.ts`), le backend reste appelé pour les actions sensibles via `shared/api/client.ts`, Next.js applique plusieurs en-têtes de sécurité (`frontendWeb/next.config.mjs`) et l’UI ne stocke pas les clés API utilisateur en clair côté navigateur selon l’implémentation actuelle de `frontendWeb/app/(dashboard)/dashboard/api-keys/page.tsx`.

## 2. Cartographie des surfaces d’attaque côté interfaces

### 2.1 Composants et responsabilités

| Composant | Chemins principaux | Responsabilité | Exposition / remarques |
|---|---|---|---|
| Frontend web Next.js | `frontendWeb/app`, `frontendWeb/components`, `frontendWeb/lib` | Catalogue, auth, dashboard, chat, admin, agents, uploads, checkout UI | Surface publique principale exposée au navigateur. |
| Middleware web Supabase | `frontendWeb/middleware.ts`, `frontendWeb/lib/supabase/middleware.ts` | Rafraîchissement session et redirection routes privées | Protège `/dashboard`, `/chat`, `/checkout`; `/admin` exige auth mais rôle validé ensuite côté UI/backend. |
| Client API partagé | `shared/api/client.ts` | Enveloppe REST vers backend `/agents`, `/chat`, `/payments`, `/users`, etc. | Porte les tokens Bearer et propage des messages d’erreur API. |
| Hooks partagés | `shared/hooks/use-chat.ts`, `shared/hooks/use-api-keys.ts`, `shared/hooks/use-agents.ts` | État chat, sessions, streaming SSE, clés API, collections | Surface sensible : streaming, messages, pièces jointes, erreurs. |
| Desktop Tauri/Vite | `frontendApp/src`, `frontendApp/src-tauri` | Client desktop chat/auth | Protection par route React, mais config Tauri minimale et API localhost par défaut. |
| Mobile Expo | `frontendAppMob` | Prototype mobile catalogue/chat/profil | Données mockées, pas de sécurité auth/API réelle constatée. |
| Supabase Storage côté client | `frontendWeb/lib/supabase/storage.ts` | Upload d’images/fichiers agents vers buckets | Retourne des URLs publiques; dépend fortement des policies Supabase. |
| Upload backend via API | `frontendWeb/components/uploads/file-uploader.tsx`, `frontendWeb/components/chat/multimodal-input.tsx`, `frontendApp/src/components/chat-input-da.tsx` | Upload chat/documents avec Bearer token | Validation client taille/accept partielle, contrôle final à confirmer backend. |
| Rendu Markdown | `frontendWeb/components/chat/message.tsx`, `frontendApp/src/components/chat-message.tsx` | Affichage réponses assistant | ReactMarkdown sans HTML brut explicite; URLs/liens à tester. |
| Admin UI | `frontendWeb/app/(admin)/**` | Admin, revue agents, utilisateurs, stats, activité | Masquage rôle côté client, décisions sensibles via API backend. |
| Paiement UI | `shared/api/client.ts`, pages `frontendWeb/app/(public)/checkout/*` | Success/cancel et client payments non utilisé dans web trouvé | Flux checkout incomplet côté UI vérifiée; tests E2E nécessaires. |

### 2.2 Flux critiques observés

- **Inscription/connexion web** : `frontendWeb/app/(auth)/login/page.tsx`, `frontendWeb/app/(auth)/register/page.tsx`, `frontendWeb/app/(auth)/auth/callback/route.ts`, Supabase client `frontendWeb/lib/supabase/client.ts`.
- **Protection de session web** : `frontendWeb/lib/supabase/middleware.ts` protège `/dashboard`, `/chat`, `/checkout`, et exige une session pour `/admin`.
- **Rôle admin/super-admin** : `frontendWeb/lib/hooks/use-auth.ts` lit `/auth/profile`, mais garde un fallback sur `session.user.app_metadata.role`; `frontendWeb/app/(admin)/layout.tsx` et `frontendWeb/app/(admin)/admin/manage-admins/page.tsx` masquent/affichent l’UI.
- **Création/modification d’agent** : `frontendWeb/app/(dashboard)/dashboard/agents/new/page.tsx`, `frontendWeb/app/(dashboard)/dashboard/agents/[id]/edit/page.tsx`, uploads Supabase directs, puis `apiClient.agents.create/update`.
- **Chat + pièces jointes** : `frontendWeb/app/(chat)/chat/[agentId]/page.tsx`, `frontendWeb/components/chat/multimodal-input.tsx`, `shared/hooks/use-chat.ts`, API `sendMessageSSE`.
- **Gestion clés API** : `frontendWeb/app/(dashboard)/dashboard/api-keys/page.tsx`, `shared/hooks/use-api-keys.ts`, `shared/api/client.ts` routes `/auth/api-keys`.
- **Desktop auth/chat** : `frontendApp/src/App.tsx`, `frontendApp/src/lib/auth-context.tsx`, `frontendApp/src/pages/chat.tsx`.
- **Mobile prototype** : `frontendAppMob/App.tsx` + `frontendAppMob/src/data/mock.ts`.

## 3. Liste priorisée des vulnérabilités/faiblesses

### C1 — Critique — Absence de tests de non-régression clients sur les chemins sensibles

- **Preuves** : recherche `**/*.{spec,test}.{ts,tsx,js,jsx}` : 24 fichiers, tous sous `backend/src/**`; aucun test sous `frontendWeb`, `frontendApp`, `frontendAppMob`, `shared`.
- **Impact** : régression possible sur routes protégées, redirections, affichage admin, upload, chat, erreurs, achats, rendu de contenus utilisateur.
- **Probabilité** : élevée, car les surfaces UI sont nombreuses et en évolution.
- **Recommandation** : ajouter Playwright web, tests hooks/components Vitest/RTL, et scénarios desktop/mobile au minimum fumée.

### C2 — Critique — Risque d’open redirect via paramètres `redirect`/`next`

- **Preuves** : `frontendWeb/app/(auth)/login/page.tsx` utilise `router.push(redirect)` depuis `searchParams.get("redirect")`; `frontendWeb/app/(auth)/auth/callback/route.ts` redirige vers `${origin}${next}`.
- **Impact** : phishing, redirection post-auth vers domaine ou chemin non prévu si Next/router accepte un format externe ou ambigu.
- **Probabilité** : moyenne.
- **Recommandation** : n’autoriser que des chemins relatifs internes commençant par `/` mais pas `//`, avec allowlist (`/dashboard`, `/chat`, `/checkout`, `/admin`) et fallback sûr.

### C3 — Élevée — Uploads agents directs vers Supabase Storage avec URLs publiques

- **Preuves** : `frontendWeb/lib/supabase/storage.ts` uploade dans `agent-images` et `agent-files`, utilise `getPublicUrl`; `frontendWeb/app/(dashboard)/dashboard/agents/new/page.tsx` et `[id]/edit/page.tsx` l’appellent avant création/mise à jour backend.
- **Impact** : exposition publique de `.agentjson`, métadonnées/prompts, fichiers non validés ou persistants si la création backend échoue; dépendance forte à RLS/policies non visible côté client.
- **Probabilité** : moyenne.
- **Recommandation** : préférer upload via backend ou signed upload avec validation serveur, scan type/taille, nettoyage transactionnel et bucket privé pour configurations.

### C4 — Élevée — Desktop Tauri peu durci / configuration de production non démontrée

- **Preuves** : `frontendApp/src-tauri/tauri.conf.json` minimal, aucun fichier `capabilities`; `frontendApp/src-tauri/src/lib.rs` lance `tauri::Builder::default()` sans politiques complémentaires; API par défaut `http://localhost:3001` dans `frontendApp/src/lib/api.ts`.
- **Impact** : capacités desktop non explicitement limitées, mauvais endpoint possible, comportements différents web/desktop.
- **Probabilité** : moyenne.
- **Recommandation** : définir capabilities Tauri minimales, CSP/allowlist, config d’endpoint obligatoire en build release, tests de navigation/protocoles.

### C5 — Élevée — Mobile non prêt production, données mockées et absence d’auth/API réelle

- **Preuves** : `frontendAppMob/src/data/mock.ts` alimente agents/chats; `frontendAppMob/App.tsx` n’intègre pas de provider auth/API; stockage AsyncStorage utilisé pour préférences/navigation/favoris (`src/state/*`, `src/theme/*`).
- **Impact** : impossible de valider session, isolation utilisateur, paiements, chat réel ou stockage sensible mobile.
- **Probabilité** : élevée si l’app est publiée telle quelle.
- **Recommandation** : déclarer le mobile hors périmètre production ou intégrer auth/API, stockage sécurisé pour secrets, tests session/offline.

### C6 — Élevée — Vérification paiement côté interface incomplète

- **Preuves** : client API contient `payments.checkout`, `purchases`, `checkAccess`, `connect*` dans `shared/api/client.ts`, mais aucune utilisation web trouvée par recherche `apiClient.payments` / `payments.checkout`; pages success/cancel statiques sous `frontendWeb/app/(public)/checkout/*`.
- **Impact** : risque UX et sécurité métier si l’accès payant n’est pas revérifié après retour checkout; non-régression paiement impossible côté UI.
- **Probabilité** : moyenne.
- **Recommandation** : intégrer flux checkout complet, revérifier `/payments/access/:agentId` côté UI après paiement, et tester échecs/annulations/rejeux côté backend.

### C7 — Moyenne/Élevée — Fallbacks d’API localhost divergents

- **Preuves** : `frontendWeb/lib/api.ts` exige `NEXT_PUBLIC_API_URL`; mais `frontendWeb/components/uploads/file-uploader.tsx` et `frontendWeb/components/chat/multimodal-input.tsx` retombent sur `http://localhost:3002/v1`; desktop retombe sur `http://localhost:3001`.
- **Impact** : build/runtime incohérents, fuite de requêtes vers localhost ou mauvais backend, erreurs difficiles à détecter.
- **Probabilité** : moyenne.
- **Recommandation** : rendre l’URL API obligatoire partout en production, centraliser la config, bloquer les fallbacks dev en build release.

### C8 — Moyenne — Messages d’erreur backend/Supabase affichés tels quels dans plusieurs écrans

- **Preuves** : `shared/api/client.ts` extrait `body.error?.message`; `frontendWeb/app/(auth)/login/page.tsx`, `register`, `forgot-password`, `reset-password`, `components/uploads/file-uploader.tsx`, `shared/hooks/use-chat.ts` affichent des messages d’erreur.
- **Impact** : divulgation de détails internes si le backend/Supabase renvoie des messages trop précis; UX de sécurité non homogène.
- **Probabilité** : moyenne.
- **Recommandation** : mapper les erreurs attendues vers messages génériques côté UI et tracer les détails côté observabilité sécurisée.

### C9 — Moyenne — Rendu Markdown à tester contre XSS/liens trompeurs

- **Preuves** : `frontendWeb/components/chat/message.tsx`, `frontendApp/src/components/chat-message.tsx` utilisent `ReactMarkdown` + `remarkGfm`; aucun `dangerouslySetInnerHTML` trouvé dans les clients.
- **Impact** : ReactMarkdown échappe le HTML par défaut, mais les liens générés, images et schémas URL doivent être validés selon la version/config.
- **Probabilité** : faible à moyenne.
- **Recommandation** : tests XSS/URL (`javascript:`, `data:`, HTML brut, tables GFM) et politique de liens (`rel=noopener noreferrer`, target contrôlé si ouverture externe).

### C10 — Moyenne — Lint et dépendances en échec

- **Preuves** : `npm run lint` échoue : 39 erreurs, 109 warnings; `npm audit --omit=dev --workspaces --audit-level=moderate` : 12 vulnérabilités modérées (`qs`, `uuid`, `ws`, chaîne Expo).
- **Impact** : baisse de confiance qualité/supply chain, risque de régressions non détectées.
- **Probabilité** : élevée.
- **Recommandation** : corriger lint, isoler `ClaakePresentation` si hors produit, mettre à jour dépendances et valider impacts Expo.

## 4. Matrice de risques

| ID | Risque | Gravité | Probabilité | Priorité | Fichiers/indices | Vérification attendue |
|---|---|---:|---:|---:|---|---|
| C1 | Absence tests clients critiques | Critique | Élevée | Très haute | Aucun test sous `frontendWeb`, `frontendApp`, `frontendAppMob`, `shared` | Playwright/Vitest/RTL couvrant auth, admin, chat, uploads, paiement |
| C2 | Open redirect post-auth | Critique | Moyenne | Très haute | `login/page.tsx`, `auth/callback/route.ts` | Tests URLs externes/`//evil`, allowlist chemins internes |
| C3 | Exposition uploads agents/config | Élevée | Moyenne | Haute | `lib/supabase/storage.ts` | Bucket privé/policies, upload backend, nettoyage |
| C4 | Desktop non durci | Élevée | Moyenne | Haute | `src-tauri/tauri.conf.json`, `lib.rs` | Capabilities minimales, endpoint prod obligatoire |
| C5 | Mobile mock/non auth | Élevée | Élevée | Haute | `frontendAppMob/src/data/mock.ts`, `App.tsx` | Déclarer hors prod ou intégrer auth/API/tests |
| C6 | Paiement UI incomplet | Élevée | Moyenne | Haute | `shared/api/client.ts`, absence usages `apiClient.payments` | E2E checkout + revérification accès |
| C7 | Fallbacks API localhost | Moyenne/Élevée | Moyenne | Haute | upload/chat inputs, desktop api | Config centralisée et validation build |
| C8 | Erreurs détaillées exposables | Moyenne | Moyenne | Moyenne | `shared/api/client.ts`, pages auth/upload/chat | Mapping erreurs et tests messages sûrs |
| C9 | Markdown/liens non testés | Moyenne | Faible/Moyenne | Moyenne | `message.tsx`, `chat-message.tsx` | Tests XSS/liens, sanitizer si besoin |
| C10 | Lint/audit dépendances en échec | Moyenne/Élevée | Élevée | Haute | sortie `npm run lint`, `npm audit` | CI bloquante et mises à jour |

## 5. Recommandations

### 5.1 Corrections immédiates

1. **Sécuriser les redirections auth** : fonction utilitaire `safeRedirectPath(value)` appliquée à `redirect` et `next`; refuser `http://`, `https://`, `//`, backslashes, chemins non allowlistés.
2. **Ajouter une suite E2E web minimale** : Playwright sur login/logout, routes privées, admin refusé, super-admin requis, chat, upload invalide, agent payant sans achat.
3. **Centraliser `API_BASE_URL`** : supprimer les fallbacks localhost en production dans `frontendWeb/components/uploads/file-uploader.tsx`, `frontendWeb/components/chat/multimodal-input.tsx`, `frontendApp/src/lib/api.ts`.
4. **Décider du statut mobile/desktop** : soit hors release production, soit durcissement/config/tests avant exposition.
5. **Bloquer la CI sur lint/test/audit** après tri de `ClaakePresentation`.

### 5.2 Renforcements court terme

- Remplacer les uploads agents directs par une route backend ou des URLs signées à durée courte.
- Ne pas rendre publics les `.agentjson` si le fichier peut contenir prompts, endpoints, fournisseurs ou métadonnées sensibles.
- Ajouter tests de rendu Markdown avec payloads XSS et liens dangereux.
- Mapper les erreurs API côté UI vers messages contrôlés.
- Ajouter tests de hooks partagés (`useChat`, `useApiKeys`) avec mocks fetch/SSE.

### 5.3 Renforcements moyen terme

- Observabilité front : collecte d’erreurs sans données sensibles, corrélation avec logs backend, alertes sur rafales d’erreurs auth/upload/chat.
- Revue périodique dépendances et lockfiles pour tous workspaces.
- Politique de conservation/suppression fichiers côté client/backend avec tests.
- Tests desktop Tauri release : navigation, stockage session, endpoint, permissions.
- Tests mobile réels : stockage sécurisé, expiration session, erreurs réseau, offline.

## 6. Scénarios de tests de non-régression recommandés

### 6.1 Authentification et routes

| Scénario | Type | Résultat attendu |
|---|---|---|
| Accès `/dashboard`, `/chat`, `/checkout` non connecté | Playwright | Redirection `/login?redirect=<chemin>` et aucune donnée privée rendue |
| Accès `/admin` non connecté | Playwright | Redirection login |
| Utilisateur standard sur `/admin` | Playwright + mock/API test | UI “Accès refusé” et appels admin backend rejetés 403 |
| Admin simple sur `/admin/manage-admins` | Playwright | Accès refusé côté UI et backend 403 sur `users.updateRole` |
| Login avec `?redirect=https://evil.test` | Playwright | Redirection fallback `/dashboard`, jamais domaine externe |
| Callback avec `?next=//evil.test` | Test route Next | Redirection fallback interne |
| Token expiré/mal formé dans client API | Test intégration | Session nettoyée, message générique, pas de boucle infinie |

### 6.2 Agents, admin et contenus utilisateurs

| Scénario | Type | Résultat attendu |
|---|---|---|
| Création agent avec champs très longs/tags nombreux | E2E + API mock | Validation UI/backend claire, pas de crash |
| `.agentjson` invalide ou malveillant | Component/E2E | Message “Fichier .agentjson invalide”, pas d’upload persistant inutile |
| Endpoint agent privé (`http://127.0.0.1`) | E2E backend/UI | Rejet backend affiché sans détails internes |
| Revue agent par admin sans permission | E2E | Boutons masqués si applicable, backend 403 |
| Agent rejeté/suspendu dans chat/catalogue | E2E | Non exécutable/non achetable |

### 6.3 Chat, Markdown et uploads

| Scénario | Type | Résultat attendu |
|---|---|---|
| Message vide sans fichier | Unit hook | Pas d’appel réseau |
| Message très long | E2E | Rejet/limite contrôlée |
| Flux SSE interrompu | Unit hook `useChat` | Message marqué “réponse interrompue”, pas d’état bloqué |
| Markdown `<script>alert(1)</script>` | Component | Rendu échappé, pas d’exécution |
| Lien Markdown `javascript:alert(1)` | Component | Lien neutralisé ou non cliquable selon politique |
| Upload > 10 Mo | Component/E2E | Rejet client et backend |
| Upload MIME/extension incohérent | E2E | Rejet backend, message générique |
| Suppression fichier d’un autre utilisateur | E2E API/UI | 403/404, aucune suppression |

### 6.4 Paiements

| Scénario | Type | Résultat attendu |
|---|---|---|
| Agent payant sans achat | E2E | Pas d’accès chat/download; CTA checkout |
| Checkout créé avec prix manipulé côté client | API/E2E | Backend ignore montant client |
| Retour success sans webhook validé | E2E | UI revérifie accès et affiche attente/échec si achat absent |
| Annulation checkout | E2E | Aucun accès accordé |
| Achat existant | E2E | Accès agent accordé uniquement après `/payments/access` positif |

### 6.5 Desktop et mobile

| Scénario | Type | Résultat attendu |
|---|---|---|
| Desktop sans session | E2E Tauri | Route protégée vers login |
| Desktop endpoint manquant en release | Build/test config | Échec explicite, pas de localhost silencieux |
| Desktop lien externe depuis Markdown | E2E Tauri | Ouverture contrôlée, pas d’accès capacités inutiles |
| Mobile app production | QA gate | Si mock data détectée, build refusé |
| Mobile expiration session/réseau offline | E2E mobile | Déconnexion/erreur maîtrisée, pas de données sensibles en AsyncStorage |

## 7. Décision de préparation production

**Décision proposée : non prêt pour production publique côté interfaces/tests.**

Justification : le backend peut contenir des contrôles robustes, mais les interfaces et la stratégie de non-régression ne permettent pas encore de garantir l’absence de régression sur les parcours exposés. Les blockers minimum avant production publique sont :

- tests E2E web des chemins auth/admin/chat/upload/paiement;
- correction open redirect;
- clarification/durcissement des uploads Supabase publics;
- suppression des fallbacks localhost en production;
- décision explicite sur exclusion ou durcissement desktop/mobile;
- lint/audit dépendances traités ou acceptés formellement.

Une exposition limitée de démonstration pourrait être envisagée uniquement avec accès restreint, données non sensibles, mobile/desktop hors périmètre et risques résiduels acceptés explicitement.

## 8. Actions court terme et moyen terme

### Court terme (0–2 semaines)

1. Corriger `redirect`/`next` post-auth.
2. Ajouter Playwright web pour routes protégées, login, admin, chat, upload invalide, paiement sans achat.
3. Ajouter tests unitaires `shared/hooks/use-chat.ts` et rendu Markdown web/desktop.
4. Centraliser config API et rendre les variables obligatoires en build production.
5. Revoir upload agent : bucket privé ou backend-mediated upload; supprimer persistance publique de `.agentjson` sensible.
6. Corriger ou exclure proprement `ClaakePresentation` du lint produit, puis rendre `npm run lint` bloquant.
7. Traiter `npm audit` modéré (`qs`, `ws`, `uuid`/Expo) ou documenter l’acceptation.

### Moyen terme (2–8 semaines)

1. Durcir Tauri : capabilities, CSP, politique liens externes, configuration release.
2. Intégrer mobile réel ou déclarer l’app mobile non publiée; ajouter stockage sécurisé si tokens/secrets.
3. Ajouter tests de non-régression paiement complet avec webhooks simulés côté environnement test.
4. Ajouter observabilité front sans données sensibles et alertes erreurs auth/chat/upload.
5. Mettre en place revue périodique dépendances/lockfiles.
6. Formaliser matrice d’acceptation des risques résiduels avant chaque release.

## 9. Vérifications réalisées

- Lecture du plan d’audit demandé.
- Cartographie fichiers par glob sur `frontendWeb`, `frontendApp`, `frontendAppMob`, `shared`, `backend`.
- Revue ciblée des fichiers cités dans ce rapport.
- Recherche statique : stockage local, tokens, Authorization, Markdown, endpoints, tests, paiements, uploads.
- Commandes non destructives :
  - `npm run lint` : échec, 39 erreurs / 109 warnings / 6 infos.
  - `npm audit --omit=dev --workspaces --audit-level=moderate` : échec, 12 vulnérabilités modérées.
