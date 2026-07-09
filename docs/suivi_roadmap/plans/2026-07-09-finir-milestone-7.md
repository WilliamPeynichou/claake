# Plan — Finir Milestone 7 Beta publique contrôlée

Date : 2026-07-09
Réf : `docs/roadmap-claake-agents-chat.md` — M7

## Objectif

Finir M7 avant Phase 8 :

```txt
CI propre
→ e2e UI MVP
→ observabilité beta
→ preuves de vérification
```

## Architecture respectée

- Backend reste source vérité métier.
- Observabilité ajoutée côté backend, proche `ProviderExecution` / chat, sans logique UI.
- Next.js reste consommateur API ; aucun recalcul métier ajouté côté pages.
- Documentation suit `docs/suivi_roadmap/README.md` : plan + compte-rendu.

## Livrables

1. Workflow GitHub Actions CI PR :
   - `npm ci` ;
   - Prisma generate ;
   - Biome lint ;
   - backend tests unitaires ;
   - backend e2e ;
   - builds API/web/desktop ;
   - gates sécurité existants.

2. e2e UI Playwright MVP :
   - config Playwright web ;
   - smoke tests publics sans credentials ;
   - script npm dédié.

3. Observabilité beta minimale :
   - service application backend pour événements chat/provider ;
   - logs structurés redigés ;
   - latence provider ;
   - succès/erreur ;
   - agent/provider/model/user/session non sensibles.

4. Vérifications :
   - lint ciblé/global selon coût ;
   - tests backend ;
   - e2e backend ;
   - builds ;
   - Playwright si navigateur installable.

## Hors scope

- Dashboard métriques complet.
- Export OpenTelemetry/Prometheus.
- Tests UI auth complets Supabase live.
- Phase 8 tools.

## Critères de fin M7

M7 considéré terminé si CI existe, e2e UI smoke existe, observabilité chat/provider existe, et résultats vérifications sont documentés avec limites connues.
