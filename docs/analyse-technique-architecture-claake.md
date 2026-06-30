# Analyse technique approfondie et recommandations d'architecture Claake

## Objectif de ce document

Ce document analyse l'état technique actuel de Claake et propose une architecture cible pour faciliter les prochains développements.

Le produit à prioriser est :

```txt
Des développeurs publient des agents IA
→ ces agents sont validés
→ les utilisateurs les lancent dans le chat Claake
→ depuis le web ou le desktop
```

Le principe d'architecture doit donc être :

> Tout doit rendre simple, fiable et maintenable le parcours agent → chat.

---

## 1. État actuel de la stack

### Monorepo

Le projet est structuré en npm workspaces :

```txt
shared/          types, hooks, API client, constantes
frontendWeb/     Next.js 15 App Router
backend/         NestJS + Prisma + PostgreSQL
frontendApp/     Tauri + React/Vite
frontendAppMob/  Expo / React Native
supabase/        configuration Supabase / storage policies
docs/            documentation, audits, roadmaps
```

Cette structure est saine. Le découpage est adapté à un produit multi-client, à condition de renforcer le rôle de `shared`.

### Frontend web

Stack :

- Next.js 15 ;
- React 19 ;
- App Router ;
- Tailwind ;
- shadcn/ui ;
- Supabase côté client/SSR ;
- client API partagé.

Routes importantes :

```txt
/                       landing
/catalogue              catalogue agents
/agents/[id]            détail agent
/chat                   sélection agent
/chat/[agentId]         chat agent
/dashboard              espace utilisateur/créateur
/dashboard/agents       mes agents
/dashboard/agents/new   création agent
/dashboard/agents/[id]/edit édition agent
/dashboard/api-keys     clés API utilisateur
/admin                  admin
/admin/review           validation agents
```

### Backend

Stack :

- NestJS 11 ;
- Prisma 6 ;
- PostgreSQL ;
- Supabase Auth ;
- Stripe ;
- providers IA ;
- architecture domain/application/infrastructure.

Modules principaux :

```txt
agents
chat
users
payments
uploads
favorites
reviews
categories
stats
activity
notifications
health
```

Le backend est déjà la partie la mieux architecturée. Il utilise :

- use cases ;
- entities ;
- ports/repositories ;
- mappers/transformers ;
- DTOs ;
- guards ;
- validation globale ;
- chiffrement des clés API.

C'est une très bonne base.

### Shared

`shared` contient :

```txt
api/client.ts
hooks/use-chat.ts
hooks/use-agents.ts
hooks/use-api-keys.ts
hooks/use-collections.ts
hooks/use-favorites.ts
lib/constants.ts
lib/agents.ts
lib/storage.ts
types/index.ts
```

Le rôle de `shared` doit devenir plus central :

- types produit ;
- schémas d'agent ;
- mapping provider/modèle ;
- client API ;
- hooks cross-platform ;
- helpers de chat.

Aujourd'hui, `shared` est utile mais pas encore assez structurant.

---

## 2. Ce qui est déjà solide

## 2.1 Backend clean architecture

Le backend suit une architecture propre :

```txt
module/
├── domain/
│   ├── entities
│   └── ports
├── application/
│   ├── dtos
│   ├── transformers
│   └── usecases
└── infrastructure/
    ├── controllers
    ├── repositories
    └── mappers
```

C'est une bonne architecture pour le long terme.

Recommandation : conserver ce modèle pour les futurs modules : knowledge base, agent testing, quotas, model registry, etc.

## 2.2 Chat IA déjà bien lancé

Le flux actuel existe déjà :

```txt
frontend useChat
→ POST /chat/sessions/:id/messages
→ SendMessageUseCase
→ ExecutionStrategyResolver
→ Provider IA
→ stream vers frontend
→ sauvegarde message assistant
```

Points forts :

- streaming ;
- historique ;
- sessions ;
- stratégie provider ;
- support pièces jointes ;
- séparation providers OpenAI/Anthropic/endpoint proxy/mock.

