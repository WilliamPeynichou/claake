# Milestone 12 — Consolidation, Skills V2 et hardening MCP

## Plan

- [x] 1. Injecter les ressources Skills V2 dans le contexte de chat avec bornes et tests.
- [ ] 2. Consolider les dettes locales M9 réalisables et leurs tests.
- [ ] 3. Ajouter le quota MCP dédié par message et le circuit breaker par serveur.
- [ ] 4. Vérifier les tests, le lint et le build backend ; documenter les limites staging/réseau.

## Review

- Skills V2 : sélection locale par mots-clés sur skill/ressources, ordre stable en cas d'égalité, maximum 3 skills et 6 ressources.
- Défense en profondeur : les ressources invalides (chemins absolus/traversal, vide, NUL) sont ignorées à la lecture ; contexte limité à 6 000 caractères et 2 000 par ressource.
- Injection backend dans le prompt système (`Skills pertinents`) sans migration Prisma ni dépendance staging/Supabase.
- Vérifié : tests ciblés `agent-skill-context` + `send-message` (28/28) et Biome ciblé OK (avertissements `any` préexistants dans le test chat).
- `npm run build` reste bloqué par deux erreurs TypeScript MCP préexistantes/en cours de lot M10 (`executePrepared` arité et `serverId` manquant).

