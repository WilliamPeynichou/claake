# Phase A — Staging o2Switch + Supabase

Branche : `feat/phase-a-staging-o2switch`

## Plan

- [x] Lier le projet Supabase existant comme staging temporaire et documenter l'acceptation.
- [x] Inventorier migrations distantes avant toute application.
- [x] Créer GitHub Environment `staging`.
- [x] Injecter URL et clés Supabase dans GitHub sans afficher leurs valeurs.
- [x] Produire artefacts Next standalone et NestJS compatibles Passenger.
- [x] Ajouter workflow manuel de build/déploiement o2Switch, bloqué sans secrets SSH.
- [x] Documenter création sous-domaines, apps Node 22, variables, SSH, smoke et rollback.
- [x] Vérifier builds, lint, sécurité et artefacts.
- [x] Documenter résultats et blocages opérateur.

## Review

- Repo lié au projet Supabase existant comme staging temporaire.
- Isolation staging/prod explicitement non satisfaite : projet production séparé obligatoire avant
  ouverture publique.
- Migration Storage `20260715153000` présente localement mais absente du distant ; non appliquée
  automatiquement tant que l'impact sur les données existantes n'est pas confirmé.
- GitHub Environment `staging` créé.
- Sept secrets Supabase configurés dans cet Environment, valeurs jamais affichées.
- Next.js utilise maintenant `output: "standalone"`; build complet vert et artefact SSR
  `frontendWeb/.next/standalone/frontendWeb/server.js` confirmé.
- NestJS détecte Phusion Passenger et utilise sa socket sans modifier le port hors o2Switch.
- Workflow manuel o2Switch : validation config, builds CI, archives, SSH avec `known_hosts`, releases
  atomiques, restart Passenger et smoke web/API.
- Aucun déploiement ni migration automatique avant création des sous-domaines HTTPS, configuration
  SSH o2Switch et variables GitHub restantes.
- Vérifiés : build web, build API, lint, scanner secrets, YAML workflow et `git diff --check`.
- Runbook : `docs/releases/deploiement-staging-o2switch.md`.