## 2.3 Stratégies d'exécution pertinentes

Le modèle supporte :

```txt
USER_API_KEY
SELLER_API_KEY
SELLER_ENDPOINT
```

C'est exactement ce qu'il faut pour Claake.

Pour le MVP, la priorité doit rester :

1. `USER_API_KEY` ;
2. `SELLER_API_KEY` pour créateurs validés ;
3. `SELLER_ENDPOINT` en beta privée seulement.

## 2.4 Auth et clés API

Les clés API utilisateur sont stockées chiffrées via `ManageApiKeysUseCase`. Le chat peut les récupérer via `ExecutionStrategyResolver`.

C'est la bonne direction.

## 2.5 Routes produit déjà présentes

Les routes nécessaires existent déjà :

- création agent ;
- édition agent ;
- dashboard agents ;
- clés API ;
- revue admin ;
- chat agent ;
- détail agent.

Le socle fonctionnel est donc là.

---

## 3. Problèmes et frictions actuelles

## 3.1 Le cœur agent → chat n'est pas encore assez productisé

Le chat fonctionne, mais il manque encore des éléments produit essentiels :

- message d'accueil agent ;
- suggestions de prompts ;
- état clair quand une clé API est manquante ;
- bouton principal cohérent sur la page agent ;
- test d'un agent draft ;
- distinction claire entre chat public et chat de test créateur/admin.

Actuellement, `/chat/[agentId]` charge l'agent, les sessions et les messages, mais ne met pas encore assez en valeur l'identité/configuration de l'agent.

## 3.2 Le modèle Agent ne contient pas encore les champs de pertinence

Le modèle Prisma contient :

- name ;
- description ;
- longDescription ;
- tags ;
- models ;
- systemPrompt ;
- cloudStrategy ;
- endpoint/provider ;
- pricing ;
- status.

Mais il manque des champs structurants :

```txt
welcomeMessage
suggestedPrompts
variables
outputFormat
capabilities
limitations
modelSettings
qualityChecklist
```

Sans ces champs, les agents risquent de rester de simples wrappers de prompt.

## 3.3 Les pages web sont trop monolithiques

Exemple important :

```txt
frontendWeb/app/(dashboard)/dashboard/agents/new/page.tsx
```

Cette page fait près de 900 lignes et contient :

- state du formulaire ;
- parsing `.agentjson` ;
- upload image ;
- upload config ;
- validation locale ;
- wizard ;
- construction payload ;
- affichage complet ;
- succès/erreurs.

Cela va devenir difficile à maintenir.

Même problème, plus léger, sur :

```txt
frontendWeb/app/(dashboard)/dashboard/agents/[id]/edit/page.tsx
frontendWeb/app/(chat)/chat/[agentId]/page.tsx
frontendWeb/app/(admin)/admin/review/page.tsx
```

## 3.4 Le frontend duplique des règles métier

Exemples :

- génération du slug dans la page création ;
- règles de stratégie d'exécution ;
- mapping provider/modèle ;
- validations partielles côté formulaire ;
- labels de statuts dupliqués ;
- conversions uppercase/lowercase.

Ces règles devraient être centralisées dans `shared` ou garanties par le backend.

## 3.5 Les types shared ne sont pas parfaitement alignés avec Prisma/backend

Exemples observés :

- `UserProfile.role` contient `developer`, alors que Prisma utilise `CREATOR` ;
- `STATUS_LABELS` contient `published`, alors que le backend utilise plutôt `approved` ;
- les enums frontend alternent entre lowercase et uppercase ;
- `CreateAgentInput` n'est pas encore aligné avec les futurs champs nécessaires.

Cela peut créer des bugs subtils.

## 3.6 Le détail agent n'est pas assez orienté action chat

La page `/agents/[id]` affiche un bouton sidebar `Utiliser cet agent`, mais celui-ci ne redirige pas clairement vers le chat. Le composant central `ChatInterface` contient déjà un bouton vers `/chat/{agent.id}`.

