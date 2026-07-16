# Roadmap — Suite : de la V1 fonctionnelle à l'ouverture publique

Date : 2026-07-12
Réf : `docs/roadmap-claake-agents-chat.md` (M0 → M12 livrés),
`docs/suivi_roadmap/plans/2026-07-12-m13-staging-beta-skills-public.md`,
`docs/audit-technique-securite/00-synthese-executive-et-decision-production.md`.

## Contexte

Le développement fonctionnel est terminé (M0 → M12 mergés dans `main`). L'audit sécurité
conclut : **non prêt pour une production publique large**. Ce document est la roadmap
consolidée pour rendre le projet utilisable par tous les utilisateurs, ordonnée par
verrous réels.

```txt
Phase A — infra staging + CI
→ Phase B — sécurité P0/P1
→ Phase C — beta contrôlée
→ Phase D — skills publiques (M13 Lots 2-3)
→ Phase E — exploitation/tuning
→ Phase F — ouverture publique
```

---

## Phase A — Staging et CI (bloquant, M13 Lot 1)

Objectif : environnement reproductible hors machine locale, CI verte.

- [ ] Créer projet **Supabase staging** séparé ; projet existant lié temporairement, secrets GitHub
      configurés, séparation staging/prod toujours obligatoire avant ouverture.
- [x] Configurer `backend` staging : artefact Passenger + workflow o2Switch prêts ; variables runtime,
      accès SSH et clés Stripe test restent à injecter côté opérateur.
- [x] Configurer `frontendWeb` staging : build Next standalone + workflow o2Switch prêts ; domaine
      HTTPS et URL API restent à créer côté opérateur.
- [x] Configurer `frontendApp` desktop : endpoint staging validé par environnement ; URL finale reste
      à injecter après création du sous-domaine API.
- [x] Débloquer la collecte de pages Next et le **build production complet en CI** ; gates locaux
      complétés par migrations vierges + build/smoke image backend, exécution GitHub à confirmer.
- [ ] Corriger `npm run lint` (actuellement en échec) et le rendre bloquant en CI.

Critère : `main` déployable en staging par pipeline, CI verte (lint + tests + builds).

## Phase B — Sécurité P0/P1 (bloquant beta)

Objectif : lever les blocages de l'audit avant tout utilisateur réel.

- [x] **P0-01 SSRF** : résolution DNS/IP effective complète sur endpoints vendeurs et
      URLs de config (`is-public-url.validator`, `endpoint-proxy.provider`).
- [x] **P0-02 Secrets** : assainissement local + scanner/procédure terminés ; rotation fournisseurs
      acceptée temporairement et bloquante avant beta (voir clôture Phase B).
- [x] **Uploads** : Supabase Storage privé (URLs signées), validation MIME/structure réelle,
      limites strictes ; AV/CDR accepté pour allowlist images/PDF privée.
- [x] **Stripe webhook** : idempotence complète + recoupement montant/devise/statut.
- [x] **Rate limiting ciblé** : quotas dédiés chat, upload, paiement, agents, clés API,
      coûts IA (au-delà du throttling générique).
- [x] **Clients** : open redirect post-auth corrigé, fallbacks API localhost interdits en build prod,
      capabilities/CSP Tauri durcies.
- [x] Vulnérabilités high/critical résorbées ; 10 modérées Expo acceptées et documentées.

Clôture et acceptations :
`docs/audit-technique-securite/cloture-phase-b-p0-p1.md`.

Critère : P0/P1 de l'audit fermés ou explicitement acceptés avec justification écrite.

## Phase C — Beta contrôlée (M13 Lot 1 suite)

Objectif : premiers utilisateurs réels invités.

- [ ] E2E serveur **MCP HTTP live** contre staging (auth, SSRF, review, révocation).
- [ ] Test live desktop Tauri contre staging (dette M4).
- [ ] Premiers tests automatisés clients : smoke `frontendWeb` (Playwright existant à
      étendre), tests unitaires `shared`.
- [ ] Inviter les premiers développeurs beta.
- [ ] Procédures **incident/rollback** + surveillance renforcée (observabilité M7 branchée
      sur staging).
- [ ] Brancher l'action **Suspendre** dans la gestion globale des agents publiés (dette M3).

Critère : parcours complet (création → review → chat public → paiement) prouvé en staging
par des utilisateurs externes, sans incident bloquant.

## Phase D — Skills publiques (M13 Lots 2-3)

Objectif : différenciateur marketplace complet.

- [ ] Statuts `DRAFT/PENDING/APPROVED/REJECTED/SUSPENDED` pour skills publiques.
- [ ] Endpoints + file admin de review skills (raisons, audit).
- [ ] Marketplace/annuaire skills : recherche, détail, attachement d'une skill approuvée.
- [ ] Ownership, visibilité privée/publique, révocation immédiate des skills attachées.
- [ ] UI bibliothèque : attacher/détacher une skill à plusieurs agents.
- [ ] Sélection vectorielle skills : chunks/embeddings (pipeline M9), retrieval hybride
      cosine + fallback keyword, réindexation, tests.

Critère : une skill publique revue, attachée et sélectionnée sémantiquement en staging.

## Phase E — Exploitation et tuning (après volume réel, M13 Lot 4)

À déclencher uniquement sur métriques réelles :

- [ ] Index IVFFlat pgvector (`lists/probes`) après mesure du corpus/latence.
- [ ] Imputation des coûts embeddings créateur/utilisateur après mesure d'usage.
- [ ] Circuit breaker MCP distribué/persistant si déploiement multi-instance.
- [ ] Épinglage socket anti DNS rebinding seulement si risque mesuré.
- [ ] Quotas MCP dédiés + limite de concurrence (dette M10).

## Phase F — Ouverture publique

- [ ] Environnement production séparé (Supabase prod, Stripe live, secrets dédiés).
- [ ] Revue finale audit : re-passer les points `04-interfaces-tests-decision-production.md`.
- [ ] Mobile Expo : décision produit — brancher auth/API réelles ou exclure du lancement
      (actuellement prototype mocké).
- [ ] Dettes UX restantes : éditeur UI variables/few-shot (M5), code-splitting chunk
      desktop >500 kB (M4).

Critère final :

```txt
staging + prod séparés, CI verte
→ audit P0/P1 fermés
→ beta sans incident bloquant
→ skills publiques revues et sélectionnées
→ ouverture publique
```

## Ordre d'exécution recommandé

1. Phase A (infra) — rien d'autre ne peut être prouvé sans staging.
2. Phase B (sécurité) — en parallèle partiel de A (SSRF, secrets, uploads ne dépendent pas du staging).
3. Phase C (beta) — dépend de A + B.
4. Phase D (skills publiques) — parallélisable avec C après le Lot 1.
5. Phases E/F — pilotées par métriques réelles puis go/no-go final.
