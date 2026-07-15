# Phase B — Gestion et rotation des secrets

Branche : `fix/phase-b-secrets-management`

## Plan

- [x] Vérifier que fichiers env réels sont ignorés et non trackés, sans lire leurs valeurs.
- [x] Renforcer scanner local/CI (fournisseurs, clés privées, affectations sensibles).
- [x] Bloquer tout fichier env réel suivi par Git.
- [x] Corriger placeholders CI desktop pour respecter HTTPS/non-local production.
- [x] Documenter stockage, rotation, révocation, validation et incident.
- [x] Fournir checklist de rotation staging/prod sans secret en repo.
- [x] Vérifier scanner, lint, tests/builds concernés.

## Review

- Fichiers env réels confirmés ignorés/non trackés ; permissions locales passées à `0600` sans
  lire ni modifier leurs valeurs.
- Scanner étendu : Stripe, Supabase JWT, GitHub/OpenAI, clés privées, DB avec credentials, clé AES,
  affectations de variables sensibles et `.npmrc`. Scope = fichiers trackés + non ignorés.
- Gate négatif prouvé avec fixture Stripe éphémère : scan échoue et nomme le fichier/type, jamais
  la valeur. Gate positif repo : vert.
- Procédure complète ajoutée : inventaire, secret manager, séparation staging/prod, rotation 90 j,
  P0-02 immédiat, incident et rotation AES keyring.
- CI desktop corrigée avec placeholders HTTPS non locaux, compatible avec hardening Vite.
- Vérifié : `security:check` vert (10 moderate Expo acceptées), lint vert, build desktop CI vert.
- Blocage externe restant : rotation/révocation effective doit être cochée par opérateur disposant
  des accès Supabase/Stripe/OpenAI/Mistral/OAuth ; aucune fausse déclaration de clôture P0-02.
