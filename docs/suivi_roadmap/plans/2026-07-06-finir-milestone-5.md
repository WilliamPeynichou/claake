# Plan — Finir le Milestone 5 (Qualité agent)

Date : 2026-07-06
Branche : `feature/milestone-5-agent-quality`
Réf : `docs/roadmap-claake-agents-chat.md` — Milestone 5

## Objectif

Passer d'un wrapper prompt simple à un agent mieux cadré :

```txt
variables
→ few-shot examples
→ output format
→ quality checklist
→ prompt final enrichi au moment du chat
```

## Contraintes architecture

- Backend source de vérité pour stockage, validation et injection prompt.
- API publique en `snake_case`.
- Prisma/backend interne en camelCase.
- Propagation obligatoire : Prisma, migration, DTO, entity, mapper, repository,
  transformer, shared, web create/edit, admin review, page détail.
- Pas de refactor Agent Builder commun dans ce lot.

## Checklist

- [x] Ajouter champs Prisma : `variables`, `fewShotExamples`, `outputFormat`,
      `qualityChecklist`.
- [x] Ajouter migration SQL `0008_add_agent_quality_fields`.
- [x] Propager backend DTO/create/update/entity/mapper/repository/transformer.
- [x] Exposer champs dans `AgentResponseDto` et `AgentChatConfig`.
- [x] Injecter variables/few-shot/output format dans le prompt envoyé au provider.
- [x] Ajouter types shared.
- [x] Ajouter champs create/edit web.
- [x] Afficher infos dans page détail et admin review.
- [x] Ajouter tests ciblés backend + build/lint.

## Critère terminé

```txt
creator configures quality fields
→ backend stores them
→ chat uses them in provider system prompt
→ admin sees them during review
→ public detail/chat-config can display them
```

## Hors périmètre

- Agent Builder commun.
- Checklist qualité comme workflow admin persistant.
- UI nested sophistiquée ; V1 utilise textareas JSON/lignes.

## Statut

✅ Réalisé. Voir compte-rendu
`docs/suivi_roadmap/comptes-rendus/2026-07-06-finition-milestone-5.md`.
