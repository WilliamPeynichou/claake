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

## Index plans

- `plans/2026-07-03-finir-milestone-1.md` — Plan de finition Milestone 1 (chat agent utilisable).
- `plans/2026-07-04-finir-milestone-2.md` — Plan de finition Milestone 2 (création agent V1).
- `plans/2026-07-06-finir-milestone-3.md` — Plan de finition Milestone 3 (admin review). **✅ Réalisé et livré.**
- `plans/2026-07-06-correction-milestone-4.md` — Plan de correction process/doc Milestone 4. **✅ Appliqué.**
- `plans/2026-07-06-finir-milestone-4.md` — Plan de finition Milestone 4 (desktop chat). **✅ Réalisé et livré.**
- `plans/2026-07-06-finir-milestone-5.md` — Plan de finition Milestone 5 (qualité agent). **✅ Réalisé.**
- `plans/2026-07-06-correction-milestone-5.md` — Plan de correction process Milestone 5. **✅ Appliqué.**
- `plans/2026-07-06-refactor-agent-builder.md` — Plan de refactor Agent Builder commun (dette M2). ⏳ À faire.

## État des milestones

| Milestone | État | Intégration `main` |
|---|---|---|
| 0 — Socle technique agent-chat | ✅ 100% | mergé |
| 1 — Chat agent utilisable | ✅ 100% | mergé |
| 2 — Création agent V1 | ✅ 100% fonctionnel | mergé (`17051ec`) |
| 3 — Admin review | ✅ 100% MVP | mergé (`9ea47b8`) |
| 4 — Desktop chat | ✅ 100% fonctionnel V1 | mergé |
| 5 — Qualité agent | ✅ 100% fonctionnel V1 | branche `feature/milestone-5-agent-quality` |
| 6 — Fichiers et connaissance | 🟡 ~35% | — |
| 7 — Beta publique contrôlée | 🟡 ~45% | — |

Prochain verrou recommandé : **Milestone 6 — Fichiers et connaissance** ou dette **Agent Builder commun** avant d'ajouter plus de champs.
