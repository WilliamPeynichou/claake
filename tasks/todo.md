# Plan — Milestone 3 Admin review

Date : 2026-07-06
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 3
Réf session précédente : `docs/suivi_roadmap/plans/2026-07-04-finir-milestone-2.md`

## Objectif

Permettre à un admin de revoir les agents soumis, inspecter leur configuration complète,
les tester dans le chat Claake en mode validation, puis approuver, rejeter, suspendre ou
remettre en brouillon selon le statut.

## Contraintes d'architecture

- Le backend décide des droits de review, de test chat et de transition de statut.
- Le frontend affiche les états/actions renvoyés ou autorisés par l'API sans recalculer la
  règle métier critique.
- Le chat admin doit utiliser le mode test existant (`test_mode`) pour les agents `PENDING`.
- Les pages Next.js admin doivent rester fines et déléguer à `frontendWeb/features/admin/review/`.
- `shared` doit exposer les méthodes client nécessaires.

## Plan

- [x] Explorer l'existant backend admin/review/agents/chat et le frontend admin review.
- [x] Compléter le backend review si nécessaire : données de revue complètes, transitions
      approve/reject/suspend/back-to-draft et garde admin.
- [x] Ajouter/aligner le client partagé `shared/api/client.ts` pour les actions admin review.
- [x] Créer ou compléter `frontendWeb/features/admin/review/` : liste pending, page détail,
      actions, rejet avec raison, lien **Tester dans le chat** en `?test=1`.
- [x] Garder les routes `frontendWeb/app/(admin)/admin/review/**` fines.
- [x] Ajouter/adapter les tests backend pertinents pour pending admin test et transitions review.
- [x] Lancer les vérifications ciblées puis documenter la review.

## Critère terminé

```txt
agent submitted/PENDING
→ admin opens review queue
→ admin sees complete agent configuration
→ admin tests in chat with ?test=1
→ admin approves or rejects with reason
→ approved agent becomes public-chat eligible
```

## Hors périmètre acceptable

- Checklist qualité persistée en base si le modèle n'existe pas encore.
- Refactor complet Agent Builder commun.
- Quotas chat et e2e complets.

## Review

- Backend review étendu via `ReviewAgentUseCase` et `ReviewAgentDto` : décisions
  `approve`, `reject`, `suspend`, `back_to_draft` avec transitions de statut strictes côté
  backend.
- `approve` reste limité aux agents `PENDING` et marque le scan de la dernière version en
  `PASSED` comme avant.
- `reject` reste limité aux agents `PENDING` et accepte une raison.
- `suspend` est disponible pour les agents `APPROVED` côté API admin.
- `back_to_draft` est disponible pour `PENDING`, `REJECTED` et `SUSPENDED`.
- Client partagé `shared/api/client.ts` aligné sur les nouvelles décisions admin.
- Page admin review déplacée dans `frontendWeb/features/admin/review/` ; la route
  `frontendWeb/app/(admin)/admin/review/page.tsx` est redevenue fine.
- La file de revue affiche les informations complètes nécessaires : description longue,
  prompt système, provider, modèle, stratégie, welcome, suggestions, limitations,
  capacités et dates.
- Bouton **Tester dans le chat** branché vers `/chat/{agentId}?test=1`, qui utilise le mode
  test chat existant autorisant les admins sur les agents `PENDING`.
- Actions UI : approuver, rejeter avec raison, remettre en brouillon avec raison.

## Vérifications

- `npx biome check backend/src/modules/agents/application/dtos/review-agent.dto.ts backend/src/modules/agents/application/usecases/review-agent.usecase.ts backend/src/modules/agents/application/usecases/review-agent.usecase.spec.ts shared/api/client.ts frontendWeb/app/'(admin)'/admin/review/page.tsx frontendWeb/features/admin/review tasks/todo.md` OK.
- `npm --workspace backend test -- review-agent.usecase.spec.ts create-session.usecase.spec.ts send-message.usecase.spec.ts` OK : 3 suites, 26 tests.
- `npm run web-build` sans variables publiques échoue hors changement sur `NEXT_PUBLIC_SUPABASE_URL is not set` pendant `/auth/callback`.
- `NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy NEXT_PUBLIC_API_URL=https://api.example.com npm run web-build` OK.
