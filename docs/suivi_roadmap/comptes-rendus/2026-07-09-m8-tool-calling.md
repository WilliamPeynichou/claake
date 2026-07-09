# Compte-rendu — Milestone 8 Tool calling agent

Date : 2026-07-09
Réf : `docs/roadmap-claake-agents-chat.md` — M8

## Résultat

M8 V1 livré : fondation tool calling backend + propagation agent/chat + affichage UI.

```txt
Agent.tools
→ AgentChatConfig.tools
→ ProviderStreamEvent
→ ToolRegistry backend
→ stream tool events
→ affichage web/desktop
```

## Changements livrés

### Types / contrat provider

- `AIProviderPort` étendu avec :
  - `ProviderStreamEvent` ;
  - `ProviderToolDefinition` ;
  - `streamEvents(params)` optionnel ;
  - compat `streamText` conservée.
- Providers adaptés :
  - `MockProvider` peut émettre `tool_call current_datetime` ;
  - OpenAI/Anthropic exécutent le tool calling natif multi-turn (`tool_use` / `function calling`) via callback backend `executeTool` ;
  - EndpointProxy reste compat texte (pas de tools côté endpoint vendeur V1).

### ToolRegistry backend

- Ajout `ToolRegistryService`.
- Tools V1 :
  - `current_datetime` ;
  - `knowledge_search` via `AgentKnowledgeService.buildKnowledgeContext()` ;
  - `fetch_url` borné.
- Sécurité `fetch_url` :
  - `assertPublicHttpUrl()` SSRF existant ;
  - domaines allowlistés par agent ;
  - timeout 5s ;
  - contenu texte/json/html seulement ;
  - réponse tronquée à 20k chars ;
  - pas de code arbitraire.
- Quota simple : max 5 appels tool/message.
- Logs structurés `tool.call.success/error`.

### Agent.tools

- Prisma : `Agent.tools Json?` + migration `0015_add_agent_tools`.
- Backend : entity, mapper, repository, DTO create/update, transformer.
- Shared : `AgentToolConfig`, `PublicAgentTool`, `ChatToolEvent`.
- API : `Agent.tools` et `AgentChatConfig.tools`.

### Boucle chat

- `SendMessageUseCase` orchestre :
  - provider events ;
  - tool call ;
  - exécution backend ;
  - tool result ;
  - observabilité provider existante.
- `ChatController` streame :
  - `0:` texte ;
  - `8:` événement tool Claake ;
  - `d:` done ;
  - `3:` erreur.
- `shared/hooks/use-chat.ts` parse `8:` et ajoute `tool_events` au message assistant local.

### UI

- Web : `frontendWeb/components/chat/message.tsx` affiche “L'agent utilise l'outil X”.
- Desktop : `frontendApp/src/components/chat-message.tsx` affiche “Outil X”.
- Builder web : champ JSON `tools` dans étape qualité.
- Payload create/update : `tools` propagé.

## Vérifications

- `npm -w @claake/backend run test -- send-message.usecase.spec.ts --runInBand` : OK, 21 tests.
- `npm -w @claake/backend run test -- --runInBand` : OK, 32 suites, 201 tests.
- `npm -w @claake/backend run test:e2e -- --runInBand` : OK, 1 suite, 1 test.
- `npm run api-build` : OK.
- `NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321 NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-placeholder NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build` : OK.
- `VITE_SUPABASE_URL=http://localhost:54321 VITE_SUPABASE_ANON_KEY=ci-placeholder VITE_API_URL=http://localhost:3001 npm run desktop-build` : OK, warning chunk >500 kB connu.

## Limites connues

- Tool events non persistés en DB V1 ; affichage live uniquement.
- UI builder tools = JSON brut, pas encore éditeur dédié.
- `fetch_url` nécessite allowlist exacte hostname.
- EndpointProxy vendeur reste compat texte (tool calling custom hors M8).

## État M8

M8 passe à `100% fonctionnel V1 fondation` avec mapping natif multi-turn Anthropic/OpenAI livré. Reste hors M8 : endpoint vendeur/tool calling custom, dashboards usage tools, et intégration MCP (M10).
