# Plan — Milestone 8 Tool calling agent

Date : 2026-07-09
Réf : `docs/roadmap-claake-agents-chat.md` — M8

## Objectif

Passer du stream texte à une fondation tool calling backend :

```txt
AIProviderPort events
→ ToolRegistry backend
→ Agent.tools
→ exécution tools côté SendMessageUseCase
→ affichage chat web/desktop
```

## Plan

- [x] Relire architecture/roadmap M8.
- [x] Auditer provider/chat/agent/shared/builder.
- [x] Ajouter types shared tools.
- [x] Ajouter Prisma `Agent.tools` + migration.
- [x] Propager backend DTO/entity/mapper/transformer/chat-config.
- [x] Implémenter `ProviderStreamEvent` et compat providers.
- [x] Implémenter `ToolRegistry` V1.
- [x] Brancher `SendMessageUseCase` : tool events, quotas simples, logs.
- [x] Adapter `ChatController` stream vers clients.
- [x] Adapter shared `useChat` pour lire événements `8:`.
- [x] Affichage minimal web/desktop.
- [x] Tests + builds.
- [x] Docs compte-rendu.

## Review

- `Agent.tools` ajouté Prisma + migration `0015_add_agent_tools`.
- Types ajoutés : `AgentToolConfig`, `PublicAgentTool`, `ChatToolEvent`.
- `AgentChatConfig.tools` expose tools publics sans secrets.
- `ToolRegistryService` ajoute : `current_datetime`, `knowledge_search`, `fetch_url`.
- `fetch_url` borné : SSRF guard, allowlist domaine, timeout, taille max, types texte/json/html.
- `SendMessageUseCase` consomme `ProviderStreamEvent`, exécute tools backend, streame `tool_result`.
- `ChatController` envoie tool events avec préfixe `8:`.
- `useChat` parse `8:` et rattache `tool_events` au message assistant.
- Web/desktop affichent bloc outil utilisé.
- Builder web accepte `tools` en JSON brut.

## Vérifications

- `npm -w @claake/backend run test -- send-message.usecase.spec.ts --runInBand` : OK, 21 tests.
- `npm -w @claake/backend run test -- --runInBand` : OK, 32 suites, 201 tests.
- `npm -w @claake/backend run test:e2e -- --runInBand` : OK, 1 suite, 1 test.
- `npm run api-build` : OK.
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build` : OK.
- `VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=ci-placeholder VITE_API_URL=http://localhost:3001 npm run desktop-build` : OK, warning chunk Vite >500 kB connu.

## Limites

- OpenAI/Anthropic natif multi-turn tool calling complet livré (tool_use/function calling + callback backend `executeTool`).
- Tool events non persistés en base V1.
- UI builder tools = JSON brut.
