# Claake — v0.01 (15 mars 2026)

## Résumé

Première version fonctionnelle de la plateforme Claake. Mise en place de l'infrastructure monorepo, de l'authentification, du catalogue d'agents, du panel d'administration et du système de rôles.

---

## Ce qui a été fait

### Infrastructure & Outillage

- [x] Monorepo npm workspaces (`shared`, `frontendWeb`, `backend`, `frontendApp`, `frontendAppMob`)
- [x] Biome (linter + formatter) configuré à la racine
- [x] Docker Compose pour PostgreSQL local (+ pgvector)
- [x] Supabase Auth (cloud) pour l'authentification
- [x] Prisma ORM avec 13 modèles (User, Agent, AgentVersion, Category, Review, Purchase, Subscription, UsageCredit, CreditTransaction, Collection, Favorite, Pipeline, Team)
- [x] Seed de développement (9 users, 7 agents, catégories, relations)
- [x] Renommage complet AgentPlace → Claake

### Backend (NestJS — Clean Architecture)

| Module | État | Détails |
|---|---|---|
| Auth | ✅ Complet | Supabase Guard, lecture rôle depuis BDD, auto-création user au login |
| Users | ✅ Complet | CRUD, mise à jour rôle, permissions admin granulaires |
| Agents | ✅ Complet | CRUD, recherche, filtres par catégorie, listing public |
| Categories | ✅ Complet | CRUD, comptage agents par catégorie |
| Stats | ✅ Complet | Dashboard utilisateur + stats admin |
| Guards & Decorators | ✅ Complet | `@Roles()`, `@RequirePermission()`, `SupabaseAuthGuard`, `RolesGuard`, `AdminPermissionGuard` |

**Architecture** : hexagonale 3 couches (domain / application / infrastructure) avec ports, repositories, use cases, transformers, DTOs.

### Frontend Web (Next.js 15)

| Page / Feature | État |
|---|---|
| Landing page | ✅ |
| Login | ✅ |
| Register | ✅ (nettoyé, rôle USER par défaut) |
| Forgot password | ✅ |
| Reset password | ✅ |
| Auth callback | ✅ (gère recovery) |
| Catalogue agents | ✅ (recherche + filtres) |
| Page détail agent | ✅ (partielle) |
| Dashboard utilisateur | ✅ (structure + stats) |
| Admin — Dashboard | ✅ |
| Admin — Utilisateurs | ✅ (liste, recherche, badges rôle) |
| Admin — Agents | ✅ (liste, filtres statut, recherche) |
| Admin — Statistiques | ✅ |
| Admin — Activité | ✅ (stub) |
| Super Admin — Gérer les admins | ✅ (promotion, permissions 6 toggles) |
| Middleware route protection | ✅ (dashboard, admin) |
| Header avec navigation admin | ✅ |

### Shared

- [x] Types partagés (`shared/types/index.ts`) — 14 interfaces
- [x] API client partagé (`shared/api/client.ts`) — agents, categories, stats, users, chat, auth
- [x] Classe `ApiError` avec status code

### Documentation

- [x] `docs/guides/admin-setup.md` — Guide création comptes admin/super admin
- [x] `CLAUDE.md` — Conventions du projet

---

## Ce qui reste à faire

### 🔴 Critique (MVP)

#### 1. Interface Chat (cœur du produit)

**Backend :**
- [ ] Module `chat` (domain / application / infrastructure)
- [ ] Endpoints : créer conversation, lister conversations, envoyer message, historique
- [ ] Intégration multi-provider (OpenAI, Anthropic, etc.) via API keys utilisateur
- [ ] Streaming SSE pour réponses temps réel
- [ ] Stockage conversations (tables `chat_sessions` + `chat_messages`)

**Frontend :**
- [ ] Layout chat type Claude/ChatGPT (sidebar agents gauche, chat centre)
- [ ] Liste des conversations par agent
- [ ] Input message + affichage streaming
- [ ] Sélection de modèle
- [ ] Gestion API keys utilisateur (CRUD dans settings)

#### 2. Publication d'agent (upload + validation)

**Backend :**
- [ ] Endpoint upload config agent (JSON/YAML)
- [ ] Pipeline de validation (schéma, sécurité, prompts)
- [ ] Workflow de review (draft → pending → approved/rejected)
- [ ] Scan de sécurité (analyse system prompt, détection injection)
- [ ] Versioning des agents

**Frontend :**
- [ ] Formulaire multi-étapes (infos → config → preview → soumission)
- [ ] Dashboard créateur (suivi statuts, métriques)
- [ ] Page d'édition agent

### 🟡 Important (post-MVP immédiat)

- [ ] **Reviews / Avis** — Backend endpoints + frontend (notes, commentaires, verified purchase)
- [ ] **Favorites / Collections** — Backend endpoints + frontend (coeur, listes personnalisées)
- [ ] **Profil utilisateur** — Page d'édition complète (avatar, bio, display name)
- [ ] **Sync Supabase ↔ BDD locale** — Webhook ou trigger pour créer automatiquement le user en BDD locale lors de l'inscription Supabase

### 🟢 Futur (post-MVP)

- [ ] **Paiements Stripe** — Connect pour créateurs, achats, abonnements
- [ ] **Usage Credits** — Système de crédits, transactions, recharges
- [ ] **Pipelines** — Chaînage d'agents, marketplace de pipelines
- [ ] **Teams** — Espaces d'équipe, partage d'agents
- [ ] **App Desktop** (Tauri) — Reprise du frontend web
- [ ] **App Mobile** (Expo) — Version mobile

---

## Stack technique

| Couche | Technologie |
|---|---|
| Web | Next.js 15 (App Router, React 19, TypeScript) |
| Mobile | Expo / React Native |
| Desktop | Tauri 2 + React/Vite |
| Backend | NestJS + Prisma (PostgreSQL) |
| Styling | Tailwind CSS + shadcn/ui |
| Auth | Supabase Auth (cloud) |
| BDD | PostgreSQL (Docker local) |
| Linter | Biome |
| Monorepo | npm workspaces |

---

## Rôles utilisateur

| Rôle | Accès |
|---|---|
| USER | Catalogue, chat, favoris, collections |
| CREATOR | + Publication d'agents, dashboard créateur |
| ADMIN | + Panel admin (selon permissions) |
| SUPER_ADMIN | + Gestion des admins, permissions illimitées |

---

*Document généré le 15 mars 2026*
