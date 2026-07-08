# Compte-rendu — M6 / F5.3 : UI web base de connaissances

Date : 2026-07-08
Branche : `feature/m6-knowledge-ui`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 6 / Feature 5.3
Suite de : `docs/suivi_roadmap/comptes-rendus/2026-07-08-m6-knowledge-base.md`

## Résumé

UI créateur pour la base de connaissances agent, branchée sur les endpoints backend
`GET/POST/DELETE /agents/:id/knowledge` livrés précédemment. Section ajoutée à la page
d'édition d'agent (Agent Builder commun).

## Fichiers

- `frontendWeb/features/agents/knowledge/knowledge-manager.tsx` (nouveau) — liste, ajout
  (titre + contenu), suppression, via `apiClient.agents.knowledge`.
- `frontendWeb/features/agents/knowledge/index.ts` (nouveau).
- `frontendWeb/features/agents/builder/edit-agent-flow.tsx` — section « Base de connaissances »
  après « Médias & Documents ».

## Vérifications

- `npm -w @claake/frontend-web run build` : compilation + types OK.
- Build web complet (env factices) OK, route `/dashboard/agents/[id]/edit` = 142 B.
- Biome sur le périmètre : OK.

## Livraison Git

- Commit `feat(web): agent knowledge base UI in agent editor (M6/F5.3)`.
- Merge `--no-ff` → `main`, push, branche supprimée.

## Dette / suite

- Recherche vectorielle (pgvector/embeddings) + chunking (backend).
- Ingestion PDF/binaire (V1 = texte collé).
- Affichage/édition inline d'un document existant (V1 = ajout/suppression).
