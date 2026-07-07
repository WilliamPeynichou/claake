# Plan — Refactor Agent Builder commun

Date : 2026-07-06
Branche : `feature/agent-builder-refactor`
Réf : `docs/suivi_roadmap/plans/2026-07-06-refactor-agent-builder.md`

## Réalisé

- Constantes builder extraites vers `shared/lib/constants.ts` : `CLOUD_STRATEGIES`,
  `ENDPOINT_FORMATS`, `BUILDER_PROVIDER_OPTIONS`.
- Feature `frontendWeb/features/agents/builder/` :
  - `agent-builder.types.ts` — `AgentBuilderForm`, `INITIAL_AGENT_FORM`, `SetField`, `BuilderMode`.
  - `agent-builder.reducer.ts` — `useAgentBuilderForm` (setField/hydrate/reset).
  - `lib/parse-agent-json.ts`, `lib/agent-to-form.ts`, `lib/build-agent-payload.ts`
    (create + update), `lib/validate-agent-builder.ts`.
  - `steps/` — `metadata`, `model`, `behavior`, `quality`, `execution` (field-groups partagés).
  - `create-agent-flow.tsx` (wizard 5 étapes) et `edit-agent-flow.tsx` (single-page,
    `isEditable`, FileUploader), tous deux consommant steps + lib.
  - `agent-builder-page.tsx` — dispatch `mode="create"|"edit"`, `index.ts`.
- Routes réduites à un import :
  - `dashboard/agents/new/page.tsx` : 1079 → 5 lignes.
  - `dashboard/agents/[id]/edit/page.tsx` : 691 → 5 lignes.

Un champ agent ne s'ajoute désormais qu'à un seul endroit (types + step + payload lib).

## Vérifications

- `npm -w @claake/frontend-web run build` : compilation + types OK.
- Build web complet (env factices) OK — `/dashboard/agents/new` et `/edit` = 142 B.
- `npx biome check` sur builder + shared + routes : OK.

## Parité conservée

- Wizard création (import .agentjson, image, pricing free, review, success + CTA test/edit).
- Édition brouillon/rejeté, gating `isEditable`, remplacement config, FileUploader médias.
- Payloads create/update identiques à l'existant (mêmes champs, mêmes conditions).

## Écart assumé

- Constantes builder placées dans `shared` (plan) ; strategy `desc` affichée aussi en édition
  (léger + UX, non régressif).
- Test live non exécuté (backend `.env` vide) — parité vérifiée par build + revue de payload.
