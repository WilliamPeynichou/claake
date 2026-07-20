# Smoke local — application desktop opérationnelle

Date : 2026-07-20  
Branche : `test/desktop-local-smoke`

## Environnement

- Supabase local : API `127.0.0.1:54321`, PostgreSQL `127.0.0.1:54322`.
- Backend NestJS local : `127.0.0.1:3002` selon environnement de développement existant.
- Tauri dev : Vite `127.0.0.1:5173` et binaire `target/debug/claake-desktop`.

Aucun secret ou jeton n'est conservé dans ce document.

## Incident trouvé et corrigé localement

Le premier smoke de `GET /v1/agents` retournait 500 : la base locale contenait déjà les objets des
migrations `0003`, `0004` et `0005`, mais leur historique Prisma manquait. Les migrations `0006` à
`0019` n'étaient pas appliquées, notamment `welcome_message`.

Correction non destructive :

1. vérifier colonnes, contraintes et tables matérialisées par `0003` à `0005` ;
2. marquer ces trois migrations comme appliquées avec `prisma migrate resolve --applied` ;
3. exécuter `prisma migrate deploy` ;
4. confirmer les 14 migrations appliquées.

Aucun reset DB, suppression ou recréation des données.

## Preuves

- Supabase Auth health : OK.
- Backend `GET /health` : 200.
- Préflight origine `http://127.0.0.1:5173` : 204 avec origine et méthodes CORS attendues.
- Tauri dev : compilation froide réussie en 1 min 48 s.
- Binaire natif lancé : `target/debug/claake-desktop`.
- Utilisateur Supabase local jetable créé puis supprimé.
- Auth password : OK.
- Backend authentifié `GET /v1/auth/profile` : 200.
- Catalogue `GET /v1/agents?limit=10` : 200.
- Sessions authentifiées `GET /v1/chat/sessions?limit=10` : 200.
- CI PR #4 : tests, migrations DB vierge, build backend/web, E2E web et vrai `tauri build` Linux
  réussis.

## Limites restantes

Le stream chat complet avec fournisseur IA réel et l'achat Stripe nécessitent des clés/fournisseurs
locaux configurés. Leur logique critique est couverte par tests (`AbortController`) et le checkout
reste limité à `checkout.stripe.com`, mais un smoke externe réel reste requis avant diffusion
publique.

La release multi-OS reste bloquée tant que les endpoints web/API HTTPS publics ne sont pas
opérationnels et configurés dans l'environnement GitHub `desktop-release`.
