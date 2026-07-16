# Vulnérabilités npm acceptées

Date : 2026-07-13 — Réf plan : Phase B, `2026-07-12-roadmap-ouverture-publique.md`.

## État après assainissement

- Avant : 15 vulnérabilités (1 critical, 4 high, 10 moderate).
- Après : 10 moderate acceptées, 0 critical/high (`npm run audit:high` vert, gate CI).

## Corrections appliquées

- `npm audit fix` : @babel/core, @xhmikosr/decompress (critical), esbuild, form-data (high),
  js-yaml, multer (high).
- `react-router-dom` 7.13.1 → 7.18.1 (high : RCE turbo-stream, open redirect, XSS).
- Suppression `@swc/cli`/`@swc/core` (backend) : inutilisés (build = tsc, tests = ts-jest) ;
  élimine la chaîne `piscina` (high : prototype pollution → RCE).
- Lockfile régénéré pour purger les résidus.

## Acceptées (10 moderate)

- `uuid < 11.1.1` (GHSA-w5hq-g745-h8pq : bounds check manquant v3/v5/v6 avec `buf`)
  via la toolchain Expo (`@expo/cli`, `@expo/config*`, `xcode`, …).
- Justification : dépendances de build du prototype mobile `frontendAppMob` (mocké,
  hors périmètre du lancement public — cf. Phase F). Aucune exécution serveur ni
  exposition utilisateur. Le pattern vulnérable (buf fourni à uuid v3/v5/v6) n'est pas
  utilisé par notre code.
- Levée prévue : bump Expo SDK ≥ 57 lors de la décision produit mobile (Phase F).

## Procédure

- Gate CI : `npm run audit:high` bloque tout high/critical.
- Toute nouvelle acceptation doit être ajoutée ici avec justification et condition de levée.
