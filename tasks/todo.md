# Plan — Milestone 4 Desktop chat

Date : 2026-07-06
Branche : `feature/milestone-4-desktop-chat`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 4
Réf architecture : `docs/architecture/desktop-architecture.md`

## Objectif

Livrer une première expérience desktop chat-only permettant à un utilisateur connecté de :

```txt
connexion
→ liste agents disponibles
→ ouverture agent dans le chat
→ historique conversations
→ paramètres clés API
→ streaming chat
→ déconnexion
```

## Contraintes d'architecture

- Desktop = client d'usage quotidien centré chat, pas outil admin/création/paiement.
- Réutiliser `@claake/shared` pour types, client API et hooks quand possible.
- Le backend reste source de vérité pour l'accès chat via `AgentChatConfig` et les endpoints
  chat existants.
- Pas de logique métier desktop qui devine les droits agent : afficher les états renvoyés
  par l'API.
- Pas d'extension backend sauf nécessité constatée.
- Pour V1, composants UI desktop légers dans `frontendApp/src/`, pas extraction prématurée
  de composants partagés.

## Plan

- [x] Explorer l'état actuel de `frontendApp/`, ses dépendances et son build.
- [x] Vérifier que `shared/api/client.ts` et `shared/hooks/use-chat.ts` couvrent les besoins
      desktop.
- [x] Implémenter l'auth desktop minimale par token utilisateur/API manuel si le flow
      Supabase complet n'est pas encore présent.
- [x] Afficher les agents disponibles via endpoints existants (`agents.list` approuvés).
- [x] Charger `AgentChatConfig` pour l'agent sélectionné et afficher les états d'accès
      (`login_required`, `api_key_required`, `purchase_required`, `not_published`).
- [x] Brancher les sessions et messages avec `useChat` : création session, historique,
      streaming SSE, retry si disponible.
- [x] Ajouter une vue paramètres clés API : lister, ajouter, supprimer.
- [x] Ajouter déconnexion et navigation simple desktop.
- [x] Vérifier `npm -w @claake/frontend-app run build` et Biome ciblé.

## Critère terminé

```txt
user token configured
→ desktop lists approved agents
→ user selects an agent
→ chat session is created or opened
→ messages stream through existing backend chat endpoint
→ user can manage API keys
→ user can logout
```

## Hors périmètre acceptable

- OAuth/deep-link Supabase complet si le socle desktop n'est pas encore présent.
- Store Tauri sécurisé si les plugins ne sont pas installés.
- Paiement/marketplace/admin/création agent.
- Offline, tray, auto-update, raccourcis globaux.

## Review

- Branche de travail créée : `feature/milestone-4-desktop-chat`.
- État constaté : `frontendApp` avait déjà un socle utile (Supabase email/password,
  routes login/register, liste agents, sessions chat, streaming via `useChat`).
- `frontendApp/src/pages/chat.tsx` complète maintenant l'expérience desktop avec :
  - chargement de `AgentChatConfig` pour l'agent sélectionné ;
  - affichage provider/modèle dans l'en-tête ;
  - blocage UI basé sur `access.can_chat` et `access.reason` ;
  - CTA vers les clés API si `api_key_required` ;
  - welcome message et suggestions de prompts ;
  - retry depuis le hook partagé `useChat`.
- `frontendApp/src/components/api-keys-panel.tsx` ajouté : liste, ajout et suppression de
  clés API via `useApiKeys` et `apiClient.auth.apiKeys`.
- `frontendApp/src/components/chat-sidebar.tsx` ajoute une entrée **Clés API** et conserve
  la déconnexion.
- `frontendApp/src/components/chat-input-da.tsx` respecte `AgentChatConfig.capabilities`
  pour masquer l'upload si l'agent ne supporte ni fichiers ni images, et transmet
  `sessionId` + `agentId` à l'upload.
- `frontendApp/src/components/chat-thread.tsx` affiche welcome/suggestions et l'action
  **Réessayer** en cas d'erreur retryable.

## Vérifications

- `npm -w @claake/frontend-app run build` OK.
  - TypeScript OK.
  - Vite build OK.
  - Warning non bloquant : chunk JS > 500 kB.
- `npx biome check frontendApp/src/pages/chat.tsx frontendApp/src/components/chat-sidebar.tsx frontendApp/src/components/chat-thread.tsx frontendApp/src/components/chat-input-da.tsx frontendApp/src/components/api-keys-panel.tsx tasks/todo.md` OK sur les fichiers traités par Biome.
