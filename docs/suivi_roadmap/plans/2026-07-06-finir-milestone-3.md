# Plan — Finir le Milestone 3 (Admin review)

Date : 2026-07-06
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 3
Réf session précédente : `docs/suivi_roadmap/plans/2026-07-04-finir-milestone-2.md`

## Objectif

Permettre à un admin de revoir les agents soumis, inspecter leur configuration complète,
les tester dans le chat Claake en mode validation, puis approuver, rejeter, suspendre ou
remettre en brouillon selon le statut.

## État de départ constaté

- `ReviewAgentUseCase` existe déjà mais ne couvre que `approve` / `reject`.
- L'endpoint admin `PATCH /agents/:id/review` existe avec garde admin :
  `SupabaseAuthGuard`, `RolesGuard`, `AdminPermissionGuard`, `canManageAgents`.
- La file web `frontendWeb/app/(admin)/admin/review/page.tsx` existe, mais contient toute
  la logique dans la page Next.js.
- La page admin review liste les agents `PENDING`, mais les informations affichées sont
  incomplètes pour une validation sérieuse : prompt, stratégie, provider, welcome,
  suggestions, limitations et capacités ne sont pas visibles ensemble.
- Le mode test chat backend existe depuis le Milestone 2 :
  - `CreateSessionUseCase` autorise un admin à créer une session test pour un agent
    `PENDING` avec `test_mode` ;
  - `SendMessageUseCase` revérifie le droit d'envoi pour admin + `PENDING`.
- Il manque le branchement produit depuis la review admin vers `/chat/{agentId}?test=1`.

## Contraintes d'architecture

- Le backend reste source de vérité pour les transitions de statut.
- Le frontend ne doit pas décider si un agent peut être approuvé, rejeté, suspendu ou remis
  en brouillon : il appelle l'API admin et affiche le résultat.
- Le test admin doit réutiliser le mode test chat existant (`test_mode`) et ne pas affaiblir
  le chat public.
- La route Next.js admin review doit rester fine et déléguer à un domaine feature :
  `frontendWeb/features/admin/review/`.
- Le client partagé `shared/api/client.ts` doit exposer les décisions supportées par l'API.

## Lots

### Lot 1 — Backend review complet

- Étendre `ReviewAgentDto` avec les décisions :
  - `approve` ;
  - `reject` ;
  - `suspend` ;
  - `back_to_draft`.
- Étendre `ReviewAgentUseCase` avec transitions strictes :
  - `PENDING → APPROVED` ;
  - `PENDING → REJECTED` ;
  - `APPROVED → SUSPENDED` ;
  - `PENDING/REJECTED/SUSPENDED → DRAFT`.
- Conserver le marquage `PASSED` de la dernière version lors de l'approbation.
- Journaliser les actions admin dans `ActivityLogService`.

### Lot 2 — Shared client

- Aligner `apiClient.agents.review()` sur les nouvelles décisions admin.
- Conserver le contrat de réponse minimal `{ status, reason? }`.

### Lot 3 — Frontend admin review

- Créer `frontendWeb/features/admin/review/`.
- Déplacer l'orchestration de la page admin dans `AdminReviewPage`.
- Réduire `frontendWeb/app/(admin)/admin/review/page.tsx` à un import/export.
- Afficher les données utiles à la revue :
  - description courte et longue ;
  - prompt système ;
  - créateur ;
  - provider requis ;
  - modèles ;
  - mode ;
  - stratégie d'exécution ;
  - message d'accueil ;
  - suggestions ;
  - limitations ;
  - capacités fichiers/images ;
  - dates.
- Ajouter le bouton **Tester dans le chat** vers `/chat/{agentId}?test=1`.
- Ajouter les actions admin : approuver, rejeter avec raison, remettre en brouillon avec
  raison.

### Lot 4 — Tests et vérifications

- Étendre `ReviewAgentUseCase` avec les nouveaux cas de transition.
- Relancer les tests backend liés à la review et au mode test chat.
- Lancer Biome sur les fichiers modifiés.
- Lancer le build web avec variables publiques d'environnement.

## Critère terminé

```txt
agent submitted/PENDING
→ admin opens review queue
→ admin sees complete agent configuration
→ admin tests in chat with ?test=1
→ admin approves or rejects with reason
→ approved agent becomes public-chat eligible
```

## Hors périmètre restant acceptable

- Checklist qualité persistée en base.
- Page détail de review par agent dédiée (`/admin/review/{agentId}`) si la file enrichie
  suffit pour le MVP.
- Notifications créateur sur rejet/remise en brouillon.
- E2E complet du parcours admin.
