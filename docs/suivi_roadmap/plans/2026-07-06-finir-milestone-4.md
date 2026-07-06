# Plan — Finir le Milestone 4 (Desktop chat)

Date : 2026-07-06
Branche : `feature/milestone-4-desktop-chat`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 4
Réf architecture : `docs/architecture/desktop-architecture.md`
Réf correction : `docs/suivi_roadmap/plans/2026-07-06-correction-milestone-4.md`

## Objectif

Livrer une première expérience desktop chat-only pour un utilisateur connecté :

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
- Réutiliser `@claake/shared` (types, `apiClient`, `useChat`) au lieu de dupliquer.
- Backend source de vérité pour l'accès chat via `AgentChatConfig`.
- Pas de logique métier desktop qui devine les droits : afficher les états API.
- Pas d'extension backend sauf nécessité constatée.
- V1 : composants desktop légers dans `frontendApp/src/`, pas d'extraction prématurée.

## Checklist

- [x] Auth desktop minimale (token utilisateur) branchée.
- [x] Liste des agents approuvés via `agents.list`.
- [x] `AgentChatConfig` chargé, états d'accès affichés (`login_required`,
      `api_key_required`, `purchase_required`, `not_published`).
- [x] Sessions + messages via `useChat` : création, historique, streaming, retry.
- [x] Panneau clés API : lister, ajouter, supprimer.
- [x] Déconnexion + navigation simple.
- [x] `npm -w @claake/frontend-app run build` + Biome ciblé OK.

## Critère terminé

```txt
user token configured
→ desktop lists approved agents
→ user selects an agent
→ chat session created or opened
→ messages stream through existing backend chat endpoint
→ user can manage API keys
→ user can logout
```

## Hors périmètre acceptable

- OAuth/deep-link Supabase complet.
- Store Tauri sécurisé si plugins absents.
- Paiement/marketplace/admin/création agent.
- Offline, tray, auto-update, raccourcis globaux.

## Statut

✅ Réalisé et livré. Voir compte-rendu
`docs/suivi_roadmap/comptes-rendus/2026-07-06-finition-milestone-4.md`.
