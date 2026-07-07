# Plan — Refactor Agent Builder commun

Date : 2026-07-06
Branche cible : `feature/agent-builder-refactor`
Réf : `docs/roadmap-claake-agents-chat.md` — instruction technique 7 (« Refactor obligatoire
de l'Agent Builder »), dette héritée Milestone 2.
Réf architecture : `docs/architecture/analyse-technique-architecture-claake.md`

## Contexte et problème

La création et l'édition d'agent sont deux gros formulaires séparés qui dupliquent la même
logique (état, parsing `.agentjson`, construction du payload, rendu des champs) :

```txt
frontendWeb/app/(dashboard)/dashboard/agents/new/page.tsx        ~1079 lignes
frontendWeb/app/(dashboard)/dashboard/agents/[id]/edit/page.tsx   ~691 lignes
```

Conséquences :

- Chaque nouveau champ agent (ex. champs qualité M5 : `variables`, `fewShotExamples`,
  `outputFormat`, `qualityChecklist`) doit être ajouté deux fois, à deux endroits divergents.
- Le parsing `.agentjson` et le mapping snake_case ↔ camelCase sont dupliqués et déjà
  légèrement désynchronisés entre create et edit.
- Les pages Next.js violent l'instruction 5 (« ne pas grossir les pages `page.tsx` »).

Objectif : un builder unique, réutilisé par create et edit, dans
`frontendWeb/features/agents/builder/`, avec des routes fines.

## Contraintes d'architecture

- Backend reste source de vérité (validation finale via `ValidateAgentUseCase`, `submit`).
- API publique `snake_case` ; conversion explicite dans une lib du builder, pas dispersée.
- Réutiliser `@claake/shared` pour types, providers, modèles, stratégies, statuts et labels
  (instruction 8). Extraire vers `shared` ce qui est aujourd'hui codé en dur dans les pages.
- Zéro changement backend nécessaire (feature purement frontend). Toute divergence de
  comportement create vs edit doit être pilotée par un `mode: "create" | "edit"`.
- Pas de régression fonctionnelle : mêmes champs, mêmes étapes, même parsing, même payload.

## Structure cible

```txt
frontendWeb/features/agents/builder/
├── agent-builder-page.tsx        # point d'entrée, gère mode create/edit + chargement agent
├── agent-builder-form.tsx        # orchestration steps + navigation + submit
├── agent-builder.reducer.ts      # état formulaire (remplace les multiples useState)
├── agent-builder.types.ts        # AgentBuilderState, AgentBuilderMode, StepId
├── steps/
│   ├── import-step.tsx           # upload .agentjson (create) / info source (edit)
│   ├── metadata-step.tsx         # name, slug, description, longDescription, category, tags, image
│   ├── behavior-step.tsx         # systemPrompt, welcomeMessage, suggestedPrompts, limitations
│   ├── quality-step.tsx          # variables, fewShotExamples, outputFormat, qualityChecklist (M5)
│   ├── model-step.tsx            # provider, model, mode
│   ├── execution-step.tsx        # cloudStrategy, requiredUserProvider, sellerApiKey, endpoint
│   ├── pricing-step.tsx          # priceType, price
│   └── submit-step.tsx           # validation + résumé + création/sauvegarde/soumission
└── lib/
    ├── parse-agent-json.ts       # parsing .agentjson → AgentBuilderState (unifié)
    ├── build-create-agent-payload.ts
    ├── build-update-agent-payload.ts
    └── validate-agent-builder.ts # validation légère client, backend reste final
```

Routes réduites à un import :

```tsx
// app/(dashboard)/dashboard/agents/new/page.tsx
import { AgentBuilderPage } from "@/features/agents/builder";
export default function NewAgentPage() {
	return <AgentBuilderPage mode="create" />;
}
```

```tsx
// app/(dashboard)/dashboard/agents/[id]/edit/page.tsx
import { AgentBuilderPage } from "@/features/agents/builder";
export default function EditAgentPage() {
	return <AgentBuilderPage mode="edit" />;
}
```

## Différences create vs edit à absorber dans le builder

| Aspect | create | edit |
|---|---|---|
| Source initiale | `INITIAL_FORM` + parsing `.agentjson` | `apiClient.agents.get(id)` mappé vers l'état |
| Étape import | active | masquée ou lecture seule |
| Action finale | `agents.create` → puis `submit` | `agents.update` (statuts `DRAFT`/`REJECTED`) |
| Contrôle statut | nouvel agent en `DRAFT` | garde le statut, respecte règles édition backend |

## Étapes d'exécution

1. **Extraire dans `shared`** (instruction 8) les constantes aujourd'hui en dur :
   providers, modèles, stratégies d'exécution, formats endpoint, statuts, labels français.
2. **Poser les types** `agent-builder.types.ts` : `AgentBuilderState` (aligné sur les champs
   Prisma/DTO), `AgentBuilderMode`, `StepId`, actions du reducer.
3. **Reducer** `agent-builder.reducer.ts` : remplacer les `useState` épars par un état unique
   + actions (`setField`, `hydrateFromAgent`, `hydrateFromJson`, `reset`).
4. **Lib** : `parse-agent-json.ts` (unifié depuis les deux `handleFileUpload` actuels),
   `build-create-agent-payload.ts`, `build-update-agent-payload.ts`, `validate-agent-builder.ts`.
5. **Steps** : découper le rendu des deux pages en composants d'étape purs (props =
   slice d'état + dispatch).
6. **Orchestration** : `agent-builder-form.tsx` (navigation steps, submit selon `mode`) et
   `agent-builder-page.tsx` (chargement catégories + agent si edit, auth, redirections).
7. **Router les pages** `new` et `[id]/edit` vers `AgentBuilderPage`.
8. **Nettoyer** l'ancien code inline supprimé.

## Tests / vérifications

- `npm -w @claake/frontend-web run build` (types + build) OK.
- `npx biome check` sur `frontendWeb/features/agents/builder/` OK.
- Parité fonctionnelle vérifiée manuellement (ou via e2e MVP quand dispo) :
  - création draft depuis `.agentjson` ;
  - création draft manuelle ;
  - édition d'un agent `DRAFT`/`REJECTED` ;
  - soumission `PATCH /agents/:id/submit` ;
  - champs qualité M5 présents et persistés dans les deux modes.
- Diff de payload create/edit identique à l'existant (aucune régression backend).

## Critère terminé

```txt
un seul builder dans frontendWeb/features/agents/builder/
→ routes new + edit réduites à un import de AgentBuilderPage
→ un champ agent ne s'ajoute plus qu'à un seul endroit
→ parité fonctionnelle create/edit + submit
→ build + biome OK
→ merge --no-ff dans main + push + suppression branche
```

## Hors périmètre

- Nouveaux champs agent (aucun ajout fonctionnel : refactor iso-fonctionnel).
- Changement backend / DTO / validation.
- Éditeur riche pour les champs qualité JSON (dette UX M5, à traiter après).
- Wizard multi-agents / import en masse.
