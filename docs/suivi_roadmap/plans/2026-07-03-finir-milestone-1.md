# Plan — Finir le Milestone 1 (Chat agent utilisable)

Date : 2026-07-03
Réf : `docs/roadmap-claake-agents-chat.md` (Milestone 1, Features 1.1–1.4)
Réf CR précédent : `docs/suivi_roadmap/comptes-rendus/2026-07-03-socle-agent-chat.md`

## Objectif

Passer Milestone 1 de ~75% à 100% : un agent publié s'utilise dans le chat comme un vrai
assistant, sans friction. Aucune règle métier dupliquée côté UI : tout dérive de
`AgentChatConfig` et de `useChat`.

Milestone 1 est considéré fini quand :

```txt
Découvrir un agent
→ Utiliser dans le chat
→ (si besoin) ajouter clé API et revenir au chat
→ discuter en streaming fiable
→ retry si erreur
→ upload seulement si l'agent le supporte
→ retrouver l'historique
```

Hors périmètre (autres milestones) : mode test draft/admin, Agent Builder, desktop.

---

## État de départ (constaté dans le code)

- `frontendWeb/features/chat/` : `ChatShell` + `use-agent-chat` en place.
- `AgentChatConfig` consommé pour login/api-key/purchase/not_published.
- `shared/hooks/use-chat.ts` : expose `streaming` et `error`, **pas de `retry`**.
- `frontendWeb/components/chat/multimodal-input.tsx` : `accept` **hardcodé**
  (`image/*, application/pdf`), pas conditionné par `capabilities`.
- Clés API : `frontendWeb/app/(dashboard)/dashboard/api-keys/page.tsx` via `useApiKeys`,
  **pas de retour automatique** vers le chat après ajout.
- Page détail agent : bouton **Utiliser dans le chat** présent, infos provider/stratégie
  encore pauvres.

---

## Lot 1 — Bouton retry + erreurs actionnables (Feature 1.4)

### Backend
Rien (erreurs déjà génériques côté client, cf. durcissement sécurité).

### Shared
`shared/hooks/use-chat.ts` :
- mémoriser le dernier message envoyé (contenu + attachments) ;
- exposer `retry(): Promise<void>` qui renvoie ce dernier message ;
- exposer `canRetry: boolean` (vrai si `error` et pas `streaming`).

### Web
`frontendWeb/features/chat/` :
- composant `components/chat-error.tsx` : message d'erreur clair + bouton **Réessayer** ;
- brancher `retry`/`canRetry` dans `use-agent-chat` puis `chat-shell`.

### Tests
- unitaire `use-chat` : après erreur, `retry` relance le même payload ;
- vérif manuelle : couper le réseau, envoyer, voir erreur + retry.

### Critère de fin
Une erreur de génération n'est jamais un cul-de-sac : bouton retry visible et fonctionnel.

---

## Lot 2 — Upload conditionné par capabilities (Features 1.4 + 5.2 partiel)

### Backend
Déjà : `AgentChatConfig.capabilities = { files, images }`.

### Web
`MultimodalInput` :
- accepter des props `capabilities: { files: boolean; images: boolean }` ;
- masquer le bouton d'upload si `!files && !images` ;
- construire dynamiquement `accept` :
  - images seules → `image/jpeg,image/png,image/webp` ;
  - files → ajouter `application/pdf` (+ types texte/code si déjà supportés) ;
- message clair si type refusé.

`chat-shell` :
- passer `chatConfig.capabilities` à `MultimodalInput` ;
- désactiver l'upload tant que `access.can_chat === false`.

### Tests
- vérif manuelle : agent `capabilities.files=false` → pas d'upload ;
- agent images seulement → PDF refusé proprement.

### Critère de fin
L'upload n'apparaît que si l'agent le déclare, aligné sur le backend.

---

## Lot 3 — Retour automatique au chat après ajout de clé API (Feature 1.3)

