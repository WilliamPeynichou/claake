# Feature — AgentChatConfig

## Branche

- `feature/agent-chat-config`

## Plan

- [x] Créer une branche feature/agent-chat-config depuis resolve-agent
- [x] Ajouter le type partagé AgentChatConfig et client API
- [x] Ajouter GetAgentChatConfigUseCase + DTO backend + provider module
- [x] Exposer GET /agents/:id/chat-config avec auth optionnelle
- [x] Brancher le chat web sur AgentChatConfig pour access/welcome/suggestions
- [x] Lancer tests/builds et documenter

## Review

### Changements réalisés

- Ajout du type partagé `AgentChatConfig` dans `shared/types/index.ts`.
- Ajout de `apiClient.agents.chatConfig(id, token?)` dans `shared/api/client.ts`.
- Ajout du DTO backend `AgentChatConfigResponseDto`.
- Ajout du use case backend `GetAgentChatConfigUseCase`.
- Ajout de tests unitaires pour :
  - `login_required` sans utilisateur ;
  - `api_key_required` si clé utilisateur manquante ;
  - accès autorisé si clé présente ;
  - masquage des agents non publiés aux non propriétaires.
- Enregistrement du use case dans `AgentModule`.
- Ajout de l'endpoint : `GET /agents/:id/chat-config` avec `OptionalSupabaseAuthGuard`.
- Branchement de `/chat/[agentId]` sur `AgentChatConfig` pour :
  - charger le contrat backend dédié ;
  - afficher welcome/suggestions depuis ce contrat ;
  - afficher une action si une clé API est requise ;
  - désactiver l'input si l'accès chat est bloqué.

### Vérifications exécutées

- `npx prisma generate --schema backend/prisma/schema.prisma` : OK.
- Test ciblé `get-agent-chat-config.usecase.spec.ts` : OK, 4 tests passed.
- `npm -w @claake/backend run build` : OK.
- `npm -w @claake/backend run test -- --runInBand` : OK, 29 suites / 159 tests passed.
- Build web avec env factice HTTPS : OK.
  - `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy`
  - `NEXT_PUBLIC_API_URL=https://api.example.com/v1`
- `npx biome format --write ...` : OK.

### Notes

- Les fichiers locaux non liés (`skills`, docs non suivies, tasks, etc.) restent hors scope de la feature.
- Le prochain gros chantier sera de refactoriser proprement le chat en `features/chat/ChatShell` et de rendre l'état clé API manquante plus intégré à l'UX.
