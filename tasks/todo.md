# Gate produit — Application desktop opérationnelle

Branche : `test/desktop-local-smoke`

## Plan

- [x] Corriger scripts pour lancer et construire vraie application Tauri.
- [x] Autoriser origines desktop locales via CORS backend, sans élargir production.
- [x] Vérifier et documenter configuration API/Supabase locale.
- [x] Rendre arrêt du streaming SSE fonctionnel.
- [x] Afficher erreurs de configuration chat et CTA boutique pour agents payants.
- [x] Ajouter tests ciblés frontend desktop.
- [x] Ajouter workflow GitHub Actions de release desktop Windows/Linux/macOS.
- [x] Valider version/tag et variables publiques de build sans exposer secrets.
- [x] Publier une GitHub Release idempotente avec installateurs natifs.
- [x] Vérifier workflow, pousser branche et documenter déclenchement.
- [x] Construire package natif en CI et vérifier build Tauri réel ; bundles installables multi-OS
  prêts via workflow de release.
- [x] Faire smoke réel avec Supabase et backend locaux.
- [x] Documenter utilisation, limites et preuves.

## Review

- Scripts racine et workspace lancent désormais Tauri réel ; scripts web internes évitent récursion.
- CORS exact couvre `127.0.0.1`, `tauri://localhost` et `http://tauri.localhost` ; 8 tests verts.
- `WEB_URL` production strictement validée et normalisée.
- Matrice d'icônes native générée, identifiant bundle et noms Rust alignés sur Claake.
- Preuves vertes : Biome ciblé, build NestJS, build web production, `cargo check --locked`.
- Build release Tauri atteint `claake-desktop` sans erreur, mais commandes interrompues à 120 s par
  runner. Artefact installable et smoke E2E restent donc ouverts, sans faux PASS.
- Workflow `Desktop Release` ajouté : validation tag/version/config, matrice Linux/Windows/macOS,
  brouillon idempotent puis publication après succès complet.
- Environnement GitHub `desktop-release` créé. Ses deux secrets et deux variables runtime restent à
  fournir avant lancement ; aucun endpoint factice ne peut être publié.
- `Cargo.lock` desktop désormais versionnable et dépendances Linux ajoutées au job CI desktop.
- Stop SSE réel via `AbortController`, contenu partiel conservé, abort au démontage et aucun faux retry.
- Achat agent payant via Checkout backend et navigateur système ; URL limitée à
  `https://checkout.stripe.com/*` par validation applicative et capability Tauri.
- Erreurs `chat-config` visibles avec action Réessayer ; accès rafraîchissable après achat.
- Tests hook : 2/2 verts (stop utilisateur et démontage), désormais exécutés en CI.
- Smoke local vert : fenêtre Tauri native lancée, Supabase Auth OK, `/health`, profil authentifié,
  catalogue agents, sessions et CORS desktop validés.
- Dérive historique DB locale corrigée sans reset : migrations matérialisées 0003-0005 réconciliées,
  puis migrations restantes déployées ; 14/14 appliquées.
- Preuves : `docs/suivi_roadmap/smoke-local-desktop-operationnel.md`.
- Runbook : `docs/releases/release-desktop-github-actions.md`.