Recommandation : un seul CTA principal partout :

```txt
Utiliser dans le chat
```

## 3.7 L'admin review est trop minimale

La page `/admin/review` permet approuver/rejeter, mais elle ne montre pas assez d'informations critiques :

- prompt système ;
- cloud strategy ;
- provider requis ;
- présence clé créateur ;
- endpoint ;
- limitations ;
- message d'accueil ;
- suggestions ;
- test dans le chat.

Pour une plateforme d'agents, l'admin doit valider le comportement réel, pas seulement les métadonnées.

## 3.8 Le desktop doit rester client chat

L'app desktop est un bon candidat pour devenir le client d'utilisation quotidienne. Elle ne doit pas dupliquer trop tôt les écrans complexes de création/admin.

Son scope idéal :

```txt
login
→ catalogue agents
→ chat agent
→ historique
→ clés API
```

## 3.9 Le mobile est hors scope production

Le mobile utilise encore des mocks. Il faut le garder comme prototype design jusqu'à stabilisation web/backend/desktop.

---

## 4. Architecture cible recommandée

## 4.1 Principe général

Architecture cible :

```txt
Backend = source de vérité métier et sécurité
Shared = contrat produit et client API commun
Web = création, catalogue, chat, dashboard, admin
Desktop = client chat
Mobile = plus tard
```

## 4.2 Backend cible

Le backend doit rester organisé par modules métier.

À court terme, ajouter ou renforcer ces modules/use cases :

```txt
agents
├── CreateAgentDraftUseCase
├── UpdateAgentDraftUseCase
├── SubmitAgentForReviewUseCase
├── ReviewAgentUseCase
├── GetAgentForChatUseCase
├── GetAgentForReviewUseCase
└── TestAgentUseCase

chat
├── CreateSessionUseCase
├── SendMessageUseCase
├── SendDraftAgentMessageUseCase
├── ValidateChatAccessUseCase
└── ResolveMissingApiKeyUseCase

model-registry
├── ListProvidersUseCase
├── ListModelsUseCase
└── ValidateModelForProviderUseCase

api-keys
├── ListApiKeysUseCase
├── AddApiKeyUseCase
├── RemoveApiKeyUseCase
└── TestApiKeyUseCase
```

Actuellement, les clés API sont dans `users`. Cela fonctionne, mais à terme un module dédié `api-keys` serait plus clair.

## 4.3 Frontend web cible

Le web devrait être organisé par domaines applicatifs, pas seulement par pages.

Structure recommandée :

```txt
frontendWeb/features/
├── agents/
│   ├── components/
│   │   ├── agent-card.tsx
│   │   ├── agent-detail-cta.tsx
│   │   ├── agent-status-badge.tsx
│   │   └── agent-provider-badge.tsx
│   ├── builder/
│   │   ├── agent-builder.tsx
│   │   ├── agent-builder-context.tsx
│   │   ├── steps/
│   │   │   ├── metadata-step.tsx
│   │   │   ├── behavior-step.tsx
│   │   │   ├── model-step.tsx
│   │   │   ├── execution-step.tsx
│   │   │   ├── review-step.tsx
│   │   │   └── submit-step.tsx
│   │   └── agent-builder.schema.ts
│   ├── hooks/
│   │   ├── use-agent-form.ts
│   │   ├── use-agent-actions.ts
│   │   └── use-agent-review.ts
│   └── lib/
│       ├── map-agent-form.ts
│       ├── parse-agent-json.ts
│       └── validate-agent-form.ts
│
├── chat/
│   ├── components/
│   │   ├── chat-shell.tsx
│   │   ├── chat-header.tsx
│   │   ├── chat-empty-state.tsx
│   │   ├── missing-api-key-card.tsx
│   │   ├── suggested-prompts.tsx
│   │   └── session-sidebar.tsx
│   ├── hooks/
│   │   ├── use-agent-chat.ts
│   │   └── use-chat-access.ts
│   └── lib/
│       └── chat-errors.ts
│
├── api-keys/
│   ├── components/
│   └── hooks/
│
└── admin/
    ├── review/
    └── components/
```

