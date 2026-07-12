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
- `comptes-rendus/2026-07-09-finition-milestone-7.md` — M7 final : CI PR, e2e UI Playwright smoke, observabilité chat/provider.
- `comptes-rendus/2026-07-09-m8-tool-calling.md` — M8 V1 : ProviderStreamEvent, ToolRegistry, Agent.tools, stream tool events, affichage web/desktop.
- `comptes-rendus/2026-07-09-m9-embeddings-rag.md` — M9 V1 : chunks pgvector, embeddings, retrieval hybride, ingestion PDF.
- `comptes-rendus/2026-07-11-m10-mcp.md` — M10 V1 : serveurs MCP HTTP, credentials chiffrés, review admin, ToolRegistry et UI.
- `comptes-rendus/2026-07-11-m11-skills-markdown-resources.md` — M11 V1 : import sécurisé de ressources Markdown par fichier/dossier.

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
- `plans/2026-07-09-finir-milestone-7.md` — Plan M7 beta technique : CI, Playwright, observabilité. **✅ Réalisé.**
- `plans/2026-07-09-m8-tool-calling.md` — Plan M8 tool calling agent. **✅ V1 réalisé.**
- `plans/2026-07-09-m9-embeddings-rag.md` — Plan M9 embeddings/RAG. **✅ V1 réalisé.**
- `plans/2026-07-11-m10-mcp.md` — Plan M10 MCP. **✅ V1 réalisée.**
- `plans/2026-07-11-m11-skills-markdown-resources.md` — Plan M11 import de ressources Markdown. **✅ V1 réalisée.**

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
| 7 — Beta publique contrôlée | ✅ 100% fonctionnel beta technique | CI PR + e2e UI Playwright smoke + observabilité chat/provider livrés |
| 8 — Tool calling agent | ✅ 100% fonctionnel V1 fondation | ProviderStreamEvent + ToolRegistry + Agent.tools + affichage tool events + Anthropic/OpenAI natif multi-turn |
| 9 — Embeddings et RAG | ✅ 100% fonctionnel V1 | pgvector, chunking, embeddings optionnels, PDF, retrieval vectoriel + fallback keyword |
| 10 — MCP | ✅ 100% fonctionnel V1 | Serveurs MCP Streamable HTTP, credentials AES-256-GCM write-only, découverte/sélection, review admin, ToolRegistry figé et UI web |
| 11 — Skills | ✅ 100% fonctionnel V1 | Skills par agent, import fichier/dossier Markdown strict et ressources persistées ; injection contextuelle, marketplace et review admin V2 |

Prochain verrou recommandé : **Skills V2** (injection, partage, marketplace/review), puis env staging/Supabase test pour ouverture beta réelle.
