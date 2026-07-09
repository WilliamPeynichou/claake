# Plan — Milestone 8 Tool calling agent

Date : 2026-07-09
Réf : `docs/roadmap-claake-agents-chat.md` — M8

## Objectif

Installer la fondation tool calling Claake :

```txt
ProviderStreamEvent
→ ToolRegistry backend
→ Agent.tools
→ AgentChatConfig.tools
→ exécution backend
→ affichage chat web/desktop
```

## Architecture

- Backend source vérité : tool déclaré par agent, validé backend, exécuté backend.
- `AgentDefinition` : champ `tools` sur agent.
- `AgentValidation` : DTO/validation tools bornés.
- `AgentChatConfig` : expose tools activés, sans secrets.
- `ChatSession` : conserve messages classiques ; tool events restent stream/UI V1.
- `ProviderExecution` : `SendMessageUseCase` orchestre provider events + ToolRegistry.

## Livrables V1

1. Types provider :
   - `ProviderStreamEvent` ;
   - `streamEvents(params)` ;
   - compat `streamText`.

2. Tools backend :
   - `current_datetime` ;
   - `knowledge_search` ;
   - `fetch_url` avec allowlist, timeout, limite taille.

3. Config agent :
   - Prisma `tools Json?` ;
   - DTO create/update ;
   - entity/mapper/transformer ;
   - shared `AgentToolConfig` ;
   - `AgentChatConfig.tools`.

4. Stream chat :
   - event `8:` côté serveur pour tool call/result ;
   - parser côté `shared/hooks/use-chat.ts` ;
   - `ChatMessage.tool_events` local UI.

5. UI :
   - web : message affiche tools utilisés ;
   - desktop : idem minimal.

6. Tests :
   - ToolRegistry ;
   - SendMessageUseCase tool path ;
   - AgentChatConfig tools ;
   - builds.

## Sécurité

- Aucun code arbitraire.
- Noms de tools allowlistés.
- `fetch_url` : HTTP/HTTPS seulement, domaines allowlistés, pas IP privées, timeout, réponse tronquée.
- Max tool calls/message.
- Logs via observabilité existante ou logger tool.

## Hors scope M8 V1

- MCP.
- Skills.
- RAG vectoriel.
- Reprise multi-turn native avancée provider avec plusieurs allers-retours complexes.
- Persist tool events en base.

## Validation

M8 terminé si un agent peut déclarer un tool, le chat config l'affiche, le backend exécute au moins `current_datetime` dans la boucle, `knowledge_search`/`fetch_url` sont bornés, et UI montre l'appel tool.