### Web
- au clic **Ajouter une clé** depuis `MissingApiKeyCard`, naviguer vers
  `/dashboard/api-keys?returnTo=/chat/{agentId}&provider={required_provider}` ;
- page api-keys : lire `returnTo` + `provider`, présélectionner le provider, et après
  ajout réussi, rediriger vers `returnTo` ;
- au retour, `use-agent-chat` recharge `AgentChatConfig` (déjà déclenché par le montage) :
  si la clé est maintenant présente, `access.can_chat` repasse à `true`.

### Optionnel (propre)
Extraire `frontendWeb/features/api-keys/` (hook + form) pour ne pas grossir la page.

### Tests
- vérif manuelle : agent user_api_key sans clé → carte → ajout → retour chat utilisable.

### Critère de fin
Le parcours « clé manquante → ajout → retour chat » se fait sans copier/coller d'URL.

---

## Lot 4 — Page détail agent orientée usage (Feature 1.1)

### Web
`frontendWeb/app/(public)/agents/[id]/page.tsx` (garder la page fine, extraire si besoin
dans `frontendWeb/features/agents/`):
- afficher provider (Claude/GPT/Mistral…) et modèle recommandé ;
- afficher stratégie d'exécution en clair (clé utilisateur / clé créateur) ;
- afficher `limitations` ;
- CTA principal **Utiliser dans le chat** access-aware :
  - non connecté → **Se connecter pour utiliser** ;
  - clé requise → indication « nécessite une clé {provider} » ;
  - payant sans achat → **Débloquer / Acheter** ;
  - sinon → **Utiliser dans le chat**.

Source des infos : réutiliser `AgentChatConfig` (ou `Agent`) sans recalcul de règles.

### Tests
- vérif manuelle des 4 états de CTA.

### Critère de fin
En < 10 s, l'utilisateur comprend l'agent et sait s'il peut l'ouvrir.

---

## Lot 5 — Robustesse chat + finitions (Feature 1.4)

- états loading propres (déjà partiels) : vérifier squelettes/spinner cohérents ;
- affichage provider/modèle dans le header (déjà partiel, vérifier lisibilité) ;
- suppression de session : confirmer UX (déjà présent) ;
- vérifier scroll auto + stop streaming.

### Critère de fin
Le chat se comporte comme un vrai assistant, pas une démo.

---

## Ordre d'exécution recommandé

1. Lot 1 (retry) — impact fort, petit périmètre.
2. Lot 3 (retour clé API) — débloque le parcours user_api_key.
3. Lot 2 (capabilities upload).
4. Lot 4 (page détail).
5. Lot 5 (finitions).

Chaque lot = 1 branche courte + 1 commit + vérifs, mergée sur `feature/chat-shell-refactor`
ou une branche `feature/milestone-1-finish`.

---

## Vérifications globales avant clôture Milestone 1

- `npm run web-build` OK (env prod valides) ;
- `biome check` sur le périmètre touché OK ;
- tests `use-chat` (retry) OK ;
- vérifs manuelles documentées (4 CTA, upload gating, retour clé, retry) ;
- mettre à jour :
  - `docs/roadmap-claake-agents-chat.md` → Milestone 1 = 100% ;
  - nouveau compte rendu dans `docs/suivi_roadmap/comptes-rendus/`.

---

## Risques / points d'attention

- `useChat` est partagé (web + desktop) : `retry` doit rester cross-platform, pas de dep web.
- Ne pas réintroduire de règle métier côté UI : capabilities/CTA viennent du backend.
- `accept` dynamique : garder cohérent avec la validation MIME backend upload.
- Le retour clé API dépend d'un rechargement `AgentChatConfig` : vérifier qu'il refetch
  bien au montage / focus.

---

## Définition de terminé (Milestone 1)

- [ ] Retry fonctionnel après erreur.
- [ ] Upload conditionné par `capabilities`.
- [ ] Parcours clé API → retour chat fluide.
- [ ] Page détail agent access-aware.
- [ ] Finitions robustesse chat.
- [ ] Docs + compte rendu mis à jour.
