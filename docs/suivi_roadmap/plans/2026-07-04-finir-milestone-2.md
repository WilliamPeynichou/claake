# Plan — Finir le Milestone 2 (Création agent V1)

Date : 2026-07-04
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 2

## Objectif

Permettre à un créateur de créer un agent, le conserver en brouillon, le modifier, le tester
dans le chat Claake, puis le soumettre à validation.

## État de départ constaté

- Création agent existe, mais `POST /agents` lance directement `ValidateAgentUseCase` et peut passer en `PENDING`.
- Édition fonctionne pour `DRAFT`/`REJECTED`, refusée pour `PENDING`/`APPROVED`.
- `ValidateAgentUseCase` existe et met `DRAFT`/`PENDING` selon résultat.
- Chat public refuse les agents non `APPROVED` dans `CreateSessionUseCase` et `SendMessageUseCase`.
- `GetAgentChatConfigUseCase` sait déjà exposer `DRAFT` au propriétaire et `PENDING` à l'admin.
- Frontend create/edit existe, mais pas encore refactorisé en Agent Builder commun.

## Lots

### Lot 1 — Création draft réelle

- Retirer la validation automatique de `POST /agents`.
- Retourner l'agent créé en `DRAFT`.
- Ajouter endpoint dédié `PATCH /agents/:id/submit`.
- `submit` appelle `ValidateAgentUseCase` et passe l'agent en `PENDING` si valid.

### Lot 2 — Mode test chat contrôlé

- Ajouter un mode test au backend chat :
  - propriétaire peut créer/envoyer dans session test pour `DRAFT`/`REJECTED` ;
  - admin peut créer/envoyer dans session test pour `PENDING` ;
  - public reste limité à `APPROVED`.
- API minimale : `POST /chat/sessions` accepte `test_mode?: boolean`.
- `CreateSessionUseCase` et `SendMessageUseCase` autorisent non-APPROVED seulement si session test autorisée.

### Lot 3 — Frontend dashboard créateur

- Dashboard agents : bouton **Tester** pour `DRAFT`/`REJECTED`.
- Bouton **Soumettre** appelle `agents.submit()`.
- Création : après draft créé, afficher actions `Modifier`, `Tester`, `Soumettre`.

### Lot 4 — Shared client/types

- `shared/api/client.ts` : `agents.submit(agentId, token)`.
- `shared/api/client.ts` : `chat.createSession(agentId, token, { test_mode })` ou signature compatible.
- Types DTO si besoin.

### Lot 5 — Tests

- Backend agents : submit owner, submit non-owner, submit approved/pending refusé si besoin.
- Backend chat : owner draft test OK, normal draft refusé, admin pending test OK, user pending test refusé.
- Build backend + web-build.

## Critère terminé

```txt
create draft
→ update draft
→ test in chat
→ submit for review
→ admin can review later
```

## Hors périmètre restant acceptable

- Refactor complet `frontendWeb/features/agents/builder/` peut être fait ensuite si la fonctionnalité V1 est complète.
