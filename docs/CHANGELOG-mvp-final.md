
# MVP Final — Corrections & Compléments (2026-03-15)

## Corrections

### Backend
- **Stats auth** — `GET /stats/dashboard` et `GET /stats/admin` protégés par `SupabaseAuthGuard`, userId extrait du token (plus de query param)
- **Stats réelles** — `conversations` = count `ChatSession` du user, `agents_used` = count `Favorite`, `chat_sessions` admin = count réel en BDD
- **Endpoints auth profil** — `AuthController` ajouté avec `GET /auth/profile` + `PATCH /auth/profile` (display_name, bio)
- **Endpoint mes agents** — `GET /agents/mine` (auth required), retourne tous les agents du user connecté (tous statuts)
- **`UpdateUserProfileUseCase`** + `updateProfile()` sur `UserRepositoryPort` et `PrismaUserRepository`

### Frontend
- **Dashboard** — passe le vrai token auth via `useAuth()` (plus de `""` hardcodé)
- **Page "Mes agents"** — affiche les agents du user avec statut (badge couleur), date, modèle, boutons voir/chat
- **Settings profil** — charge le profil existant au mount, sauvegarde via `PATCH /auth/profile`, feedback succès/erreur
- **Admin review** — affiche les agents en `PENDING` avec détails complets, boutons approuver/rejeter, champ raison de rejet

### Shared
- **API client** — ajout `agents.mine(token)` pour lister les agents du user connecté

---

## État final MVP

| Feature | Statut |
|---------|--------|
| Auth (login, register, OAuth, reset password) | OK |
| Catalogue (listing, recherche, filtre, détail agent) | OK |
| Chat (sessions, SSE streaming, historique) | OK |
| Publication agent (formulaire 5 étapes, .agentjson, validation) | OK |
| Pipeline validation (scan sécurité, review admin) | OK |
| Dashboard stats (avec vrai token + données réelles) | OK |
| Mes agents (listing avec statuts) | OK |
| Settings profil (load + save backend) | OK |
| Admin panel (stats, agents, users, admins) | OK |
| Admin review (approve/reject avec raison) | OK |
| Clés API (local storage) | OK |

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
