# Plan — Milestone 13 Staging, beta et Skills publiques

Date : 2026-07-12
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 13
Origine : reliquats explicitement reportés par M12.

## Objectif

Passer de la V1/V2 fonctionnelle à une beta réelle opérable, puis étendre les skills
privées créateur en compétences publiques, révisées et sélectionnées sémantiquement.

```txt
staging Supabase + CI
→ e2e MCP live
→ beta développeurs invités
→ marketplace/review skills
→ sélection vectorielle skills
```

## Lot 1 — Staging et beta (bloquant)

- [ ] Créer projet Supabase staging, clés/URLs séparées et secrets CI.
- [ ] Configurer API/web/desktop staging, dont `NEXT_PUBLIC_SUPABASE_URL`.
- [ ] Débloquer collecte pages Next et build production complet en CI.
- [ ] E2E serveur MCP HTTP réel contre staging (auth, SSRF, review, révocation).
- [ ] Inviter premiers développeurs et mettre en place procédures incident/rollback.

## Lot 2 — Marketplace et review Skills

- [ ] Statuts `DRAFT/PENDING/APPROVED/REJECTED/SUSPENDED` pour skills publiques.
- [ ] Endpoints/file admin de review, avec raisons et audit.
- [ ] Marketplace/annuaire : recherche, détail, attachement d'une skill approuvée.
- [ ] Ownership, visibilité privée/publique et révocation immédiate des skills attachées.
- [ ] UI bibliothèque : attacher/détacher une skill créateur existante à plusieurs agents.

## Lot 3 — Sélection vectorielle Skills

- [ ] Chunks/embeddings des ressources skills, réutilisant pipeline M9.
- [ ] Retrieval hybride ressources skills : cosine top-k puis fallback keyword M12.
- [ ] Réindexation création/modification/import ; limites coûts et prompt.
- [ ] Tests retrieval, fallback, ownership et réindexation.

## Lot 4 — Exploitation après volume réel

- [ ] Mesurer corpus/latence pgvector ; créer index IVFFlat et régler `lists/probes`.
- [ ] Mesurer usage/coûts embeddings ; définir et implémenter imputation créateur/utilisateur.
- [ ] Évaluer circuit breaker MCP process-local sous multi-instance ; rendre distribué/persistant si nécessaire.
- [ ] Évaluer épinglage socket anti DNS rebinding ; implémenter seulement si risque mesuré/justifié.

## Critère terminé

```txt
staging reproductible et CI verte
→ e2e MCP live prouve parcours sécurisé complet
→ beta développeurs invitée et exploitable
→ skill publique revue, attachée et sémantiquement sélectionnée
→ tuning/coûts pilotés par métriques réelles
```
