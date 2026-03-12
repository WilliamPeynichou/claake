# AgentPlace — Conventions

## Structure monorepo (npm workspaces)
```
claake/
├── shared/          # Types et API client partagés (@agentplace/shared)
├── frontendWeb/     # Next.js 15 — app web (@agentplace/frontend-web)
├── backend/         # NestJS + Prisma (@agentplace/backend)
├── frontendApp/     # Tauri + React/Vite — app desktop (@agentplace/frontend-app)
└── frontendAppMob/  # Expo/React Native — app mobile (@agentplace/frontend-app-mob)
```

## Stack
- **Web** : Next.js 15 (App Router, React 19, TypeScript strict)
- **Mobile** : Expo / React Native (React 19)
- **Desktop** : Tauri 2 + React/Vite (React 19)
- **Backend** : NestJS + Prisma (PostgreSQL)
- **Styling web** : Tailwind CSS + shadcn/ui
- **Auth/Realtime** : Supabase

## Outillage (racine)
- Biome (linter + formatter) — config à la racine, partagée
- npm workspaces

## Commandes (depuis la racine)
- `npm run web` — dev serveur web
- `npm run api` — dev serveur backend
- `npm run mobile` — dev app mobile (Expo)
- `npm run desktop` — dev app desktop (Tauri)
- `npm run web-build` — build production web
- `npm run api-build` — build production backend
- `npm run lint` — vérifier tout le code (Biome)
- `npm run lint-fix` — corriger automatiquement
- `npm run format` — formater le code

## Conventions de code
- Indentation : tabs
- Largeur max : 100 caractères
- Imports organisés automatiquement par Biome
- Composants shadcn dans `frontendWeb/components/ui/` (ne pas modifier manuellement)
- Composants custom dans `frontendWeb/components/<domaine>/`
- Types partagés dans `shared/types/index.ts`
- API client partagé dans `shared/api/client.ts`
- Clients Supabase dans `frontendWeb/lib/supabase/`
- Schema Prisma dans `backend/prisma/schema.prisma`

## Structure des routes (frontendWeb)
- `(public)` — pages accessibles sans auth
- `(auth)` — pages login/register (layout centré)
- `(dashboard)` — espace utilisateur (layout avec sidebar)
- `(admin)` — espace admin (layout avec sidebar admin)

## Langue
- Interface utilisateur : français
- Code (variables, fonctions, commentaires) : anglais
