# Phase A — Gates CI et artefact backend

Date : 2026-07-16
Branche : `fix/phase-a-ci-deployment-gates`

## Changements

- Test E2E backend réaligné avec `AgentSkillContextService` et API `ToolRegistryService.prepare`.
- Typechecks autonomes ajoutés pour `shared` et mobile, puis branchés à la CI.
- `.dockerignore` racine ajouté : secrets locaux, dépendances, caches et artefacts exclus.
- Image backend alignée sur Node 22.
- Build Docker rendu bloquant : aucune commande de build ignorée silencieusement.
- Chemin runtime corrigé vers `dist/src/main.js`.
- Job CI dédié ajouté avec PostgreSQL 16 + pgvector :
  1. base vierge ;
  2. `prisma migrate deploy` ;
  3. `prisma migrate status` ;
  4. build image backend ;
  5. démarrage image ;
  6. smoke `GET /health`.
- Rapport Playwright conservé sept jours lors d'un échec.

## Preuves locales

- Backend unitaire : 49 suites, 303 tests réussis.
- Backend E2E : 1 suite, 1 test réussi.
- Typechecks `shared` et mobile : réussis.
- Lint bloquant : réussi.
- Scan secrets et audit high/critical : réussis ; 10 vulnérabilités modérées Expo restent
  acceptées selon la clôture Phase B.
- Build backend : réussi.
- 14 migrations appliquées depuis une base PostgreSQL/pgvector vierge.
- `prisma migrate status` : schéma à jour.
- Image Docker backend construite avec Node 22.
- Image démarrée contre la base migrée ; `/health` retourne `{"data":{"status":"ok"}}`.

## Défaut détecté par le nouveau gate

L'ancien Dockerfile lançait `dist/main.js`, absent de l'artefact NestJS. Le fichier réel est
`dist/src/main.js`. Le smoke image a détecté ce défaut avant staging ; le `CMD` est corrigé.

## Limites restantes

- Le job doit encore être exécuté sur GitHub Actions via push/PR pour confirmer l'environnement
  hébergé, même si chaque étape a été reproduite localement.
- Aucun déploiement staging distant n'est ajouté dans ce bloc : projet Supabase, hébergeurs, URLs
  HTTPS et secrets GitHub Environment restent requis.
- Le saut historique des noms de migrations `0009` vers `0015` ne bloque pas Prisma : les 14
  migrations sont découvertes et appliquées dans l'ordre. Renommer des migrations déjà publiées
  serait plus risqué que conserver cette numérotation.
