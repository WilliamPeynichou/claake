# Changelog — Claake

## V0.02 — Chat + Publication d'agents (2026-03-15)

### Backend

#### Nouveau module : Chat (`backend/src/modules/chat/`)
- **5 endpoints REST** sous `/v1/chat/` protégés par `SupabaseAuthGuard` :
  - `POST /chat/sessions` — créer une session
  - `GET /chat/sessions` — lister les sessions (paginé)
  - `GET /chat/sessions/:id/messages` — messages d'une session (paginé)
  - `POST /chat/sessions/:id/messages` — envoyer un message (**SSE streaming**)
  - `DELETE /chat/sessions/:id` — supprimer une session
- **Architecture Clean** : entities, ports, use cases, mappers, transformers, repository Prisma
- **AI Providers** : `AnthropicProvider` et `OpenAIProvider` avec streaming, `AIProviderFactory` pour le dispatch par modèle
- **Decorator `@SkipTransform()`** pour bypass le `ResponseTransformInterceptor` sur les endpoints SSE

#### Pipeline de validation d'agents
- `ValidateAgentUseCase` : validation schéma + scan sécurité (patterns dangereux dans le system prompt)
- `ReviewAgentUseCase` : approve/reject admin
- Nouvel endpoint `PATCH /v1/agents/:id/review` (admin/super_admin uniquement)
- `CreateAgentUseCase` déclenche la validation automatiquement après création

#### Schema Prisma
- Enums : `MessageContentType` (TEXT, IMAGE, VIDEO), `MessageRole` (USER, ASSISTANT, SYSTEM)
- Models : `ChatSession`, `ChatMessage` avec indexes composites
- Champ `systemPrompt` ajouté sur `Agent`
- Relations `chatSessions` sur `User` et `Agent`

### Frontend Web

#### Page Chat (`/chat`)
- Sidebar : sélecteur d'agents, liste des conversations groupées par date, suppression
- Zone principale : messages avec streaming en temps réel, indicateur de frappe
- Input avec envoi par Enter, bouton Send
- Auto-création de session au premier message
- Wrapped dans Suspense pour `useSearchParams`

#### Publication d'agents (mise à jour)
- Formulaire soumis réellement au backend avec auth token
- Upload et parsing de fichiers `.agentjson` → pré-remplissage du formulaire
- Affichage des erreurs de validation et avertissements après soumission
- Champ `systemPrompt` inclus dans les données envoyées

#### Composant ChatInterface
- Redirige vers `/chat?agent=<id>` au lieu d'embarquer le chat in-page

#### Navigation
- Lien "Chat" ajouté dans la sidebar du dashboard (icône MessageSquare)

### Shared

#### Types (`shared/types/index.ts`)
- `ChatSession` : id, agent_id, agent_name, title, message_count, last_message_preview, etc.
- `ChatMessage` : enrichi avec session_id, content_type, media_url, metadata
- `ValidationResult` : valid, errors, warnings, requiresManualReview

#### API Client (`shared/api/client.ts`)
- `chat.createSession(agentId, token)`
- `chat.listSessions(token, limit?, offset?)`
- `chat.getMessages(sessionId, token, limit?, offset?)`
- `chat.sendMessageSSE(sessionId, content, token)` — retourne le `fetch` Response brut
- `chat.deleteSession(sessionId, token)`
- `agents.review(agentId, decision, token, reason?)`

#### Hook useChat (`shared/hooks/use-chat.ts`)
- Réécrit de zéro : session-based, streaming SSE via `ReadableStream.getReader()`
- Gestion sessions (create, load, delete, refresh)
- Auto-création session au premier message
- Parse des events SSE `data: {"chunk": "..."}`

### Suppressions
- `frontendWeb/app/api/chat/route.ts` — proxy Next.js supprimé (les clés API transitent par le backend)

---

## V0.01 — Vitrine + Admin

- Auth Supabase complète (login, register, OAuth, forgot/reset password)
- Catalogue d'agents (listing, recherche, filtre catégorie, page détail)
- Dashboard utilisateur (stats, bibliothèque, paramètres, clés API)
- Admin panel (stats, gestion agents/users, gestion admins, permissions)
- Schema Prisma complet (users, agents, versions, commerce, reviews, collections, pipelines, categories)
- Backend NestJS Clean Architecture (agents, users, categories, stats)
- Shared types + API client typé
- Monorepo npm workspaces avec Biome

---

## Reste MVP

| Tâche | Fichier(s) concerné(s) |
|-------|------------------------|
| Fix auth token dashboard | `frontendWeb/app/(dashboard)/dashboard/page.tsx` |
| Page "Mes agents" | `frontendWeb/app/(dashboard)/dashboard/agents/page.tsx` + endpoint backend |
| Settings profil → backend | `frontendWeb/app/(dashboard)/dashboard/settings/page.tsx` |
| Admin review page | `frontendWeb/app/(admin)/admin/review/page.tsx` |
| Fix stats userId from auth | `backend/src/modules/stats/infrastructure/controllers/stats.controller.ts` |

---

## V0.03 — Prévisions

### Fonctionnalités
- Bibliothèque utilisateur (agents favoris, collections)
- Système de favoris (toggle + endpoint)
- Reviews & ratings (formulaire, endpoint, mise à jour moyenne)
- Profil créateur public (`/creators/:id`)
- Historique activité admin
- Recherche avancée (filtres prix, rating, mode, tri)
- Notifications in-app
- Mobile Expo (premières pages)
- Desktop Tauri (premières pages)

### Technique
- Pagination complète sur tous les listings
- Cache API (Redis / in-memory)
- Tests unitaires + E2E
- CI/CD pipeline
- Monitoring / logging structuré
