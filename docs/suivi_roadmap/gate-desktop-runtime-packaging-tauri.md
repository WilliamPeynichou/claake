# Gate desktop — runtime et packaging Tauri

Date : 2026-07-12  
Branche : `fix/desktop-operational-gate`

## Changements

- `npm run desktop` lance maintenant `tauri dev`, pas seulement Vite.
- `npm run desktop-build` lance maintenant `tauri build`, avec scripts web séparés pour éviter
  toute récursion dans `beforeDevCommand` et `beforeBuildCommand`.
- Identifiant bundle fixé à `com.claake.desktop`, crate Rust renommé `claake-desktop`.
- Fenêtre desktop limitée à 900 × 600 minimum.
- Icônes natives macOS, Windows et Linux générées depuis le logo Claake.
- CORS backend extrait dans une fonction testable : origines web et Tauri exactes, sans wildcard.
- En production, `WEB_URL` doit être une origine HTTPS sans identifiants, chemin, query ou fragment.
- Exemple desktop local aligné sur Vite/CSP : API `127.0.0.1:3001`.

## Commandes

Développement local :

```bash
npm run desktop
```

Package natif :

```bash
npm run desktop-build
```

Le build production exige des valeurs publiques valides :

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_URL
VITE_WEB_URL
```

Ne jamais placer une clé Supabase `service_role` dans une variable `VITE_*`.

## Preuves

- Tests CORS : 8/8 verts.
- Build NestJS : vert.
- Biome ciblé : vert.
- `cargo check --locked` : vert en 4,11 s après compilation froide.
- Build web production déclenché par Tauri : 2 073 modules, vert.
- Génération `icon.icns`, `icon.ico` et tailles PNG : verte.
- Compilation release Tauri atteint le crate `claake-desktop` sans erreur, mais le runner utilisé
  interrompt chaque commande après 120 secondes. Aucun `.app` ou `.dmg` final n'est donc revendiqué.

## Gate restant

Sur poste local sans limite de commande, exécuter `npm run desktop-build`, vérifier artefacts dans
`frontendApp/src-tauri/target/release/bundle/`, puis installer et faire smoke auth/API/chat.
Signature et notarisation macOS demandent Xcode complet et identité Apple Developer.
