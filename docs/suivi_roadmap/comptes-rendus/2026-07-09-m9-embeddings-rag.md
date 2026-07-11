# Compte rendu — Milestone 9 Embeddings et RAG

Date : 2026-07-09
Branche : `feature/m9-embeddings-rag`

## Livré

### Persistance

- Migration `0016_add_agent_knowledge_chunks`.
- Modèle `AgentKnowledgeChunk` : document, agent, index, contenu, embedding pgvector 1536.
- Cascade document/agent + contraintes d'unicité et indexes relationnels.

### Indexation

- `KnowledgeChunkingService` : chunks paragraph-aware de 1200 caractères, overlap 200,
  plafond 100 chunks/document.
- `EmbeddingService` : OpenAI `text-embedding-3-small`, dimensions 1536, timeout 15 s,
  batch borné ; clé `OPENAI_EMBEDDING_API_KEY` optionnelle.
- `KnowledgeIndexService` : remplacement atomique des chunks, stockage vectoriel via SQL
  paramétré, ré-indexation à la création/modification.
- Endpoint owner/admin `POST /agents/:id/knowledge/reindex` pour indexer les documents M6
  existants ; bouton UI créateur.

### Retrieval hybride

- Recherche cosine pgvector top-k quand embeddings configurés.
- Fallback mots-clés M6 automatique si clé/provider/vector SQL indisponible.
- `knowledge_search` et le chat utilisent le même `buildKnowledgeContext` : aucune rupture
  de contrat M8.
- Contexte final toujours plafonné à 6000 caractères.

### PDF et OCR

- `pdf-parse` côté backend, extraction locale prioritaire.
- Endpoint multipart owner/admin `POST /agents/:id/knowledge/pdf`, 10 Mo, throttle 5/min.
- Validation signature/MIME PDF via validator upload existant, refus contenu actif.
- Extraction bornée à 200k caractères.
- PDF image-only : fallback `mistral-ocr-latest`, timeout 30 s, clé serveur
  `MISTRAL_API_KEY` optionnelle.
- API shared `knowledge.createFromPdf()` + import PDF dans `KnowledgeManager` web.

## Vérifications

- Prisma generate : OK.
- Tests ciblés M9 : 5 suites, 26 tests.
- Backend complet : 38 suites, 234 tests.
- Tests OCR ciblés : 5/5.
- Backend e2e : 1/1.
- Biome : 0 erreur (warnings repo préexistants).
- Builds API, web, desktop : OK.

## Sécurité / limites

- Clés embeddings et OCR uniquement serveur, jamais loggées.
- Appel OCR uniquement quand extraction locale ne retourne aucun texte.
- Échec ou absence de configuration OCR produit une erreur utilisateur bornée et explicite.
- SQL vectoriel paramétré via `Prisma.sql`; limite bornée 1..10.
- Pas d'échec chat si embeddings indisponibles.
- Index IVFFlat différé : à créer après volume réel et tuning lists/probes.
- Coût embeddings actuellement clé plateforme (`OPENAI_EMBEDDING_API_KEY`) ; imputation
  créateur/utilisateur avancée reportée après mesure d'usage.
