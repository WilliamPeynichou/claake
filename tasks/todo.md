# Feature — ChatShell refactor

## Branche

- `feature/chat-shell-refactor`

## Contexte

Roadmap `docs/roadmap-claake-agents-chat.md`, point technique 6 :
extraire le chat autour d'un `ChatShell` dans `frontendWeb/features/chat/`
au lieu de garder toute la logique dans `app/(chat)/chat/[agentId]/page.tsx` (293 lignes).

## Plan

- [x] Créer la branche `feature/chat-shell-refactor` depuis `main`
- [x] Créer `frontendWeb/features/chat/hooks/use-agent-chat.ts` (auth, AgentChatConfig, sessions, useChat)
- [x] Créer `frontendWeb/features/chat/components/chat-header.tsx`
- [x] Créer `frontendWeb/features/chat/components/missing-api-key-card.tsx`
- [x] Créer `frontendWeb/features/chat/components/access-notice.tsx`
- [x] Créer `frontendWeb/features/chat/components/login-required.tsx`
- [x] Créer `frontendWeb/features/chat/chat-shell.tsx` (orchestration présentation)
- [x] Créer `frontendWeb/features/chat/chat-page.tsx` (Suspense + lecture params)
- [x] Créer `frontendWeb/features/chat/index.ts`
- [x] Alléger `app/(chat)/chat/[agentId]/page.tsx` pour qu'il importe `ChatPage`
- [x] Lancer build web + lint + vérifier le comportement (login required, api key required, chat normal)
- [x] Documenter dans la review ci-dessous

## Review

- Refactor `app/(chat)/chat/[agentId]/page.tsx` terminé : route réduite à un import de `ChatPage`.
- Logique extraite dans `frontendWeb/features/chat/` : `ChatShell`, `useAgentChat`, composants d'accès/header.
- `useAgentChat` charge auth, `AgentChatConfig`, agents sidebar, sessions/messages via `useChat`.
- États UI séparés : login requis, clé API requise, achat requis, agent non publié.
- Vérifications :
  - `npx biome check frontendWeb/app/'(chat)'/chat/'[agentId]'/page.tsx frontendWeb/features/chat tasks/todo.md` OK.
  - `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build` OK.
- Note : `npm run lint` global échoue hors scope sur `ClaakePresentation/` non lié et non inclus dans ce commit.
