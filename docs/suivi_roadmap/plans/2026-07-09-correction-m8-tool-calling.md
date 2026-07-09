# Plan de correction — Milestone 8 (Tool calling V1 fondation)

Date : 2026-07-09
Réf : `docs/suivi_roadmap/plans/2026-07-09-m8-tool-calling.md`

## Constat de vérification

Livraison conforme aux claims :

- `Agent.tools` propagé Prisma (migration `0015`, JSONB) → entity → mapper → repo → DTOs →
  transformer → shared (`shared/types/tools.ts`) → `AgentChatConfig.tools`.
- `ProviderStreamEvent` / `ProviderToolDefinition` / `streamEvents?` optionnel +
  `textStreamToEvents` de compat — `streamText` conservé.
- `ToolRegistryService` : `current_datetime`, `knowledge_search`, `fetch_url` borné
  (SSRF `assertPublicHttpUrl`, allowlist domaines par agent — refus si liste vide,
  timeout 5 s via AbortController, sortie plafonnée 20k chars).
- `SendMessageUseCase` : consomme les events, exécute les tools backend, émet
  `tool_result`, observabilité conservée.
- Streaming `8:` contrôleur → parse `8:` dans `shared/hooks/use-chat.ts` →
  `tool_events` affichés web + desktop. Builder web : champ JSON tools.
- Vérifs : 201/201 unit + 1 e2e, `nest build` OK, `next build` OK.
- Dette **M8.1** (mapping natif multi-turn Anthropic/OpenAI) honnêtement tracée :
  en prod, les providers réels n'émettent jamais `tool_call` (compat texte) ;
  seul le mock exerce la boucle.

## Correction appliquée pendant la vérification

- [x] **3 erreurs Biome** (format/organizeImports) dans
  `prisma-agent.repository.ts`, `send-message.usecase.spec.ts`,
  `frontendWeb/components/chat/message.tsx` — auraient cassé la CI ajoutée en M7.
  Fixées via `biome check --write`, tests re-passés.

## Corrections restantes

### Lot 1 — Tests du code sécurité-critique (bloquant)

Aucun test n'a été ajouté (compteur inchangé : 201). Or `ToolRegistryService` est
sécurité-critique. Ajouter `tool-registry.service.spec.ts` :

- [ ] `fetch_url` : refus URL non allowlistée (et allowlist vide → refus) ;
- [ ] `fetch_url` : refus URL privée/SSRF (déjà couvert par `assertPublicHttpUrl`,
  vérifier l'intégration) ;
- [ ] `fetch_url` : troncature sortie > 20k chars ;
- [ ] quota : 6e appel tool dans un message → refus (limite 5) ;
- [ ] tool inconnu / non activé pour l'agent → erreur propre ;
- [ ] `knowledge_search` : délègue bien à `AgentKnowledgeService` ;
- [ ] `current_datetime` : sanity.

Ajouter dans `send-message.usecase.spec.ts` :

- [ ] provider (mock) émet `tool_call` → le use case exécute et émet `tool_result` ;
- [ ] erreur tool → log `tool.call.error` + comportement stream défini.

### Lot 2 — Traçabilité git (bloquant)

- [ ] Brancher `feature/m8-tool-calling`, commiter le scope M8 (avec fixes lint),
  message : `feat(chat): M8 tool calling foundation V1`.
- [ ] Merge `--no-ff` → `main`, push, supprimer la branche.

### Lot 3 — Dette M8.1 (déjà tracée, à planifier)

- [ ] Mapping natif Anthropic `tool_use` (stream + renvoi `tool_result` au provider,
  boucle multi-turn jusqu'à réponse finale).
- [ ] Mapping natif OpenAI function calling.
- [ ] Sans M8.1, le tool calling est inopérant en production (compat texte) —
  à prioriser en tête de M9/M10.

## Critère terminé

```txt
tool-registry.service.spec.ts vert (allowlist, SSRF, quota, troncature)
→ boucle tool_call/tool_result testée dans send-message
→ scope M8 commité + mergé --no-ff + pushé
→ M8.1 planifié comme prochain lot
```
