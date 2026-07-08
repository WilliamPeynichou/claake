# Compte-rendu — Quotas chat simples (F6.2)

Date : 2026-07-06
Branche : `feature/chat-quotas`
Réf plan : `docs/suivi_roadmap/plans/2026-07-06-plan-quotas-chat.md`
Réf : `docs/roadmap-claake-agents-chat.md` — Phase 6 / Feature 6.2

## Résumé

Quotas chat par utilisateur appliqués côté backend (source de vérité) dans
`SendMessageUseCase`, avant toute écriture de message. Aucune logique quota côté front :
le message d'erreur backend s'affiche via le rendu `error` existant (web + desktop).

## Fichiers

- `shared/lib/constants.ts` — `CHAT_QUOTAS` (référence front, limites par défaut).
- `backend/.../application/services/chat-quota.service.ts` (nouveau) — `ChatQuotaService`
  + `DEFAULT_CHAT_QUOTAS` (surcharge via `CHAT_QUOTA_*`), `assertWithinQuota`,
  `maxHistoryMessages`.
- `backend/.../domain/ports/chat-session.repository.port.ts` — `countUserMessagesSince`.
- `backend/.../infrastructure/repositories/prisma-chat.repository.ts` — impl Prisma
  (count `role="USER"`, `session.userId`, `createdAt >= since`).
- `backend/.../application/usecases/send-message.usecase.ts` — appel `assertWithinQuota`
  avant écriture, historique borné par `maxHistoryMessages` (remplace le `100` littéral).
- `backend/.../chat.module.ts` — `ChatQuotaService` déclaré.
- Tests : `chat-quota.service.spec.ts` (nouveau) + cas quota dans `send-message.usecase.spec.ts`.

## Règles appliquées

- prompt `> MAX_PROMPT_CHARS` (12000) → 413 « Message trop long ».
- `>= MESSAGES_PER_MINUTE` (20) → 429.
- `>= MESSAGES_PER_DAY` (300) → 429.
- historique injecté plafonné à `MAX_HISTORY_MESSAGES` (100).
- messages `ASSISTANT` non comptés (compte `role="USER"` uniquement).

## Vérifications

- `npm -w @claake/backend run test` : **185/185 OK** (31 suites, +7 vs 178).
- `npm -w @claake/backend run build` (nest build) : OK.
- Biome sur le périmètre chat + shared : OK (warnings préexistants hors scope).

## Livraison Git

- Commit `feat(chat): enforce simple per-user chat quotas`.
- Merge `--no-ff` → `main`, push, branche supprimée.

## Dette / suite

- Index DB dédié `chat_messages(session_id, role, created_at)` si volume élevé
  (index `(session_id, created_at)` déjà présent).
- Quotas par agent, nombre de fichiers, coût estimé : hors V1.
- Test live bloqué tant que `backend/.env` vide.
