# Gate produit — Application desktop opérationnelle

Branche : `fix/desktop-operational-gate`

## Plan

- [x] Corriger scripts pour lancer et construire vraie application Tauri.
- [x] Autoriser origines desktop locales via CORS backend, sans élargir production.
- [x] Vérifier et documenter configuration API/Supabase locale.
- [ ] Rendre arrêt du streaming SSE fonctionnel.
- [ ] Afficher erreurs de configuration chat et CTA boutique pour agents payants.
- [ ] Ajouter tests ciblés frontend desktop.
- [ ] Construire package natif local et vérifier artefact installable (compilation validée,
  packaging final bloqué par limite runner 120 s).
- [ ] Faire smoke réel avec Supabase et backend locaux.
- [x] Documenter utilisation, limites et preuves.

## Review

- Scripts racine et workspace lancent désormais Tauri réel ; scripts web internes évitent récursion.
- CORS exact couvre `127.0.0.1`, `tauri://localhost` et `http://tauri.localhost` ; 8 tests verts.
- `WEB_URL` production strictement validée et normalisée.
- Matrice d'icônes native générée, identifiant bundle et noms Rust alignés sur Claake.
- Preuves vertes : Biome ciblé, build NestJS, build web production, `cargo check --locked`.
- Build release Tauri atteint `claake-desktop` sans erreur, mais commandes interrompues à 120 s par
  runner. Artefact installable et smoke E2E restent donc ouverts, sans faux PASS.
- Détails : `docs/suivi_roadmap/gate-desktop-runtime-packaging-tauri.md`.
