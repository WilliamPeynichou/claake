# Plan de correction — Milestone 5 (Qualité agent)

Date : 2026-07-06
Branche : `feature/milestone-5-agent-quality`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 5
Réf plan : `docs/suivi_roadmap/plans/2026-07-06-finir-milestone-5.md`

## Constat de vérification

Code fonctionnel, critère terminé respecté :

- Prisma : champs `variables`, `fewShotExamples`, `outputFormat`, `qualityChecklist` +
  migration `0008_add_agent_quality_fields` (JSONB / TEXT / TEXT[]).
- Propagation complète : entity, mapper, repository, DTO create/update, transformer,
  `AgentResponseDto`, `AgentChatConfig`, shared types (`snake_case` côté API).
- `SendMessageUseCase` enrichit le system prompt backend (variables, few-shot, format) —
  le front ne compose pas le prompt final.
- Web : champs create/edit, affichage détail public + admin review.
- Tests : 30 suites, **178 passés**. `api-build` OK, `web-build` OK.
- Docs à jour : roadmap M5 → 100% fonctionnel V1, suivi_roadmap README, plan + compte-rendu.

## Correction appliquée pendant la vérification

- [x] **Erreur Biome format** dans
  `backend/src/modules/agents/infrastructure/repositories/prisma-agent.repository.ts`
  (indentation bloc `create`) — corrigée via `biome format --write`. Aucun autre diagnostic
  d'erreur sur le périmètre M5 (warnings restants = préexistants hors scope).

## Corrections restantes (process, aucune sur le code)

### Lot 1 — Traçabilité git (bloquant)

- [ ] Commiter le scope M5 sur `feature/milestone-5-agent-quality` :
  backend (agents + chat + prisma + migration), shared, frontendWeb
  (new/edit/détail/review), docs (roadmap, suivi_roadmap, plan, compte-rendu),
  `tasks/todo.md`, y compris le fix de format ci-dessus.
  - message : `feat(agents): finish milestone 5 agent quality fields`
- [ ] Exclure le bruit non lié (`.claakecode/`, `.codex/`, `AGENTS.md`,
  `ClaakePresentation/`, sous-module `skills`).

### Lot 2 — Merge et nettoyage (bloquant)

- [ ] Merge `--no-ff` → `main` : `merge: feature/milestone-5-agent-quality → main (milestone 5)`.
- [ ] Push `main`, supprimer la branche locale et distante.

### Lot 3 — Dette (non bloquant, à planifier)

- [ ] Appliquer la migration `0008` sur les environnements réels
  (`prisma migrate deploy`) — bloqué tant que `backend/.env` est vide.
- [ ] UX : remplacer les textareas JSON/lignes par un éditeur dédié (avec l'Agent Builder
  commun, dette M2).
- [ ] Test live du prompt enrichi avec un provider réel (bloqué par credentials).

## Critère terminé

```txt
fix format commité avec le scope M5
→ branche mergée --no-ff dans main + push
→ branche supprimée
→ dette migration/UX/live tracée
```
