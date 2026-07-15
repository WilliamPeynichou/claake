# Phase B — Durcissement clients web/desktop

Branche : `fix/phase-b-client-hardening`

## Plan

- [x] Auditer fallbacks API localhost web et desktop.
- [x] Centraliser validation des URLs API/Supabase desktop ; valeurs obligatoires.
- [x] Interdire HTTP, credentials et localhost dans les builds desktop production.
- [x] Aligner types upload desktop avec allowlist backend.
- [x] Déclarer capability Tauri minimale sans permission IPC/plugin système.
- [x] Ajouter CSP Tauri, prototype gelé et serveur dev lié à 127.0.0.1.
- [x] Vérifier lint, builds web/desktop, schéma/config Tauri et Rust.

## Review

- Web : aucun fallback API localhost dans runtime ; `NEXT_PUBLIC_API_URL` obligatoire, HTTPS et
  non-local en production (déjà en place, confirmé).
- Desktop : validation centralisée de `VITE_API_URL` et `VITE_SUPABASE_URL` ; URL valide sans
  credentials, HTTPS/non-local en production ; anon key obligatoire.
- Vite valide les variables au début du build (pas seulement au chargement runtime) : builds
  localhost/manquants échouent avant génération d'artefacts.
- Tauri : capability explicite `main-no-system-access` avec zéro permission IPC/plugin ; aucun
  plugin shell/fs/http ; CSP stricte, `object-src/frame-src/base-uri none`, prototype gelé.
- Dev desktop lié à `127.0.0.1`; upload desktop aligné avec backend (retrait `text/plain`).
- Dette préexistante réparée : `app.title` invalide en Tauri 2 et icône obligatoire absente.
- Vérifié : lint vert, builds desktop/web production verts, build négatif localhost/missing env
  échoue, `cargo check` vert.