Les routes Next.js doivent devenir fines : elles appellent les composants de features.

Exemple cible :

```tsx
// app/(dashboard)/dashboard/agents/new/page.tsx
import { AgentBuilderPage } from '@/features/agents/builder/agent-builder-page';

export default function Page() {
	return <AgentBuilderPage mode="create" />;
}
```

## 4.4 Shared cible

`shared` doit contenir les contrats stables entre clients.

Structure recommandée :

```txt
shared/
├── api/
│   ├── client.ts
│   └── errors.ts
├── agents/
│   ├── schema.ts
│   ├── constants.ts
│   ├── model-registry.ts
│   ├── mappers.ts
│   └── validation.ts
├── chat/
│   ├── types.ts
│   ├── stream.ts
│   └── errors.ts
├── hooks/
└── types/
```

À centraliser dans `shared` :

- providers ;
- modèles ;
- stratégies d'exécution ;
- statuts agents ;
- labels FR ;
- payloads de création/update ;
- parser `.agentjson` ;
- validation légère du formulaire ;
- helpers de streaming.

## 4.5 Modèle Agent cible

Ajouter des champs structurés au modèle `Agent`.

Proposition Prisma :

```prisma
model Agent {
  // existant...
  systemPrompt String? @map("system_prompt")

  welcomeMessage String? @map("welcome_message")
  suggestedPrompts String[] @default([]) @map("suggested_prompts")
  limitations String[] @default([])
  variables Json?
  outputFormat Json? @map("output_format")
  modelSettings Json? @map("model_settings")
  capabilities Json?
}
```

Pourquoi pas tout en JSON ?

- `welcomeMessage` et `suggestedPrompts` sont centraux pour le chat ;
- ils doivent être simples à requêter et afficher ;
- les champs avancés peuvent rester en JSON au départ.

## 4.6 Nouveau contrat `AgentForChat`

Le chat n'a pas besoin de tout l'objet `Agent` public.

Créer un endpoint dédié :

```txt
GET /agents/:id/chat-config
```

Réponse :

```ts
interface AgentChatConfig {
	id: string;
	name: string;
	description: string;
	image_url: string | null;
	status: 'approved' | 'draft';
	mode: 'cloud' | 'local' | 'hybrid';
	models: string[];
	provider: string | null;
	cloud_strategy: CloudStrategy | null;
	required_user_provider: string | null;
	welcome_message: string | null;
	suggested_prompts: string[];
	limitations: string[];
	capabilities: {
		files: boolean;
		images: boolean;
	};
	access: {
		can_chat: boolean;
		reason?: 'login_required' | 'api_key_required' | 'purchase_required' | 'not_published';
		required_provider?: string;
	};
}
```

Avantage : le frontend chat devient très simple.

Il affiche l'état renvoyé par le backend au lieu de deviner.

---

## 5. Flux cible agent → chat

## 5.1 Utilisateur public

```txt
/catalogue
→ /agents/:id
→ bouton Utiliser dans le chat
→ /chat/:agentId
→ GET /agents/:id/chat-config
→ si access.can_chat = true : chat
→ sinon afficher l'action requise
```

Cas possibles :

```txt
login_required       → bouton Connexion
api_key_required     → bouton Ajouter clé API
purchase_required    → écran achat
not_published        → message indisponible
```

## 5.2 Créateur testant un draft

Créer un mode explicite :

```txt
/dashboard/agents/:id/test
```

ou :

```txt
/chat/:agentId?mode=draft
```

Le backend doit vérifier :

- l'utilisateur est le créateur ;
- l'agent est draft/rejected/pending ;
- le chat utilise la config draft ;
- les messages de test sont séparés ou marqués.

Recommandation : éviter de mélanger chat public et test draft au début. Créer un endpoint ou un flag clair.

