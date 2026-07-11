# Correction M9 — suite vérification code (2026-07-11)

Vérification code vs docs `plans/2026-07-09-m9-embeddings-rag.md` + compte-rendu.
Conforme globalement (tests M9 : 5 suites, 29 pass). Écarts à corriger :

## Checklist correction

- [x] 1. `KnowledgeIndexService.indexDocument` : UPDATE vecteurs batché en un seul
      `UPDATE ... FROM (VALUES ...)` — plus de risque timeout transaction.
- [x] 2. Seuil de similarité cosine `MIN_RETRIEVAL_SCORE = 0.3` dans `retrieve` ;
      chunks sous le seuil exclus → fallback keyword.
- [ ] 3. Documenter/aligner la limite : PDF 200k chars extraits mais ~100k indexés en vecteur
      (100 chunks max). Soit relever `MAX_KNOWLEDGE_CHUNKS` avec batching embed, soit noter
      la limite dans le compte-rendu.
- [ ] 4. Incohérence tailles : DTO texte 20k vs PDF 200k via le même `add()` — borner ou
      documenter explicitement le chemin PDF.
- [ ] 5. `KnowledgeIndexService.removeDocument` jamais appelé (cascade DB couvre) : supprimer
      ou brancher dans `AgentKnowledgeService.remove` pour cohérence explicite.
- [ ] 6. Plan M9 : cocher le dernier item Lot 5 (commit/merge/push) si livré, sinon livrer.
- [x] Tests + lint + build après corrections (jest knowledge-index 6/6, biome OK,
      erreurs tsc préexistantes sur main non liées).

Priorité : 1 et 2 (comportement), 3–6 (hygiène/doc).

---

# Milestone 10 — Intégration MCP chat

## Lot ToolRegistry / SendMessage

- [x] Identifier et injecter optionnellement le port MCP sans modifier les providers.
- [x] Rendre la préparation du catalogue asynchrone et figée par message.
- [x] Router les exécutions built-in et MCP via le catalogue préparé, quota commun inclus.
- [x] Ajouter les tests de régression registry et use case.
- [x] Lancer les tests ciblés et le build backend.

## Review

- `MCP_TOOL_PORT` reste optionnel : le chat fonctionne sans module MCP/provider enregistré.
- Catalogue préparé une seule fois par message, définitions gelées et exécuteurs capturés.
- Quota commun vérifié avant toute tentative built-in ou MCP.
- Tests ciblés : 2 suites, 34 tests OK.
- Build backend : OK ; Biome ciblé : aucune erreur (warnings préexistants dans les specs).

---

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
