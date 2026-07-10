# Milestone 9 — Embeddings et RAG

Date : 2026-07-09
Branche : `feature/m9-embeddings-rag`
Plan : `docs/suivi_roadmap/plans/2026-07-09-m9-embeddings-rag.md`

## Objectif

```txt
knowledge texte/PDF
→ chunking
→ embeddings pgvector optionnels
→ retrieval cosine
→ fallback keyword
→ contexte chat / knowledge_search
```

## Checklist

- [x] Prisma `AgentKnowledgeChunk` + migration `0016`.
- [x] Chunking 1200 chars / overlap 200 / 100 chunks max.
- [x] Embeddings OpenAI `text-embedding-3-small` (clé serveur optionnelle, timeout).
- [x] Indexation création/update + réindexation documents M6 existants.
- [x] Retrieval cosine top-k + fallback keyword automatique.
- [x] Import PDF backend validé/borné + shared client + UI web.
- [x] Tests ciblés et suite complète.
- [x] Lint + builds API/web/desktop.
- [x] Plan, compte-rendu, README suivi et roadmap mis à jour.

## Vérifications

- Backend : 38 suites, 231 tests OK.
- Backend e2e : 1/1 OK.
- Lint : 0 erreur (warnings préexistants).
- Builds API/web/desktop : OK.
- Prisma generate : OK.

## Dette explicite

- OCR PDF image-only.
- Index vectoriel IVFFlat/HNSW à tuner après volume réel.
- Imputation avancée coûts embeddings créateur/utilisateur.
