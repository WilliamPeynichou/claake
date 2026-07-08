# Plan — Quotas chat simples (F6.2)

> **Statut : ✅ Réalisé et livré.** Voir
> `docs/suivi_roadmap/comptes-rendus/2026-07-06-finition-quotas-chat.md`.

Date : 2026-07-06
Branche : `feature/chat-quotas`
Réf : `docs/roadmap-claake-agents-chat.md` — Phase 6 / Feature 6.2, prochain ordre #1.
Réf archi : `docs/architecture/analyse-technique-architecture-claake.md` (noyau
`ChatSession → ProviderExecution`).

## Pourquoi maintenant

Prochaine priorité roadmap. Sans quotas, tout agent en clé créateur/Claake expose à
un abus de coût. Le backend est déjà source de vérité pour l'accès chat ; les quotas
sont la même règle métier, au même endroit.

## Portée V1 (simple, backend d'abord)

Limiter, par utilisateur, au moment de l'envoi d'un message :

```txt
messages / minute
messages / jour
taille max du prompt (caractères)
taille max de l'historique injecté (nb messages)
```

Hors périmètre V1 : nombre de fichiers, coût estimé, quotas par agent, quotas payants,
UI de suivi de consommation. À planifier après.

## Point d'insertion unique

`backend/src/modules/chat/application/usecases/send-message.usecase.ts`, méthode
`execute`, **après** les checks d'accès (ownership / published / purchase) et **avant**
`chatRepo.addMessage(... "USER" ...)`.

Aucun autre chemin n'écrit de message utilisateur → un seul point à garder.

## Implémentation cible

### 1. Constantes partagées (`shared/lib/constants.ts`)

```ts
export const CHAT_QUOTAS = {
	MESSAGES_PER_MINUTE: 20,
	MESSAGES_PER_DAY: 300,
	MAX_PROMPT_CHARS: 12000,
	MAX_HISTORY_MESSAGES: 100,
} as const;
```

Surchargables via env backend (`CHAT_QUOTA_*`) lues dans un provider de config.

### 2. Port repo — compteur fenêtré

`ChatSessionRepositoryPort` :

```ts
countUserMessagesSince(userId: string, since: Date): Promise<number>;
```

Impl Prisma (`prisma-chat.repository.ts`) : compte les messages `role = "USER"`
des sessions de l'utilisateur depuis `since` (jointure session.userId).

### 3. Service quota (`application/services/chat-quota.service.ts`)

```ts
assertWithinQuota(userId: string, promptChars: number): Promise<void>;
```

- `promptChars > MAX_PROMPT_CHARS` → `PayloadTooLargeException` (413) message clair.
- `countUserMessagesSince(userId, now-60s) >= MESSAGES_PER_MINUTE` → 429.
- `countUserMessagesSince(userId, startOfDay) >= MESSAGES_PER_DAY` → 429.
- Historique déjà borné à `MAX_HISTORY_MESSAGES` dans `getMessages(...,100,0)` : rendre
  la constante explicite (remplacer le `100` littéral).

Erreurs actionnables (FR) : « Limite de N messages par minute atteinte, réessayez dans
un instant. » / « Limite quotidienne atteinte. » / « Message trop long (max X caractères). »

### 4. Câblage module

`chat.module.ts` : déclarer `ChatQuotaService`, l'injecter dans `SendMessageUseCase`.

### 5. Frontend

Aucun changement structurel : le chat affiche déjà `error` (web `ChatError`,
desktop `chat-thread`). Vérifier que le message backend passe tel quel. Optionnel :
mapper 429 vers un ton « réessayez bientôt ».

## Tests (bloquant)

`send-message.usecase.spec.ts` + `chat-quota.service.spec.ts` :

- passe sous les limites ;
- refuse au-delà de messages/minute (429) ;
- refuse au-delà de messages/jour (429) ;
- refuse prompt trop long (413) ;
- ne compte pas les messages assistant ;
- l'historique injecté est plafonné à `MAX_HISTORY_MESSAGES`.

## Critère terminé

```txt
quota vérifié dans SendMessageUseCase avant écriture message
→ compteur repo + service + constantes shared
→ erreurs actionnables FR
→ tests backend verts
→ api-build OK
→ merge --no-ff dans main + push + suppression branche
```

## Risques / notes

- Compteur = lecture DB par message : acceptable en V1 (indexer `chat_messages(session_id, role, created_at)` si besoin plus tard).
- Throttler HTTP existant (`@Throttle`) protège l'endpoint ; les quotas métier sont
  complémentaires (par utilisateur, fenêtres longues), pas redondants.
- Test live bloqué tant que `backend/.env` vide — validation par tests unitaires.
