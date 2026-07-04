# Roadmap produit et développement Claake

## État du chantier — mise à jour 2026-07-03

### Derniers commits structurants

```txt
b805835 refactor web chat shell
b5efdac merge: feature/agent-chat-config → main
9867376 feat: agent chat config — endpoint, usecase, types et page chat
881f08d merge: feature agent chat fields
7547792 feat: add agent chat fields
dabd98d fix backend security audit findings
```

### Avancement global

Le chantier a passé un cap important : le socle `AgentChatConfig` existe maintenant côté
backend/shared/web, et la route web `/chat/[agentId]` a été extraite autour d'un
`ChatShell` dans `frontendWeb/features/chat/`.

Le cœur technique suivant est en place :

```txt
AgentDefinition partiel
→ AgentValidation existant
→ AgentChatConfig créé
→ ChatSession existant
→ ProviderExecution existant
```

### Milestones — état réel

| Milestone | État | Commentaire |
|---|---:|---|
| Milestone 0 — Socle technique agent-chat | 100% | Champs agent chat, migration, types shared, endpoint `chat-config`, use case, DTO strict et tests complets (login/api-key/purchase/draft owner/pending admin/capabilities/provider). |
| Milestone 1 — Chat agent utilisable | 100% | ChatShell + welcome/suggestions, retry après erreur, upload conditionné par `capabilities`, retour auto au chat après ajout clé API, page détail agent orientée usage (provider/stratégie/limitations/CTA). |
| Milestone 2 — Création agent V1 | 100% fonctionnel | Création en brouillon, édition DRAFT/REJECTED, test chat contrôlé via `?test=1`, soumission dédiée `PATCH /agents/:id/submit`, validation backend et dashboard créateur branchés. Dette restante : refactor Agent Builder commun. |
| Milestone 3 — Admin review | ~60% | File review + approve/reject existent. Reste test admin dans le chat et infos complètes. |
| Milestone 4 — Desktop chat | ~10% | Non priorisé tant que chat web/test draft non stabilisés. |
| Milestone 5 — Qualité agent | ~30% | Welcome/suggestions/limitations faits. Variables, few-shot, format sortie, checklist à faire. |
| Milestone 6 — Fichiers et connaissance | ~35% | Upload existant partiel, capabilities présentes. Reste enforcement par agent et knowledge base. |
| Milestone 7 — Beta publique contrôlée | ~45% | Sécurité backend nettement renforcée. Reste quotas, CI, e2e, observabilité. |

### Ce qui est maintenant considéré fait

- Champs agent pour chat : `welcomeMessage`, `suggestedPrompts`, `limitations`,
  `modelSettings`, `capabilities`.
- Migration Prisma `0007_add_agent_chat_fields`.
- DTO/create/update/entity/mapper/transformer backend alignés sur ces champs.
- Type partagé `AgentChatConfig`.
- Client partagé `apiClient.agents.chatConfig()`.
- Endpoint backend `GET /agents/:id/chat-config`.
- Use case `GetAgentChatConfigUseCase` avec premières règles d'accès.
- Tests backend du contrat `AgentChatConfig`.
- Refactor web chat dans `frontendWeb/features/chat/` :
  - `chat-page.tsx` ;
  - `chat-shell.tsx` ;
  - `hooks/use-agent-chat.ts` ;
  - composants `ChatHeader`, `MissingApiKeyCard`, `AccessNotice`, `LoginRequired`.
- Route `frontendWeb/app/(chat)/chat/[agentId]/page.tsx` redevenue fine.
- Durcissement sécurité backend :
  - accès agent revérifié à chaque message ;
  - `download-info` protégé par statut/ownership ;
  - webhook Stripe non marqué traité avant effet métier ;
  - Stripe Connect relié au checkout ;
  - logs redigés ;
  - chiffrement clés API versionné.

### Blocage produit principal

Le chat public est maintenant plus sûr, mais le mode test n'existe pas encore.
Actuellement, l'exécution chat bloque les agents non `APPROVED`. C'est correct pour le
public, mais cela empêche encore :

