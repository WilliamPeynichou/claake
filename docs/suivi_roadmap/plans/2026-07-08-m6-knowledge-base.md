# Plan — M6 / F5.3 : base de connaissances agent

> **Statut : ✅ V1 réalisée et livrée.** Voir `docs/suivi_roadmap/comptes-rendus/2026-07-08-m6-knowledge-base.md`.

Date : 2026-07-08
Branche : `feature/m6-knowledge-base`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 6 / Feature 5.3
Réf archi : `docs/architecture/analyse-technique-architecture-claake.md`

## Objectif

Permettre à un créateur d'attacher des documents de connaissance à son agent, et injecter
ce contexte dans les réponses du chat. Le backend reste source de vérité.

## Portée V1 (simple, backend d'abord)

```txt
créateur ajoute un document de connaissance (titre + texte)
→ liste / supprime ses documents
→ le chat injecte la connaissance dans le system prompt (contexte)
```

Hors V1 (dette tracée) :

- recherche vectorielle (pgvector) / embeddings ;
- ingestion PDF/binaire (V1 = texte fourni) ;
- UI web créateur (V1 = endpoints backend + shared) ;
- ranking / chunking avancé.

« Recherche contextuelle simple » V1 = inclusion des documents de l'agent (plafonnée en
taille), à la manière de `buildQualitySystemPrompt` (variables/few-shot).

## Modèle

Prisma `AgentKnowledge` :

```prisma
model AgentKnowledge {
  id        String   @id @default(uuid())
  agentId   String   @map("agent_id")
  agent     Agent    @relation(fields: [agentId], references: [id], onDelete: Cascade)
  title     String
  content   String
  createdAt DateTime @default(now()) @map("created_at")
  @@index([agentId])
  @@map("agent_knowledge")
}
```

Migration `0009_add_agent_knowledge`. Relation `knowledge AgentKnowledge[]` sur `Agent`.

## Backend

- Port `AgentKnowledgeRepositoryPort` : `create`, `listByAgent`, `findById`, `delete`.
- Impl Prisma.
- Use cases (ownership créateur/admin) :
  - `AddAgentKnowledgeUseCase`
  - `ListAgentKnowledgeUseCase`
  - `DeleteAgentKnowledgeUseCase`
- Endpoints sous agents :
  - `POST /agents/:id/knowledge`
  - `GET /agents/:id/knowledge`
  - `DELETE /agents/:id/knowledge/:knowledgeId`
- Injection chat : `SendMessageUseCase` charge la connaissance de l'agent et l'ajoute au
  system prompt (section « Base de connaissances »), taille totale plafonnée
  (`MAX_KNOWLEDGE_CHARS`).

## Shared

- Type `AgentKnowledge` (`snake_case` API).
- `apiClient.agents.knowledge.{list,create,delete}`.

## Tests

- add/list/delete avec ownership (refus si non créateur/non admin) ;
- injection : le system prompt contient la connaissance, plafonné ;
- agent sans connaissance : prompt inchangé.

## Critère terminé

```txt
CRUD knowledge backend + ownership
→ injection contexte dans le chat (plafonnée)
→ shared types + client
→ migration 0009 incluse
→ tests backend verts + api-build
→ merge --no-ff dans main + push + suppression branche
```

## Hors périmètre

- Embeddings / recherche vectorielle (dette).
- UI web créateur (lot suivant).
- Ingestion de fichiers binaires.
