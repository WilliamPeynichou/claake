# Plan — Milestone 9 Embeddings et RAG

Date : 2026-07-09
Branche : `feature/m9-embeddings-rag`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 9

## Objectif

Remplacer le ranking mots-clés M6 par un retrieval hybride robuste :

```txt
document knowledge
→ chunking
→ embeddings OpenAI optionnels
→ stockage pgvector
→ recherche cosine top-k
→ fallback keyword sans clé/provider
→ knowledge_search tool
```

Ajouter ingestion PDF créateur vers la knowledge base.

## Contraintes

- Backend source de vérité ; aucun embedding calculé côté client.
- Réutiliser pgvector déjà activé dans Prisma.
- Pas de panne chat si provider embeddings absent : fallback keyword obligatoire.
- Ownership/admin identique au CRUD knowledge existant.
- Taille/chunks/retrieval bornés ; contenu PDF validé par pipeline uploads.
- Ne jamais logger clé API ni contenu documentaire complet.

## Lots

### Lot 1 — Persistance chunks

- [x] Ajouter `AgentKnowledgeChunk` Prisma : document, agent, index, content, embedding vector(1536), timestamps.
- [x] Migration SQL + index agent/document ; index vector différé après mesure du volume.

### Lot 2 — Embedding + chunking

- [x] `EmbeddingService` : OpenAI `text-embedding-3-small`, timeout/taille, clé env optionnelle.
- [x] `KnowledgeChunkingService` : chunks bornés avec overlap.
- [x] Indexer/re-indexer/supprimer chunks avec le CRUD knowledge.

### Lot 3 — Retrieval hybride

- [x] Query embedding + pgvector cosine top-k quand disponible.
- [x] Fallback keyword existant si clé/provider/DB vector indisponible.
- [x] `knowledge_search` continue d'utiliser `buildKnowledgeContext` sans changement client.

### Lot 4 — Ingestion PDF

- [x] Endpoint owner/admin pour créer un document knowledge depuis un PDF uploadé et validé.
- [x] Extraction texte PDF bornée ; fallback Mistral OCR pour PDF sans texte.
- [x] Client partagé + UI créateur minimale.

### Lot 5 — Tests/docs/livraison

- [x] Tests chunking, provider, indexing, fallback, retrieval, ownership PDF.
- [x] Tests complets + e2e + lint + builds api/web/desktop.
- [x] Compte-rendu, README suivi, roadmap M9.
- [ ] Commit feature, merge `--no-ff`, push, suppression branche.

## Critère terminé

```txt
creator adds text/PDF knowledge
→ backend chunks and embeds when configured
→ knowledge_search retrieves relevant chunks by cosine
→ keyword fallback keeps feature available without embedding key
→ update/delete keep index coherent
```
