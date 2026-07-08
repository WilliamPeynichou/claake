# Plan — Finaliser M6 : recherche contextuelle simple

> **Statut : ✅ Réalisé et livré.** Voir `docs/suivi_roadmap/comptes-rendus/2026-07-08-m6-finalisation.md`.

Date : 2026-07-08
Branche : `feature/m6-vector-search`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 6

## Objectif

Finir M6 sans dépendre d'une infra embeddings/pgvector bloquante : fournir une recherche
contextuelle simple, testée, utile, et extensible vers pgvector plus tard.

## Portée livrée

- Ranking lexical des documents de connaissance par requête utilisateur.
- Injection uniquement des documents les plus pertinents dans le system prompt.
- Édition inline côté UI créateur (modifier titre/contenu), pas seulement ajout/suppression.
- API `PATCH /agents/:id/knowledge/:knowledgeId` + shared client.

## Hors scope gardé pour M7+/M6.2

- Embeddings OpenAI/pgvector (nécessite clé/provider + migration vector prod).
- Ingestion PDF automatique (V1 = texte collé).

## Critère terminé

```txt
knowledge search trie par pertinence
→ chat injecte top documents selon dernier message
→ UI permet add/edit/delete
→ tests backend verts + build web/backend
→ docs + roadmap à jour
```
