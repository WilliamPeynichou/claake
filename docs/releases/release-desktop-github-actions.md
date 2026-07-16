# Release GitHub de l'application desktop

Workflow : `.github/workflows/desktop-release.yml`  
Environnement GitHub : `desktop-release`

## Fonctionnement

Le workflow construit en parallèle :

- Linux : AppImage et paquet Debian ;
- Windows : installateurs NSIS/MSI selon bundles Tauri disponibles ;
- macOS : DMG universel Intel + Apple Silicon.

La release reste en brouillon pendant les builds. Elle est publiée uniquement si toute la matrice
réussit. Une relance réutilise la release existante au lieu d'échouer sur `already_exists`.

La signature Apple est optionnelle. Sans configuration Apple complète, macOS est construit non
signé et Windows/Linux continuent. Aucun updater automatique n'est activé sans clé de signature
Tauri.

## Configuration requise

Ajouter dans environnement GitHub `desktop-release` :

Secrets :

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Variables publiques :

```text
VITE_API_URL=https://<api-publique>/v1
VITE_WEB_URL=https://<web-public>
```

Toutes les URL doivent être publiques et HTTPS. Les variables `VITE_*` sont incluses dans le
bundle : ne jamais utiliser `SUPABASE_SERVICE_ROLE_KEY`.

Signature/notarisation macOS optionnelle :

```text
APPLE_CERTIFICATE
APPLE_CERTIFICATE_PASSWORD
APPLE_SIGNING_IDENTITY
APPLE_ID
APPLE_PASSWORD
APPLE_TEAM_ID
```

## Déclenchement

Versions alignées obligatoirement dans :

- `frontendApp/package.json` ;
- `frontendApp/src-tauri/Cargo.toml` ;
- `frontendApp/src-tauri/tauri.conf.json`.

Déclenchement manuel :

```bash
gh workflow run "Desktop Release" \
  --ref fix/desktop-operational-gate \
  -f tag_name=v0.1.0
```

Après merge sur `main`, voie normale :

```bash
git tag -a v0.1.0 -m "Claake v0.1.0"
git push origin v0.1.0
```

Suivi :

```bash
gh run list --workflow "Desktop Release" --limit 5
gh release view v0.1.0
```

## Gate opérationnel

Ne pas distribuer publiquement tant que :

1. backend et web publics HTTPS ne sont pas déployés ;
2. login, API et chat ne sont pas smokés depuis un installateur ;
3. macOS non signé est clairement signalé, ou signature/notarisation validée.
