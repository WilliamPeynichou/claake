# Plan — Milestone 12 Consolidation post-audit et Skills V2

Date : 2026-07-11
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 12
Origine : vérifications de code M9/M10/M11 (2026-07-11)

## Objectif

Solder les dettes identifiées lors des audits M9–M11, livrer Skills V2 (la seule brique
fonctionnelle majeure restante de la roadmap V1) et préparer l'ouverture beta réelle.

```txt
dettes M9/M10/M11 soldées
→ skills injectées dans le contexte chat
→ staging opérationnel
→ beta réelle possible
```

## Lots

### Lot 1 — Skills V2 : injection contextuelle

- [ ] Injection des ressources skills dans le system prompt du chat (déclencheurs par
      mots-clés V1, bornée en taille comme la knowledge M6).
- [ ] Réutiliser le pipeline embeddings M9 pour la sélection des ressources (V2).
- [ ] Validation des dépendances skill → tools M8 / serveurs MCP M10 à la sauvegarde.
- [ ] Tests injection, bornes et fallback sans embeddings.

### Lot 2 — Skills V2 : partage et review

- [ ] Relation n-n skills/agents (bibliothèque), migration depuis le lien direct actuel.
- [ ] Workflow DRAFT/PENDING/APPROVED + review admin (réutiliser le pattern MCP M10).
- [ ] Marketplace/annuaire de skills publics (peut glisser en M13 si trop large).

### Lot 3 — Dettes M9 (audit 2026-07-11)

- [ ] PDF longs : couvrir >100 chunks (relever `MAX_KNOWLEDGE_CHUNKS` avec batching
      embeddings par lots de 100) ou documenter la troncature côté UI.
- [ ] Aligner les bornes de contenu : DTO texte 20k vs PDF 200k via le même `add()`.
- [ ] Supprimer ou brancher `KnowledgeIndexService.removeDocument` (code mort, cascade DB couvre).
- [ ] Index IVFFlat pgvector après mesure du volume réel (lists/probes).
- [ ] Imputation des coûts embeddings créateur/utilisateur après mesure d'usage.

### Lot 4 — Dettes M10 (audit 2026-07-11)

- [ ] Quota MCP dédié par message + circuit breaker par serveur (actuellement plafond
      commun M8 uniquement).
- [ ] e2e serveur MCP live (nécessite staging, voir Lot 5).
- [ ] Épinglage socket strict anti DNS rebinding (couche HTTP bas niveau) si mesurable.

### Lot 5 — Staging et beta

- [ ] Environnement staging + Supabase test (`NEXT_PUBLIC_SUPABASE_URL` et clés dédiées).
- [ ] Collecte de pages Next débloquée en CI (dépend de l'env, préexistant hors M10/M11).
- [ ] Premiers développeurs invités — beta contrôlée réelle.

### Lot 6 — Dettes UI historiques

- [ ] Action **Suspendre** dans la gestion globale des agents publiés (dette M3).
- [ ] Code-split desktop, chunk Vite >500 kB (dette M4).
- [ ] UI builder tools graphique au lieu de JSON brut (dette M8).
- [ ] Persistance optionnelle des tool events (dette M8).

## Priorités

1. Lot 1 (valeur produit directe, débloque l'intérêt des skills importées en M11).
2. Lot 5 (débloque e2e live et beta ; prérequis Lot 4 e2e).
3. Lot 3 et Lot 4 (robustesse).
4. Lot 2 puis Lot 6 (extension et confort).

## Critère terminé

```txt
skill importée en M11 influence réellement les réponses de l'agent
→ dettes d'audit M9/M10 soldées ou documentées avec décision
→ staging fonctionnel avec e2e MCP live
→ beta réelle ouverte à des développeurs invités
```