## 5.3 Admin testant un agent soumis

```txt
/admin/review/:agentId
→ Tester dans le chat
→ chat mode review
```

Le backend vérifie :

- rôle admin ;
- permission `canManageAgents` ;
- accès à l'agent pending ;
- session de test isolée.

---

## 6. Refactor frontend recommandé

## 6.1 Extraire Agent Builder

Problème : `new/page.tsx` est trop gros.

Découpage recommandé :

```txt
features/agents/builder/
├── agent-builder-page.tsx
├── agent-builder-form.tsx
├── agent-builder.reducer.ts
├── agent-builder.types.ts
├── agent-builder.schema.ts
├── steps/
│   ├── import-step.tsx
│   ├── metadata-step.tsx
│   ├── behavior-step.tsx
│   ├── model-step.tsx
│   ├── execution-step.tsx
│   ├── assets-step.tsx
│   └── submit-step.tsx
└── lib/
    ├── parse-agent-json.ts
    ├── build-create-agent-payload.ts
    ├── build-update-agent-payload.ts
    └── validate-agent-builder.ts
```

Objectif : création et édition doivent partager 80 % du code.

## 6.2 Extraire Chat Shell

`/chat/[agentId]/page.tsx` devrait devenir un wrapper fin.

Structure cible :

```txt
features/chat/
├── chat-page.tsx
├── chat-shell.tsx
├── chat-header.tsx
├── chat-sidebar.tsx
├── chat-empty-state.tsx
├── missing-api-key-card.tsx
├── suggested-prompts.tsx
└── hooks/use-agent-chat.ts
```

Le hook `useAgentChat` doit orchestrer :

- auth ;
- agent chat config ;
- sessions ;
- messages ;
- missing key ;
- send message ;
- retry ;
- files.

## 6.3 Harmoniser les composants agent

Créer :

```txt
AgentStatusBadge
AgentProviderBadge
AgentExecutionStrategyBadge
AgentPrimaryCta
AgentModelLabel
```

Cela évite les labels dupliqués partout.

## 6.4 Centraliser erreurs API et UI

Aujourd'hui beaucoup de `.catch(() => {})` silencieux.

Il faut une stratégie commune :

```txt
api error
→ message utilisateur clair
→ log dev éventuel
→ fallback UI
```

Créer :

```txt
shared/api/errors.ts
frontendWeb/lib/errors.ts
components/ui/error-state.tsx
```

---

## 7. Refactor backend recommandé

## 7.1 Ajouter `GetAgentChatConfigUseCase`

Ce use case doit renvoyer exactement ce dont le chat a besoin.

Il doit gérer :

- agent introuvable ;
- publication ;
- accès créateur/admin si mode test ;
- clé API utilisateur manquante ;
- achat manquant plus tard ;
- provider requis ;
- capabilities.

## 7.2 Ajouter `SubmitAgentForReviewUseCase`

Aujourd'hui, `create` lance directement `validateAgent` et met l'agent en pending si validation OK.

Pour rendre le flow plus clair :

```txt
create draft
update draft
validate draft
submit for review
review approve/reject
```

Cela colle mieux au produit.

Endpoints cibles :

```txt
POST   /agents/drafts
PATCH  /agents/:id
POST   /agents/:id/validate
POST   /agents/:id/submit
PATCH  /agents/:id/review
POST   /agents/:id/test-chat/sessions
```

Cela peut être fait progressivement.

## 7.3 Séparer API keys en module dédié

À terme :

```txt
backend/src/modules/api-keys
```

Avec :

- repository dédié ;
- use cases ;
- tests ;
- endpoint test provider ;
- quotas éventuels.

Le stockage actuel en JSON dans `User.apiKeysEncrypted` fonctionne pour MVP, mais une table dédiée sera plus propre.

Proposition :

