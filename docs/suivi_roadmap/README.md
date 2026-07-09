# Suivi roadmap Claake agents-chat

Ce dossier sert au suivi de `docs/roadmap-claake-agents-chat.md`.

Deux types de documents :

- `comptes-rendus/` : comptes rendus de développement (ce qui a été fait, quand, résultats).
- `plans/` : plans pour la suite (ce qui va être fait, comment, critères).

## Convention de nommage

```txt
comptes-rendus/AAAA-MM-JJ-sujet.md
plans/AAAA-MM-JJ-sujet.md
```

## Index comptes rendus

- `comptes-rendus/2026-07-03-socle-agent-chat.md` — Milestone 0 finalisé + refactor ChatShell + durcissement sécurité.
- `comptes-rendus/2026-07-04-finition-milestone-1.md` — Milestone 1 finalisé (retry, capabilities upload, retour clé API, page détail).
- `comptes-rendus/2026-07-06-finition-milestone-3.md` — Milestone 3 finalisé MVP (review admin enrichie, test chat admin, transitions review). **Mergé dans `main` (`9ea47b8`) et poussé.**
- `comptes-rendus/2026-07-06-finition-milestone-4.md` — Milestone 4 desktop chat V1 (auth→agents→chat-config→sessions→streaming→clés API→logout). **Mergé dans `main` et poussé.**
- `comptes-rendus/2026-07-06-finition-milestone-5.md` — Milestone 5 qualité agent V1 (variables, few-shot, format sortie, checklist, prompt enrichi).
- `comptes-rendus/2026-07-06-finition-quotas-chat.md` — Quotas chat simples (F6.2) : messages/minute, /jour, taille prompt, historique. **Mergé dans `main` et poussé.**
- `comptes-rendus/2026-07-08-tests-e2e-mvp.md` — Tests e2e MVP backend : création → test draft → soumission → review admin → chat public.
- `comptes-rendus/2026-07-08-m6-file-enforcement.md` — M6 démarré : enforcement upload par agent (capabilities) côté chat. **Mergé dans `main` et poussé.**
- `comptes-rendus/2026-07-08-m6-knowledge-base.md` — M6/F5.3 : base de connaissances agent V1 (CRUD backend + injection contexte chat). **Mergé dans `main` et poussé.**
- `comptes-rendus/2026-07-08-m6-knowledge-ui.md` — M6/F5.3 : UI web créateur de la base de connaissances (éditeur agent). **Mergé dans `main` et poussé.**
- `comptes-rendus/2026-07-08-m6-finalisation.md` — M6 final V1 : recherche contextuelle simple + édition inline knowledge. **Mergé dans `main` et poussé.**

## Index plans

- `plans/2026-07-03-finir-milestone-1.md` — Plan de finition Milestone 1 (chat agent utilisable).
- `plans/2026-07-04-finir-milestone-2.md` — Plan de finition Milestone 2 (création agent V1).
- `plans/2026-07-06-finir-milestone-3.md` — Plan de finition Milestone 3 (admin review). **✅ Réalisé et livré.**
- `plans/2026-07-06-correction-milestone-4.md` — Plan de correction process/doc Milestone 4. **✅ Appliqué.**
- `plans/2026-07-06-finir-milestone-4.md` — Plan de finition Milestone 4 (desktop chat). **✅ Réalisé et livré.**
- `plans/2026-07-06-finir-milestone-5.md` — Plan de finition Milestone 5 (qualité agent). **✅ Réalisé.**
- `plans/2026-07-06-correction-milestone-5.md` — Plan de correction process Milestone 5. **✅ Appliqué.**
- `plans/2026-07-06-refactor-agent-builder.md` — Plan de refactor Agent Builder commun (dette M2). **✅ Réalisé et livré.**
- `plans/2026-07-06-plan-quotas-chat.md` — Plan quotas chat simples (F6.2, prochaine étape). **✅ Réalisé et livré.**
- `plans/2026-07-08-tests-e2e-mvp.md` — Plan tests e2e MVP backend. **✅ Réalisé.**
- `plans/2026-07-08-m6-file-enforcement.md` — Plan M6 enforcement upload par agent (F5.2). **✅ Réalisé et livré.**
- `plans/2026-07-08-m6-knowledge-base.md` — Plan M6 base de connaissances agent (F5.3). **✅ V1 réalisée et livrée.**

## État des milestones

| Milestone | État | Intégration `main` |
|---|---|---|
| 0 — Socle technique agent-chat | ✅ 100% | mergé |
| 1 — Chat agent utilisable | ✅ 100% | mergé |
| 2 — Création agent V1 | ✅ 100% fonctionnel | mergé (`17051ec`) |
| 3 — Admin review | ✅ 100% MVP | mergé (`9ea47b8`) |
| 4 — Desktop chat | ✅ 100% fonctionnel V1 | mergé |
| 5 — Qualité agent | ✅ 100% fonctionnel V1 | branche `feature/milestone-5-agent-quality` |
| 6 — Fichiers et connaissance | ✅ 100% fonctionnel V1 | F5.2 enforcement + F5.3 knowledge base + recherche contextuelle simple |
| 7 — Beta publique contrôlée | 🟡 ~60% | e2e MVP backend ajouté, reste CI/observabilité/e2e UI |
| 8 — Tool calling agent | ⚪ 0% | port provider événements tools, ToolRegistry, tools intégrés |
| 9 — Embeddings et RAG | ⚪ 0% | pgvector, chunking, ingestion PDF, retrieval vectoriel |
| 10 — MCP | ⚪ 0% | client MCP backend, serveurs par agent, allowlist admin |
| 11 — Skills | ⚪ 0% | paquets instructions+ressources, injection contextuelle, marketplace |

Prochain verrou recommandé : **Milestone 7 — Beta publique contrôlée** (CI, observabilité, e2e UI Playwright quand env test prêt), puis **Phase 8 — Outillage IA** (M8 tools → M9 embeddings → M10 MCP → M11 skills).
