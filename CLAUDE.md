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

---

## Stratégie de sous-agents
- Utiliser les sous-agents généreusement pour garder le contexte principal propre
- Déléguer la recherche, l'exploration et l'analyse parallèle aux sous-agents
- Pour les problèmes complexes, envoyer plus de compute via les sous-agents
- Une tâche par sous-agent pour une exécution ciblée

## Boucle d'auto-amélioration
- Après TOUTE correction de l'utilisateur : mettre à jour `tasks/lessons.md` avec le pattern
- Écrire des règles pour soi-même qui empêchent la même erreur
- Itérer sans relâche sur ces leçons jusqu'à ce que le taux d'erreur baisse
- Relire les leçons en début de session pour le projet en cours

## Vérification avant de clôturer
- Ne jamais marquer une tâche comme terminée sans prouver qu'elle fonctionne
- Comparer le comportement entre main et les changements quand c'est pertinent
- Se demander : « Est-ce qu'un développeur senior approuverait ça ? »
- Lancer les tests, vérifier les logs, démontrer que c'est correct

## Exiger l'élégance (avec mesure)
- Pour les changements non triviaux : faire une pause et se demander « y a-t-il une façon plus élégante ? »
- Si un fix semble hacky : « Sachant tout ce que je sais maintenant, implémenter la solution élégante »
- Ne pas appliquer ça pour les fixes simples et évidents — ne pas sur-ingénierer
- Challenger son propre travail avant de le présenter

## Résolution autonome de bugs
- Quand on reçoit un rapport de bug : le corriger directement. Ne pas demander d'être guidé
- Pointer les logs, erreurs, tests qui échouent — puis les résoudre
- Zéro changement de contexte requis côté utilisateur
- Aller corriger les tests CI en échec sans qu'on dise comment

---

## Gestion des tâches

1. **Planifier d'abord** : Écrire le plan dans `tasks/todo.md` avec des items cochables
2. **Valider le plan** : Vérifier avant de commencer l'implémentation
3. **Suivre la progression** : Marquer les items terminés au fur et à mesure
4. **Expliquer les changements** : Résumé haut niveau à chaque étape
5. **Documenter les résultats** : Ajouter une section review dans `tasks/todo.md`
6. **Capturer les leçons** : Mettre à jour `tasks/lessons.md` après les corrections

---

## Principes fondamentaux

- **Simplicité d'abord** : Chaque changement doit être aussi simple que possible. Impact minimal sur le code.
- **Pas de paresse** : Trouver les causes racines. Pas de fixes temporaires. Standards de développeur senior.
- **Impact minimal** : Les changements ne doivent toucher que le nécessaire. Éviter d'introduire des bugs.