```prisma
model UserApiKey {
  id String @id @default(uuid())
  userId String @map("user_id")
  provider String
  label String
  encryptedKey String @map("encrypted_key")
  keyPreview String @map("key_preview")
  lastValidatedAt DateTime? @map("last_validated_at")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider, label])
  @@index([userId, provider])
  @@map("user_api_keys")
}
```

## 7.4 Ajouter un Model Registry backend

Le frontend ne doit pas être seul à décider quels modèles sont valides.

Créer une source de vérité :

```txt
ProviderRegistry
ModelRegistry
```

Exemple :

```ts
interface AIModelDefinition {
	id: string;
	provider: 'anthropic' | 'openai' | 'mistral';
	label: string;
	capabilities: {
		text: boolean;
		vision: boolean;
		files: boolean;
	};
	defaultTemperature: number;
	maxTokens: number;
}
```

Cette registry peut être dans `shared`, mais le backend doit aussi la valider.

---

## 8. Modèle de données recommandé pour agents pertinents

## 8.1 Champs MVP à ajouter

Priorité haute :

```txt
welcomeMessage
suggestedPrompts
limitations
modelSettings
capabilities
```

Migration Prisma proposée :

```prisma
welcomeMessage  String?  @map("welcome_message")
suggestedPrompts String[] @default([]) @map("suggested_prompts")
limitations String[] @default([])
modelSettings Json? @map("model_settings")
capabilities Json?
```

## 8.2 Champs V1.5

```txt
variables Json?
outputFormat Json?
fewShotExamples Json?
qualityChecklist Json?
```

## 8.3 Champs V2

```txt
knowledgeBaseId
agentTools
versioning avancé
analytics agent
```

---

## 9. Architecture recommandée pour `.agentjson`

Le fichier `.agentjson` peut devenir un standard Claake.

Mais il ne doit pas remplacer la configuration DB. Il doit être un format d'import/export.

### Schéma cible MVP

```json
{
  "schema_version": "1.0",
  "name": "Juriste IA",
  "description": "Analyse et rédige des contrats français.",
  "category": "juridique",
  "tags": ["contrats", "rgpd"],
  "system_prompt": "Tu es un juriste spécialisé...",
  "welcome_message": "Bonjour, envoie-moi ton contrat à analyser.",
  "suggested_prompts": [
    "Analyse cette clause",
    "Liste les risques principaux",
    "Rédige une clause de confidentialité"
  ],
  "model": {
    "provider": "anthropic",
    "default": "claude-sonnet-4-20250514",
    "temperature": 0.2,
    "max_tokens": 4096
  },
  "execution": {
    "strategy": "user_api_key",
    "required_provider": "anthropic"
  },
  "limitations": [
    "Ne remplace pas un professionnel qualifié",
    "Droit français uniquement"
  ]
}
```

### Où mettre le parser ?

Dans `shared/agents/schema.ts` ou `shared/agents/agentjson.ts`.

Les clients l'utilisent pour préremplir le formulaire. Le backend l'utilise pour valider.

---

## 10. Qualité de développement recommandée

## 10.1 Créer des conventions de feature

Chaque nouvelle feature doit suivre :

```txt
feature/
├── components
├── hooks
├── lib
├── types.ts
└── index.ts
```

Les pages Next doivent rester courtes.

## 10.2 Ne pas dupliquer les règles métier côté frontend

Centraliser dans `shared` :

- labels ;
- providers ;
- model registry ;
- statuts ;
- stratégies ;
- validation légère ;
- mapping payloads.

Le backend reste source de vérité finale.

## 10.3 Standardiser les DTOs

Éviter les conversions ad hoc uppercase/lowercase.

Choisir une convention API publique :

- soit snake_case lowercase ;
- soit enums uppercase.

Recommandation :

- API externe : snake_case + lowercase ;
- Prisma/backend interne : uppercase enums ;
- transformer systématique entre les deux.

Mais il faut l'appliquer partout.

## 10.4 Ajouter tests frontend ciblés

Priorité tests :

1. chat agent ;
2. clé API manquante ;
3. création agent ;
4. soumission agent ;
5. review admin ;
6. page agent CTA chat.