```txt
créateur teste DRAFT/REJECTED
admin teste PENDING
```

La prochaine priorité produit est donc :

```txt
Créer un mode test agent contrôlé
→ propriétaire peut tester DRAFT/REJECTED
→ admin peut tester PENDING
→ public reste limité à APPROVED
```

### Prochain ordre recommandé

1. Ajouter mode test agent draft/admin côté backend.
2. Brancher bouton **Tester dans le chat** dans dashboard créateur.
3. Brancher bouton **Tester dans le chat** dans review admin.
4. Refactoriser création/édition dans `frontendWeb/features/agents/builder/`.
5. Utiliser `AgentChatConfig.capabilities` pour activer/masquer uploads.
6. Ajouter retour automatique après ajout de clé API.
7. Ajouter quotas chat simples.
8. Ajouter tests e2e du parcours MVP.

---

## Pré-requis technique obligatoire

Avant de développer une feature de cette roadmap, lire et respecter le document technique suivant :

```txt
docs/architecture/analyse-technique-architecture-claake.md
```

Ce document est la référence d'architecture pour les prochains développements. Il définit le noyau à stabiliser :

```txt
AgentDefinition
→ AgentValidation
→ AgentChatConfig
→ ChatSession
→ ProviderExecution
```

Toute nouvelle feature doit préserver ce noyau et éviter d'ajouter de la logique métier dispersée dans les pages Next.js.

## Objectif central

Le but de Claake est simple : permettre à des développeurs de mettre à disposition des agents IA connectables aux principales IA du marché, comme Claude, GPT, Mistral ou d'autres modèles compatibles, puis permettre aux utilisateurs d'utiliser ces agents directement dans le chat Claake, depuis le site web ou l'application desktop.

Le cœur produit doit donc rester :

```txt
Découvrir un agent
→ l'ouvrir dans le chat Claake
→ si nécessaire connecter une clé API
→ discuter immédiatement avec un agent utile
```

Toutes les features doivent être priorisées selon une question :

> Est-ce que cette feature aide l'utilisateur à utiliser un agent dans le chat Claake ?

Si oui, priorité haute. Sinon, plus tard.

---

## Vision produit

### Côté développeur

Le développeur doit pouvoir créer, tester et publier un agent IA.

```txt
Créer un agent
→ configurer prompt, provider, modèle et stratégie d'exécution
→ tester l'agent dans le chat Claake
→ soumettre à validation
→ validation admin
→ publication
```

### Côté utilisateur

L'utilisateur doit pouvoir trouver un agent et l'utiliser immédiatement dans le chat.

```txt
Découvrir un agent
→ cliquer sur "Utiliser dans le chat"
→ ajouter une clé API si nécessaire
→ discuter avec l'agent
→ retrouver son historique
```

---

## Principes de priorisation

Pour la première version, il faut privilégier :

1. le chat agent ;
2. la création simple d'agents ;
3. la configuration provider/modèle/clés API ;
4. le test d'agent avant publication ;
5. la validation admin ;
6. l'expérience desktop centrée chat.

À repousser après validation du cœur produit :

- mobile production ;
- paiement avancé ;
- marketplace financière complète ;
- équipes ;
- pipelines multi-agents ;
- endpoint vendeur public ;
- workflows complexes ;
- RAG avancé.

---

## Instructions techniques obligatoires pour le développement

Ces instructions complètent la roadmap produit. Elles doivent être appliquées à chaque nouvelle feature.

### 1. Source de vérité architecture

Toujours commencer par relire :

```txt
docs/architecture/analyse-technique-architecture-claake.md
```

Puis vérifier que la feature respecte le noyau :

```txt
AgentDefinition
→ AgentValidation
→ AgentChatConfig
→ ChatSession
→ ProviderExecution
```

Si une feature ne s'insère pas clairement dans ce noyau, elle doit être repensée avant implémentation.

### 2. Backend comme source de vérité métier

Le backend doit décider :

