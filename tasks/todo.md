# Phase A — Gates CI et artefact de déploiement

Branche : `fix/phase-a-ci-deployment-gates`

## Plan

- [x] Réparer le test E2E backend cassé par `AgentSkillContextService`.
- [x] Réduire et sécuriser le contexte Docker avec `.dockerignore`.
- [x] Aligner l'image backend sur Node 22 et supprimer le build silencieusement ignoré.
- [x] Ajouter les typechecks autonomes `shared` et mobile aux scripts/CI.
- [x] Tester les migrations Prisma sur PostgreSQL 16 + pgvector vierge en CI.
- [x] Construire l'image backend en CI et prouver son démarrage via `/health`.
- [x] Conserver les artefacts Playwright lors d'un échec.
- [x] Lancer lint, tests, typechecks, migrations, build Docker et smoke.
- [x] Documenter les résultats.

## Review

- E2E backend réaligné avec `AgentSkillContextService` et `ToolRegistryService.prepare`.
- Job CI `deployment-artifact` : base pgvector vierge, 14 migrations, statut Prisma, build image,
  démarrage et smoke `/health`.
- `.dockerignore` réduit contexte observé d'environ 4,6 Go à 1,45 Mo et exclut fichiers env réels.
- Image Node 22, dépendances de production prunées, chemin runtime corrigé vers
  `dist/src/main.js` après détection par smoke réel.
- `shared` et mobile ont maintenant un typecheck autonome bloquant en CI.
- Rapport Playwright uploadé uniquement en échec, rétention sept jours.
- Preuves : 49 suites/303 tests unitaires, E2E 1/1, lint, typechecks, security check, build API,
  14 migrations sur DB vierge, build Docker et `/health` verts.
- Exécution GitHub Actions sur push/PR et staging distant restent à confirmer ; aucun secret requis
  ou ajouté par ce bloc.
- Détails : `docs/suivi_roadmap/phase-a-gates-ci-artefact-backend.md`.