Outils recommandés :

- Playwright pour parcours e2e ;
- Vitest/React Testing Library pour composants/hook si installé plus tard.

## 10.5 Ajouter tests backend manquants

À ajouter :

- `GetAgentChatConfigUseCase` ;
- `SubmitAgentForReviewUseCase` ;
- accès draft creator/admin ;
- clé API manquante ;
- modèle/provider invalide ;
- welcome/suggestions transformés correctement.

---

## 11. Roadmap technique priorisée

## Étape 1 — Solidifier le contrat Agent Chat

- Ajouter `welcomeMessage` et `suggestedPrompts` au modèle Agent.
- Ajouter types shared.
- Ajouter migration Prisma.
- Ajouter transformers backend.
- Ajouter affichage dans `/chat/[agentId]`.
- Ajouter affichage sur `/agents/[id]`.

## Étape 2 — Ajouter `AgentChatConfig`

- Créer endpoint `/agents/:id/chat-config`.
- Créer use case backend.
- Inclure `access.can_chat` et raisons de blocage.
- Adapter frontend chat pour utiliser cet endpoint.

## Étape 3 — Refactor Chat Shell

- Extraire `features/chat`.
- Ajouter `MissingApiKeyCard`.
- Ajouter `SuggestedPrompts`.
- Ajouter `ChatEmptyState`.
- Remplacer erreurs génériques par états actionnables.

## Étape 4 — Refactor Agent Builder

- Extraire le formulaire de création en composants.
- Réutiliser le même builder pour édition.
- Déplacer parser `.agentjson` dans `shared`.
- Ajouter champs welcome/suggestions/limitations.

## Étape 5 — Flow draft/submit/review

- Clarifier backend : create draft vs submit.
- Ajouter bouton `Tester dans le chat`.
- Ajouter test admin dans review.
- Améliorer la page admin review avec infos complètes.

## Étape 6 — Desktop chat aligné

- Réutiliser `shared/hooks/use-chat` ou un nouveau hook plus robuste.
- Ajouter catalogue agents.
- Ajouter clé API manquante.
- Ajouter historique.

## Étape 7 — Sécurité/qualité avant beta

- Secrets ;
- SSRF ;
- uploads privés ;
- quotas chat ;
- tests e2e ;
- audit CI.

---

## 12. Recommandation finale d'architecture

L'architecture idéale pour Claake n'est pas d'ajouter beaucoup de features rapidement. C'est de rendre très solide le noyau suivant :

```txt
AgentDefinition
→ AgentValidation
→ AgentChatConfig
→ ChatSession
→ ProviderExecution
```

Chaque élément doit avoir un contrat clair.

### Noyau cible

```txt
AgentDefinition
- ce que le développeur configure
- prompt, provider, modèle, welcome, suggestions, limitations

AgentValidation
- ce que Claake accepte ou refuse
- sécurité, cohérence, qualité minimale

AgentChatConfig
- ce que le chat doit savoir pour lancer l'agent
- accès, provider, clé requise, welcome, suggestions

ChatSession
- conversation utilisateur avec un agent précis
- historique, fichiers, streaming

ProviderExecution
- comment Claake appelle Claude/GPT/Mistral
- clé utilisateur, clé créateur ou endpoint vendeur
```

Si ce noyau est propre, le reste devient simple : web, desktop, admin, paiement, fichiers, knowledge base.

---

## 13. Décision technique recommandée

Pour les prochains développements, il faut éviter d'empiler du code dans les pages Next.

Décision recommandée :

```txt
1. Backend reste source de vérité.
2. Shared devient le contrat produit commun.
3. Web est découpé en features.
4. Desktop consomme les mêmes hooks/API.
5. Mobile reste hors scope tant que le noyau agent-chat n'est pas stable.
```

Priorité absolue :

```txt
Rendre l'utilisation d'un agent dans le chat Claake évidente, fiable et extensible.
```