- si un agent est utilisable ;
- si un utilisateur a accès au chat ;
- si une clé API est requise ;
- quelle stratégie d'exécution utiliser ;
- quel provider/modèle est autorisé ;
- si un agent draft/pending peut être testé ;
- si un agent peut être soumis, approuvé, rejeté ou suspendu.

Le frontend ne doit pas deviner ces règles. Il doit afficher les états renvoyés par l'API.

### 3. Contrat `AgentChatConfig` à créer en priorité

Créer un endpoint dédié :

```txt
GET /agents/:id/chat-config
```

Ce contrat doit devenir la base du chat web et desktop.

Structure cible :

```ts
interface AgentChatConfig {
	id: string;
	name: string;
	description: string;
	image_url: string | null;
	status: "approved" | "draft" | "pending" | "rejected" | "suspended";
	mode: "cloud" | "local" | "hybrid";
	models: string[];
	provider: string | null;
	cloud_strategy: "seller_endpoint" | "seller_api_key" | "user_api_key" | null;
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
		reason?: "login_required" | "api_key_required" | "purchase_required" | "not_published";
		required_provider?: string;
	};
}
```

Le chat doit utiliser ce contrat au lieu de charger un `Agent` complet et de recalculer les règles côté UI.

### 4. Modèle Agent à enrichir proprement

Ajouter progressivement au modèle Prisma `Agent` :

```prisma
welcomeMessage   String?  @map("welcome_message")
suggestedPrompts String[] @default([]) @map("suggested_prompts")
limitations      String[] @default([])
modelSettings    Json?    @map("model_settings")
capabilities     Json?
```

Puis, en V1.5 :

```txt
variables
outputFormat
fewShotExamples
qualityChecklist
```

Ces champs doivent être ajoutés aussi dans :

- DTO backend create/update ;
- entity/mappers/transformers backend ;
- types `shared` ;
- client API partagé ;
- formulaire agent web ;
- affichage page agent ;
- affichage chat.

### 5. Ne pas grossir les pages Next.js

Les fichiers sous `frontendWeb/app/**/page.tsx` doivent rester fins.

Pour toute feature non triviale, créer un dossier domaine dans :

```txt
frontendWeb/features/
```

Structure recommandée :

```txt
frontendWeb/features/<domaine>/
├── components/
├── hooks/
├── lib/
├── types.ts
└── index.ts
```

Exemples prioritaires :

```txt
frontendWeb/features/chat/
frontendWeb/features/agents/
frontendWeb/features/agents/builder/
frontendWeb/features/api-keys/
frontendWeb/features/admin/review/
```

Les routes Next.js doivent importer ces features au lieu de contenir toute la logique.

### 6. Refactor obligatoire du chat

Le chat doit être extrait autour d'un `ChatShell`.

Structure cible :

```txt
frontendWeb/features/chat/
├── chat-page.tsx
├── chat-shell.tsx
├── components/
│   ├── chat-header.tsx
│   ├── chat-empty-state.tsx
│   ├── missing-api-key-card.tsx
│   ├── suggested-prompts.tsx
│   └── session-sidebar.tsx
└── hooks/
    └── use-agent-chat.ts
```

Le hook `use-agent-chat` doit orchestrer :

- auth ;
- chargement `AgentChatConfig` ;
- sessions ;
- messages ;
- état clé API manquante ;
- envoi message ;
- retry ;
- fichiers.

### 7. Refactor obligatoire de l'Agent Builder

La création et l'édition d'agent doivent partager un builder commun.

Structure cible :

