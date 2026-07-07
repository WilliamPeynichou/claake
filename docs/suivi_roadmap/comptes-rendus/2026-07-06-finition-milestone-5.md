# Compte-rendu — Finition Milestone 5 (Qualité agent)

Date : 2026-07-06
Branche : `feature/milestone-5-agent-quality`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 5
Réf plan : `docs/suivi_roadmap/plans/2026-07-06-finir-milestone-5.md`

## 1. Résumé

Milestone 5 livré en V1 fonctionnelle. Les agents peuvent maintenant porter des champs de
qualité structurants : variables, exemples few-shot, format de sortie et checklist qualité.
Ces champs sont stockés côté backend, exposés aux clients, visibles en création/édition et
review admin, puis utilisés pour enrichir le prompt envoyé au provider IA.

## 2. Modèle et API

Champs ajoutés à `Agent` :

- `variables Json?`
- `fewShotExamples Json? @map("few_shot_examples")`
- `outputFormat String? @map("output_format")`
- `qualityChecklist String[] @default([]) @map("quality_checklist")`

Migration :

```txt
backend/prisma/migrations/0008_add_agent_quality_fields/migration.sql
```

Propagation backend :

- DTO create/update : `variables`, `few_shot_examples`, `output_format`,
  `quality_checklist`.
- `AgentEntity`.
- `AgentMapper`.
- `PrismaAgentRepository` create/update.
- `AgentTransformer`.
- `AgentResponseDto`.
- `AgentChatConfigResponseDto` + `GetAgentChatConfigUseCase`.

## 3. Prompt runtime

`SendMessageUseCase` construit maintenant un `systemPrompt` enrichi :

```txt
base system prompt / long description

Variables agent:
{...}

Exemples few-shot:
[...]

Format de sortie attendu:
...
```

Le backend reste source de vérité. Le frontend ne compose pas le prompt final.

## 4. Shared

`shared/types/index.ts` expose les nouveaux champs dans :

- `CreateAgentInput`
- `Agent`
- `AgentChatConfig`

`shared/api/client.ts` aligne `agents.update()` sur `Partial<CreateAgentInput>`.

## 5. Web

### Création agent

`frontendWeb/app/(dashboard)/dashboard/agents/new/page.tsx` :

- champs V1 ajoutés :
  - variables JSON ;
  - exemples few-shot JSON ;
  - format de sortie ;
  - checklist qualité ;
- parsing depuis `.agentjson` ;
- validation JSON au submit ;
- payload create enrichi ;
- résumé qualité dans l'étape validation.

### Édition agent

`frontendWeb/app/(dashboard)/dashboard/agents/[id]/edit/page.tsx` :

- chargement des champs qualité ;
- édition pour agents `DRAFT` / `REJECTED` ;
- validation JSON au save ;
- payload update enrichi.

### Admin review

`frontendWeb/features/admin/review/admin-review-page.tsx` affiche :

- format de sortie ;
- checklist qualité ;
- variables ;
- few-shot.

### Page détail public

`frontendWeb/app/(public)/agents/[id]/page.tsx` affiche :

- format de réponse ;
- qualité attendue.

## 6. Vérifications

Prisma client :

```txt
npm -w @claake/backend exec prisma generate
```

Tests backend ciblés :

```txt
npm --workspace backend test -- send-message.usecase.spec.ts get-agent-chat-config.usecase.spec.ts create-agent.usecase.spec.ts update-agent.usecase.spec.ts
```

Résultat :

```txt
Test Suites: 4 passed, 4 total
Tests:       43 passed, 43 total
```

Builds :

```txt
npm run api-build
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build
```

Résultat : OK.

Biome ciblé : OK sur fichiers modifiés.

## 7. État roadmap

- Milestone 5 — Qualité agent : `~30%` → `100% fonctionnel V1`.
- Dette restante : UX Agent Builder commun + UI nested propre pour variables/few-shot.

## 8. Suite recommandée

- Milestone 6 — fichiers et connaissance.
- Ou dette structurante : refactor Agent Builder commun avant d'ajouter plus de champs.
- E2E MVP complet incluant qualité agent et review admin.
