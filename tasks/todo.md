# Phase B — Uploads privés et validation réelle

Branche : `fix/phase-b-private-uploads`

## Plan

- [x] Auditer les flux runtime et agents/config.
- [x] Utiliser détection magic bytes maintenue (`file-type`) + validation de structure/fin de fichier.
- [x] Garder runtime dans bucket privé, URLs signées ≤ 5 minutes, chemins stricts.
- [x] Ajouter migration Supabase idempotente : bucket privé, MIME/taille, aucune policy publique.
- [x] Supprimer upload public `.agentjson` (parsing local seulement) et privatiser bucket legacy.
- [x] Nettoyer objet Storage si écriture DB échoue.
- [x] Vérifier tests, lint, audit et builds.

## Review

- Runtime : bucket privé `agent-files-private`, aucune policy client, URLs signées ≤ 300 s,
  validation stricte des chemins avant upload/signature/suppression.
- Migration Supabase idempotente créée : bucket non public, 10 Mio, allowlist MIME ; retire policies
  publiques et privatise le bucket `.agentjson` legacy.
- Validation : `file-type` non vulnérable + cohérence MIME/extension + structure/terminaison réelle ;
  PDF actif et fichiers tronqués refusés.
- Cohérence Storage/DB : suppression compensatoire si création DB échoue ; taille persistée depuis
  buffer réel, erreurs Storage delete propagées.
- `.agentjson` : parsing local pour hydrater le formulaire, plus aucun upload/public URL ; images
  marketplace restent publiques car assets d'affichage volontaires.
- Limite assumée : pas d'AV/CDR disponible ; formats réduits à images/PDF, non exécutés. Procédure
  quarantaine documentée avant toute extension de formats.
- Vérifié : 46 suites / 293 tests backend, lint vert, audit high/critical vert (10 moderate Expo
  acceptées), builds API et web verts.