```txt
frontendWeb/features/agents/builder/
├── agent-builder-page.tsx
├── agent-builder-form.tsx
├── agent-builder.reducer.ts
├── agent-builder.types.ts
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

Objectif : ne plus maintenir séparément deux gros formulaires création/édition.

### 8. Rôle renforcé de `shared`

Centraliser dans `shared` :

- providers IA ;
- modèles IA ;
- stratégies d'exécution ;
- statuts agents ;
- labels français ;
- types `AgentChatConfig` ;
- types `AgentDefinition` ;
- parser `.agentjson` ;
- validation légère du formulaire agent ;
- helpers de streaming chat.

Le backend reste la validation finale, mais `shared` évite la duplication entre web et desktop.

### 9. Convention API et types

Éviter les conversions dispersées uppercase/lowercase.

Convention recommandée :

- API publique : `snake_case` + valeurs lowercase ;
- Prisma/backend interne : enums uppercase ;
- transformation explicite dans les transformers/mappers backend ;
- types `shared` alignés sur l'API publique.

Avant d'ajouter un champ, vérifier son nom dans :

```txt
backend/prisma/schema.prisma
backend/src/modules/**/dtos
backend/src/modules/**/transformers
shared/types/index.ts
shared/api/client.ts
frontendWeb/features/**
```

### 10. Flow draft → test → submit → review

Le flow cible doit être :

```txt
create draft
→ update draft
→ test in chat
→ validate draft
→ submit for review
→ admin test
→ approve/reject
→ public chat
```

À terme, créer ou clarifier les use cases backend :

```txt
CreateAgentDraftUseCase
UpdateAgentDraftUseCase
SubmitAgentForReviewUseCase
GetAgentChatConfigUseCase
TestAgentUseCase
ReviewAgentUseCase
```

### 11. Tests nécessaires par feature

Aucune feature critique ne doit être considérée terminée sans vérification.

Tests backend prioritaires :

- `GetAgentChatConfigUseCase` ;
- `SubmitAgentForReviewUseCase` ;
- accès agent draft par créateur ;
- accès agent pending par admin ;
- clé API utilisateur manquante ;
- provider/modèle invalide ;
- transformation `welcome_message` / `suggested_prompts`.

Tests frontend/e2e prioritaires :

- page agent → bouton **Utiliser dans le chat** ;
- chat avec agent publié ;
- chat avec clé API manquante ;
- ajout clé API puis retour chat ;
- création agent draft ;
- test agent draft ;
- soumission agent ;
- review admin approve/reject.

### 12. Critères de validation d'une feature

Avant de clôturer une feature :

- le backend garde la règle métier ;
- les types `shared` sont à jour ;
- le web ne duplique pas la règle métier ;
- la route Next.js reste fine ;
- les erreurs utilisateur sont actionnables ;
- les tests ou vérifications manuelles sont documentés ;
- `npm run lint` doit être lancé si le changement touche du code ;
- les migrations Prisma doivent être incluses si le modèle change.

---

# Phase 1 — Stabiliser le cœur : utiliser un agent dans le chat

## Objectif

Rendre l'utilisation d'un agent fluide, fiable et évidente.

Le bouton principal du produit doit être :

```txt
Utiliser dans le chat
```

## Feature 1.1 — Page détail agent orientée usage

Chaque agent doit avoir une page claire avec :

- nom ;
- description courte ;
- description longue ;
- cas d'usage ;
- provider utilisé : Claude, GPT, Mistral, etc. ;
- modèle recommandé ;
- stratégie d'exécution ;
- limitations ;
- bouton principal : **Utiliser dans le chat**.

### Priorité

Très haute.

### Critère de réussite

Un utilisateur comprend en moins de 10 secondes ce que fait l'agent et peut l'ouvrir dans le chat.

---

## Feature 1.2 — Ouverture directe du chat avec un agent

Quand l'utilisateur clique sur **Utiliser dans le chat**, Claake doit ouvrir directement l'agent dans une session de chat.

```txt
Page agent
→ Utiliser dans le chat
→ /chat/{agentId}
```

Le système doit :

- charger l'agent ;
- créer ou retrouver une session ;
- afficher le message d'accueil de l'agent ;
- afficher les suggestions de prompts ;
- permettre l'envoi immédiat d'un message si la configuration est complète.

### Priorité

Très haute.

### Critère de réussite

Un agent publié est utilisable dans le chat sans manipulation technique inutile.

---

## Feature 1.3 — Gestion des clés API utilisateur depuis le chat

Si un agent nécessite une clé API utilisateur, le chat doit guider clairement l'utilisateur.

Exemple :

```txt
Cet agent utilise Claude.
Pour l'utiliser, ajoute ta clé API Anthropic.
[Ajouter ma clé API]
```

À prévoir :

- page paramètres clés API ;
- ajout de clé par provider ;
- suppression de clé ;
- affichage masqué ;
- message clair si la clé est manquante ou invalide ;
- retour automatique au chat après ajout.

### Priorité

Très haute.

### Critère de réussite

Une clé manquante n'est jamais une erreur bloquante obscure. L'utilisateur sait quoi faire.

---

## Feature 1.4 — Expérience chat robuste

Le chat doit devenir l'interface centrale de Claake.

À garantir :

- streaming fiable ;
- historique des messages ;
- sidebar des conversations ;
- suppression de session ;
- états loading propres ;
- erreurs compréhensibles ;
- bouton retry ;
- affichage de l'agent courant ;
- affichage provider/modèle ;
- suggestions de prompts au démarrage ;
- support fichiers si l'agent est compatible.

### Priorité

Très haute.

### Critère de réussite

L'utilisateur peut utiliser un agent comme un vrai assistant spécialisé, pas comme une démo technique.

---

## Feature 1.5 — Desktop centré chat

L'application desktop doit être pensée comme un client d'usage quotidien, pas comme un outil d'administration.

Fonctions desktop V1 :

- connexion ;
- liste des agents disponibles ;
- ouverture d'un agent dans le chat ;
- historique des conversations ;
- paramètres clés API ;
- chat streaming ;
- déconnexion.

### Priorité

Haute, après stabilisation du chat web.

### Critère de réussite

Un utilisateur peut utiliser ses agents Claake depuis le desktop avec la même logique que sur le web.

---

# Phase 2 — Création d'agents par les développeurs

## Objectif

Permettre à un développeur de créer un agent pertinent sans complexité inutile.

## Feature 2.1 — Formulaire de création agent V1

Le développeur doit pouvoir configurer :

- nom ;
- slug ;
- description courte ;
- description longue ;
- catégorie ;
- tags ;
- image ;
- provider : Anthropic, OpenAI, puis Mistral ;
- modèle ;
- prompt système ;
- température ;
- max tokens ;
- stratégie d'exécution ;
- message d'accueil ;
- suggestions de prompts ;
- limitations ou disclaimer.

### Stratégies d'exécution V1

À proposer dans l'interface :

1. **Clé API utilisateur** : l'utilisateur final ajoute sa propre clé.
2. **Clé API créateur** : le développeur fournit une clé, stockée chiffrée.

À garder pour plus tard ou beta privée :

3. **Endpoint vendeur** : le développeur expose son propre endpoint.

### Priorité

Très haute.

---

## Feature 2.2 — Mode brouillon

Un agent ne doit pas être public immédiatement.

Statuts :

```txt
DRAFT
PENDING
APPROVED
REJECTED
SUSPENDED
```

Le développeur peut :

- sauvegarder en brouillon ;
- modifier ;
- tester ;
- soumettre à validation.

### Priorité

Très haute.

---

## Feature 2.3 — Tester mon agent dans le chat

Depuis le dashboard créateur :

```txt
Mon agent
→ Tester dans le chat
→ chat en mode draft
```

Le mode test doit utiliser :

- le prompt système ;
- le provider choisi ;
- le modèle choisi ;
- la stratégie d'exécution ;
- la clé API configurée ;
- le message d'accueil ;
- les suggestions de prompts.

### Priorité

Très haute.

### Critère de réussite

Aucun agent ne devrait être soumis sans avoir pu être testé dans le chat Claake.

---

## Feature 2.4 — Configuration clé créateur

Si le développeur choisit la stratégie **clé créateur**, il doit pouvoir :

- ajouter une clé Anthropic/OpenAI ;
- la stocker chiffrée ;
- tester qu'elle fonctionne ;
- voir seulement un aperçu masqué ;
- remplacer la clé ;
- supprimer la clé.

Au début, cette option doit être limitée à des créateurs validés.

### Priorité

Moyenne-haute.

---

## Feature 2.5 — Validation automatique basique

Avant soumission, Claake doit vérifier :

- prompt système non vide ;
- description claire ;
- provider compatible ;
- modèle présent ;
- stratégie cohérente ;
- clé présente si stratégie clé créateur ;
- endpoint vendeur désactivé en V1 publique ;
- taille des champs bornée ;
- absence de contenu manifestement interdit.

### Priorité

Haute.

---

# Phase 3 — Validation admin et qualité

## Objectif

Éviter que des agents médiocres, dangereux ou mal configurés soient publiés.

## Feature 3.1 — File de revue admin

L'admin doit voir les agents en attente avec :

- nom ;
- créateur ;
- description ;
- prompt système ;
- provider ;
- modèle ;
- stratégie d'exécution ;
- limitations ;
- date de soumission.

Actions :

- approuver ;
- rejeter avec raison ;
- suspendre ;
- remettre en brouillon.

### Priorité

Très haute.

---

## Feature 3.2 — Test admin dans le chat

Depuis la revue admin :

```txt
Agent soumis
→ Tester dans le chat
→ conversation de validation
```

L'admin doit pouvoir vérifier concrètement que l'agent répond correctement.

### Priorité

Haute.

---

## Feature 3.3 — Checklist qualité agent

Ajouter une checklist simple :

- description claire ;
- cas d'usage précis ;
- prompt système sérieux ;
- provider et modèle compatibles ;
- message d'accueil utile ;
- suggestions présentes ;
- limitations présentes ;
- test chat satisfaisant.

### Priorité

Moyenne.

---

# Phase 4 — Rendre les agents plus pertinents

## Objectif

Passer d'un simple wrapper de prompt à un agent réellement utile.

## Feature 4.1 — Suggestions de prompts

Chaque agent doit pouvoir définir 3 à 6 prompts suggérés.

Exemples :

```txt
Analyse ce contrat
Résume ce document
Rédige une clause de confidentialité
Liste les risques principaux
Explique cette erreur
Prépare un plan d'action
```

Ces suggestions apparaissent dans le chat avant le premier message.

### Priorité

Très haute.

---

## Feature 4.2 — Message d'accueil personnalisé

Chaque agent doit avoir un message d'accueil.

Exemple :

```txt
Bonjour, je suis Juriste IA.
Envoie-moi une clause ou un contrat, et je peux t'aider à l'analyser.
```

### Priorité

Très haute.

---

## Feature 4.3 — Variables simples d'agent

Permettre au développeur de définir des variables :

- langue ;
- pays ;
- niveau de détail ;
- ton ;
- secteur ;
- objectif.

Exemple :

```txt
Pays : France
Niveau : expert
Format : analyse détaillée
```

Ces variables sont injectées dans le prompt système.

### Priorité

Haute, après stabilisation du chat.

---

## Feature 4.4 — Exemples few-shot

Permettre au développeur d'ajouter des exemples :

```txt
Utilisateur : Analyse cette clause...
Assistant : Résumé / Risques / Recommandation...
```

Ces exemples améliorent la stabilité et la qualité des réponses.

### Priorité

Moyenne.

---

## Feature 4.5 — Format de sortie

Le développeur peut choisir un format recommandé :

- libre ;
- sections ;
- checklist ;
- tableau ;
- JSON ;
- rapport ;
- plan d'action.

### Priorité

Moyenne.

---

# Phase 5 — Fichiers et base de connaissances

## Objectif

Permettre aux agents de travailler sur des documents et d'avoir du contexte métier.

## Feature 5.1 — Upload fichier utilisateur dans le chat

L'utilisateur peut envoyer :

- PDF ;
- texte ;
- image ;
- document ;
- code.

Cas d'usage :

- analyser un contrat ;
- résumer un PDF ;
- expliquer une erreur ;
- analyser une image ;
- lire une documentation ;
- comparer deux documents.

### Priorité

Haute, mais après durcissement des uploads.

---

## Feature 5.2 — Compatibilité fichiers par agent

Chaque agent doit déclarer :

```txt
Supporte les fichiers : oui/non
Types acceptés : PDF, image, texte, code
Taille maximale : 10 Mo
```

Dans le chat, l'upload n'apparaît que si l'agent le supporte.

### Priorité

Haute.

---

## Feature 5.3 — Base de connaissances agent

Le développeur peut ajouter des documents propres à l'agent :

- documentation ;
- PDF ;
- FAQ ;
- guides ;
- exemples ;
- corpus métier.

Claake utilise ces documents pour enrichir les réponses via une recherche contextuelle.

### Priorité

Moyenne-haute, après le MVP chat/création/review.

---

# Phase 6 — Sécurité, quotas et production

## Objectif

Ouvrir progressivement sans créer de risques majeurs.

## Feature 6.1 — Durcissement sécurité avant beta publique

À corriger avant ouverture large :

- rotation et suppression des secrets locaux ;
- scan secrets en CI ;
- protection SSRF renforcée ;
- uploads privés ou URLs signées courtes ;
- validation MIME/fichiers ;
- correction des redirects post-auth ;
- rate limiting dédié ;
- erreurs IA génériques côté client ;
- logs redigés.

### Priorité

Bloquante avant ouverture publique.

---

## Feature 6.2 — Quotas chat

Limiter :

- messages par minute ;
- messages par jour ;
- taille de prompt ;
- taille d'historique ;
- nombre de fichiers ;
- coût estimé par utilisateur.

### Priorité

Très haute dès qu'il y a des clés créateur ou Claake.

---

## Feature 6.3 — Observabilité

Suivre :

- nombre de messages ;
- erreurs provider ;
- latence ;
- agents les plus utilisés ;
- utilisateurs actifs ;
- coût estimé ;
- endpoints en erreur ;
- taux de conversion page agent vers chat.

### Priorité

Haute.

---

# Phase 7 — Monétisation

## Objectif

Ajouter la monétisation uniquement quand l'usage est validé.

## Feature 7.1 — Agents gratuits et premium

Modes possibles :

- gratuit ;
- payant one-time ;
- abonnement ;
- pay-per-use plus tard.

### Priorité

Basse pour le MVP initial.

---

## Feature 7.2 — Accès payant dans le chat

Avant d'ouvrir une session :

```txt
L'utilisateur a-t-il accès à cet agent ?
Oui → chat
Non → écran achat
```

### Priorité

Moyenne, après validation de l'usage.

---

## Feature 7.3 — Stripe Connect créateurs

Permettre de reverser une part des revenus aux développeurs.

### Priorité

Plus tard.

---

# Milestones recommandées

## Milestone 0 — Socle technique agent-chat

Livrable :

- lecture obligatoire de `docs/architecture/analyse-technique-architecture-claake.md` avant implémentation ;
- ajout des champs `welcomeMessage`, `suggestedPrompts`, `limitations`, `modelSettings`, `capabilities` côté Prisma/backend/shared ;
- création du type partagé `AgentChatConfig` ;
- création du use case backend `GetAgentChatConfigUseCase` ;
- création de l'endpoint `GET /agents/:id/chat-config` ;
- premières vérifications d'accès : agent publié, utilisateur connecté, clé API requise ;
- tests backend du contrat `AgentChatConfig`.

Objectif : rendre le chat piloté par un contrat backend clair, et non par de la logique dispersée côté frontend.

## Milestone 1 — Chat agent utilisable

Livrable :

- page agent avec bouton **Utiliser dans le chat** ;
- ouverture session chat agent ;
- gestion clé API manquante ;
- streaming stable ;
- historique sessions ;
- suggestions de prompts ;
- message d'accueil.

## Milestone 2 — Création agent V1

Livrable :

- formulaire création agent ;
- prompt système ;
- provider/modèle ;
- stratégie clé utilisateur/créateur ;
- message d'accueil ;
- suggestions ;
- brouillon ;
- test dans le chat ;
- soumission.

## Milestone 3 — Admin review

Livrable :

- liste agents pending ;
- page revue ;
- test chat admin ;
- approve/reject ;
- suspension.

## Milestone 4 — Desktop chat

Livrable :

- login desktop ;
- catalogue agents ;
- chat agent ;
- historique ;
- paramètres clés API.

## Milestone 5 — Qualité agent

Livrable :

- variables ;
- few-shot ;
- format de sortie ;
- limitations ;
- checklist qualité.

## Milestone 6 — Fichiers et connaissance

Livrable :

- upload fichier chat ;
- compatibilité par agent ;
- base documentaire agent ;
- recherche contextuelle simple.

## Milestone 7 — Beta publique contrôlée

Livrable :

- sécurité P0 corrigée ;
- quotas ;
- logs ;
- tests e2e ;
- CI propre ;
- premiers développeurs invités ;
- premiers agents validés.

---

# Les 10 prochaines features à développer

1. Ajouter le mode test agent draft/admin côté backend sans affaiblir le chat public.
2. Ajouter le bouton **Tester dans le chat** côté dashboard créateur.
3. Ajouter le bouton **Tester dans le chat** côté admin review pour agents `PENDING`.
4. Refactoriser la création/édition agent dans un `Agent Builder` réutilisable.
5. Utiliser `AgentChatConfig.capabilities` pour afficher/masquer l'upload dans le chat.
6. Ajouter retour automatique au chat après ajout d'une clé API utilisateur.
7. Renforcer `ValidateAgentUseCase` sur les nouveaux champs chat et désactiver l'endpoint vendeur en V1 publique.
8. Améliorer la page détail agent avec provider, modèle, stratégie, limitations et CTA access-aware.
9. Ajouter quotas chat simples : messages/minute, messages/jour, taille prompt/historique.
10. Ajouter tests e2e MVP : page agent → chat, clé API manquante, ajout clé, test draft, review admin.

## Features roadmap déjà réalisées ou très avancées

1. Lire et appliquer `docs/architecture/analyse-technique-architecture-claake.md` comme référence d'architecture — fait.
2. Ajouter les champs agent nécessaires au chat : `welcomeMessage`, `suggestedPrompts`, `limitations`, `modelSettings`, `capabilities` — fait.
3. Créer le contrat partagé `AgentChatConfig` — fait.
4. Créer le use case backend `GetAgentChatConfigUseCase` et l'endpoint `GET /agents/:id/chat-config` — fait.
5. Refactoriser le chat web autour de `AgentChatConfig` et d'un `ChatShell` — fait.
6. Ouvrir un agent directement dans le chat avec message d'accueil et suggestions — très avancé.
7. Gérer la clé API manquante depuis le chat avec un état actionnable — partiel avancé.
8. Afficher message d'accueil et prompts suggérés dans le chat — fait.
9. Sécuriser l'exécution chat contre agents suspendus/dépubliés — fait.
10. Durcir logs, chiffrement et paiements critiques — fait.

## Ancienne liste produit à garder comme repère

1. Ouvrir un agent directement dans le chat.
2. Afficher le message d'accueil agent dans le chat.
3. Afficher les suggestions de prompts agent.
4. Gérer la clé API manquante depuis le chat.
5. Créer la page paramètres clés API utilisateur.
6. Simplifier/améliorer le formulaire de création agent.
7. Ajouter le mode test agent dans le chat.
8. Ajouter la soumission agent à validation.
9. Ajouter la review admin approve/reject.
10. Stabiliser l'historique chat web puis desktop.

---

# Définition du MVP

Le MVP est atteint quand :

```txt
Un développeur peut créer un agent Claude/GPT
→ le tester dans le chat Claake
→ le soumettre
→ un admin peut le tester et le valider
→ un utilisateur peut le trouver
→ l'utiliser dans le chat web
→ puis dans le chat desktop
```

État actuel : le parcours utilisateur public web est bien avancé, mais le MVP n'est pas
encore atteint car il manque le test contrôlé des agents draft/pending et le builder agent
unifié.

Tout ce qui ne sert pas directement ce parcours doit être repoussé.

---

# Règle finale

Claake ne doit pas d'abord être une marketplace complexe.

Claake doit d'abord être :

> Le meilleur endroit pour publier, tester et utiliser des agents IA spécialisés dans un chat simple, fiable et agréable.
