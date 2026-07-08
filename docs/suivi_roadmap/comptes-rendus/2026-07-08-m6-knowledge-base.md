# Compte-rendu — M6 / F5.3 : base de connaissances agent

Date : 2026-07-08
Branche : `feature/m6-knowledge-base`
Réf plan : `docs/suivi_roadmap/plans/2026-07-08-m6-knowledge-base.md`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 6 / Feature 5.3

## Résumé

V1 backend de la base de connaissances agent. Un créateur (ou admin) attache des documents
texte à son agent ; le chat injecte ce contexte dans le system prompt. Backend = source de
vérité (ownership, plafonnement). Pas d'UI web dans ce lot (endpoints + shared prêts).

## Données

- Modèle Prisma `AgentKnowledge` (agentId, title, content, createdAt) + relation
  `Agent.knowledge` + migration `0009_add_agent_knowledge`.

## Backend

- `AgentKnowledgeService` : `add` / `list` / `remove` (ownership créateur ou admin),
  `buildKnowledgeContext` (concaténation plafonnée `MAX_KNOWLEDGE_CHARS = 6000`).
- Endpoints :
  - `GET /agents/:id/knowledge`
  - `POST /agents/:id/knowledge` (DTO title ≤200, content ≤20000)
  - `DELETE /agents/:id/knowledge/:knowledgeId`
- Injection chat : `SendMessageUseCase` ajoute la section « Base de connaissances » au
  system prompt via `buildQualitySystemPrompt(agent, knowledgeContext)`.
- Câblage : `AgentKnowledgeService` exporté par `AgentModule`, injecté dans le chat.

## Shared

- Type `AgentKnowledge` (`snake_case`).
- `apiClient.agents.knowledge.{list,create,delete}`.

## Vérifications

- `npm -w @claake/backend run test` : **197/197 OK** (32 suites, +7).
- `npm -w @claake/backend run build` (nest build) : OK.
- Biome périmètre agents/chat/shared : OK.
- « Recherche contextuelle simple » V1 = inclusion plafonnée (pas de vecteurs).

## Livraison Git

- Commit `feat(agents): agent knowledge base V1 (M6/F5.3)`.
- Merge `--no-ff` → `main`, push, branche supprimée.

## Dette / suite

- Recherche vectorielle (pgvector/embeddings) + chunking/ranking.
- Ingestion PDF/binaire (V1 = texte).
- UI web créateur (gestion documents) + affichage.
- Migration `0009` à `prisma migrate deploy` quand `backend/.env` a des credentials.
