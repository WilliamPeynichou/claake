# Architecture Desktop — Claake (Tauri 2)

## 1. Périmètre

L'application desktop est un client **chat-only** : l'utilisateur interagit avec les agents de sa bibliothèque (favoris + achetés). Un bouton "Accéder à la boutique" ouvre le navigateur système sur le catalogue web (`WEB_URL/catalogue`).

**Hors périmètre V0.03 :** publication d'agents, admin, paiements (tout se fait via le web).

## 2. Stack

| Couche | Technologie |
|--------|-------------|
| Shell natif | Tauri 2 (Rust) |
| UI | React 19 + Vite |
| Styles | Tailwind CSS (sans shadcn — bibliothèque légère type headless-ui ou composants custom) |
| Shared | `@claake/shared` (types, API client, hooks) |

## 3. Authentification

- Même flow Supabase que le web (email/password ou OAuth).
- Token stocké via `@tauri-apps/plugin-store` (secure storage natif, pas de localStorage).
- Callback OAuth : deep link `claake://auth/callback` configuré dans Tauri.
- Le `createApiClient()` de `@claake/shared` fonctionne tel quel — on passe le token via `withAuth()`.

## 4. API

- Même backend, mêmes endpoints REST (`/v1/*`).
- Le `createApiClient(API_BASE_URL)` est réutilisé directement.
- Endpoints utilisés :
  - `GET /v1/auth/profile` — profil utilisateur
  - `GET /v1/favorites` — agents favoris
  - `GET /v1/payments/purchases` — agents achetés
  - `POST /v1/chat/sessions` — créer une session
  - `GET /v1/chat/sessions` — lister les sessions
  - `POST /v1/chat/sessions/:id/messages` — envoyer + SSE stream
  - `GET /v1/chat/sessions/:id/messages` — historique

### Endpoint supplémentaire recommandé

`GET /v1/agents/library` — retourne les agents favoris + achetés de l'utilisateur (combinaison de la table `favorites` et `purchases`). Évite deux appels côté desktop.

## 5. Composants réutilisables

Les composants chat (`chat-main`, `chat-input`, `chat-message-item`, `chat-sidebar`) de `frontendWeb/components/chat/` peuvent être :
- **Dupliqués** dans `frontendApp/src/components/chat/` et adaptés (pas de shadcn).
- **Ou** extraits dans `shared/components/` si on veut partager le code (nécessite un bundler compatible Tauri + Vite).

Pour la V0.03, la duplication est recommandée — les composants sont légers et les adaptations Tailwind-only sont simples.

## 6. Adaptations backend

- **CORS** : `tauri://localhost` est déjà configuré dans `main.ts`.
- Aucun autre changement backend requis.

## 7. Fonctionnalités Tauri

| Fonctionnalité | Plugin / API |
|----------------|-------------|
| System tray | `@tauri-apps/api/tray` — indicateur de nouvelles conversations |
| Auto-update | `@tauri-apps/plugin-updater` — vérification au lancement |
| Raccourcis clavier | `@tauri-apps/api/globalShortcut` — Cmd/Ctrl+N (nouvelle conversation) |
| Stockage sécurisé | `@tauri-apps/plugin-store` — tokens, préférences |
| Ouverture navigateur | `@tauri-apps/plugin-shell` — pour le lien vers la boutique |

### Configuration fenêtre

```json
{
  "width": 1000,
  "height": 700,
  "minWidth": 800,
  "minHeight": 600,
  "resizable": true,
  "title": "Claake"
}
```

## 8. Structure du projet

```
frontendApp/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       └── main.rs
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── chat/
│   │   │   ├── chat-main.tsx
│   │   │   ├── chat-input.tsx
│   │   │   ├── chat-message-item.tsx
│   │   │   └── chat-sidebar.tsx
│   │   └── layout/
│   │       └── app-shell.tsx
│   ├── hooks/
│   │   └── use-auth.ts
│   └── lib/
│       └── api.ts
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 9. Offline

Non prévu pour la V0.03.

- Les messages déjà chargés restent en mémoire (cache React state).
- L'envoi de messages nécessite une connexion active (SSE).
- Pas de base locale (SQLite) ni de synchronisation offline.
