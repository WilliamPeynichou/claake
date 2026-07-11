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
- [x] Fallback Mistral OCR (`mistral-ocr-latest`) pour les PDF sans texte extractible.
- [x] Tests ciblés du fallback OCR et de ses erreurs de configuration/fournisseur.
- [x] Tests ciblés et suite complète.
- [x] Lint + builds API/web/desktop.
- [x] Plan, compte-rendu, README suivi et roadmap mis à jour.

## Extension OCR Mistral

1. Conserver `pdf-parse` comme chemin principal pour les PDF texte.
2. Appeler Mistral OCR uniquement lorsque l'extraction locale est vide.
3. Borner la durée de l'appel et normaliser/limiter le texte OCR comme le texte local.
4. Retourner des erreurs utilisateur explicites si la clé manque ou si le fournisseur échoue.
5. Couvrir le chemin local, le fallback OCR et les erreurs par des tests unitaires.

## Vérifications

- Backend : 38 suites, 231 tests OK.
- Backend e2e : 1/1 OK.
- Lint : 0 erreur (warnings préexistants).
- Builds API/web/desktop : OK.
- Prisma generate : OK.

## Review OCR Mistral

- Extraction locale conservée en priorité ; aucun appel OCR pour un PDF texte.
- PDF image envoyé en base64 à `POST /v1/ocr` avec `mistral-ocr-latest`.
- Timeout de 30 secondes, texte normalisé et borné à 200 000 caractères.
- Configuration ajoutée : `MISTRAL_API_KEY` dans `backend/.env.example`.
- Tests ciblés : 5/5 OK.
- Suite backend : 38 suites, 234 tests OK.
- Build backend : OK.
- Biome ciblé : OK ; lint global : 0 erreur, 161 warnings préexistants.

## Dette explicite

- Index vectoriel IVFFlat/HNSW à tuner après volume réel.
- Imputation avancée coûts embeddings créateur/utilisateur.
