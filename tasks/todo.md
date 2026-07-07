# Plan — Milestone 5 Qualité agent

Date : 2026-07-06
Branche : `feature/milestone-5-agent-quality`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 5

## Objectif

Améliorer qualité réelle des agents sans casser le noyau agent → chat :

```txt
variables
→ few-shot examples
→ output format
→ quality checklist
→ prompt final mieux cadré
```

## Contraintes architecture

- Backend source de vérité pour stockage, validation et injection prompt.
- API publique reste `snake_case`, valeurs lowercase quand enum.
- Prisma/backend interne garde camelCase + enums existants.
- Propagation obligatoire : Prisma, entity, mapper, DTO, transformer, shared types,
  create/update web, review admin, chat-config si utile.
- Pas de refactor Agent Builder complet ici ; modification minimale des formulaires existants.

## Plan

- [x] Ajouter champs Prisma `variables`, `fewShotExamples`, `outputFormat`, `qualityChecklist`.
- [x] Ajouter migration SQL.
- [x] Propager backend DTO/create/update/entity/mapper/repository/transformer.
- [x] Exposer champs dans `AgentResponseDto` et `AgentChatConfig`.
- [x] Injecter variables/few-shot/output format dans le system prompt au moment du chat.
- [x] Ajouter types shared.
- [x] Ajouter champs create/edit web.
- [x] Afficher infos dans page détail et admin review.
- [x] Ajouter tests ciblés backend + build/lint.
- [x] Documenter dans `docs/suivi_roadmap/` et mettre roadmap à jour.

## Critère terminé

```txt
creator configures quality fields
→ backend stores them
→ chat uses them in provider system prompt
→ admin sees them during review
→ public detail/chat-config can display them
```

## Hors périmètre acceptable

- Builder agent commun.
- Checklist persistée comme workflow de validation admin.
- UI sophistiquée type repeatable nested editor ; textarea JSON/lignes OK pour V1.

## Review

- Migration `0008_add_agent_quality_fields` créée.
- Champs qualité ajoutés à Prisma/DTO/entity/mapper/repository/transformer/shared :
  `variables`, `few_shot_examples`, `output_format`, `quality_checklist`.
- `AgentChatConfig` expose ces champs pour clients web/desktop.
- `SendMessageUseCase` enrichit côté backend le `systemPrompt` provider avec variables,
  few-shot et format de sortie. Front ne compose pas prompt final.
- Création/édition web ajoutent champs V1 via textareas JSON/lignes.
- Review admin et page détail public affichent format/checklist/variables/few-shot.
- `shared/api/client.ts` aligne `agents.update()` sur `Partial<CreateAgentInput>`.
- Docs ajoutées :
  - `docs/suivi_roadmap/plans/2026-07-06-finir-milestone-5.md` ;
  - `docs/suivi_roadmap/comptes-rendus/2026-07-06-finition-milestone-5.md`.

## Vérifications

- `npm -w @claake/backend exec prisma generate` OK.
- `npm --workspace backend test -- send-message.usecase.spec.ts get-agent-chat-config.usecase.spec.ts create-agent.usecase.spec.ts update-agent.usecase.spec.ts` OK : 4 suites, 43 tests.
- `npm run api-build` OK.
- `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build` OK.
- Biome ciblé OK.
