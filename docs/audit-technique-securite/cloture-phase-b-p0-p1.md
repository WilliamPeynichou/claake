# Clôture Phase B — Sécurité P0/P1

Date : 2026-07-16
Branche : `fix/phase-b-secrets-management`
Décision : **Phase B code fermée ; accès beta conditionné à Phase A staging et aux actions opérateur listées ci-dessous.**

## Matrice de clôture

| ID | Statut | Correction / compensation | Preuve |
|---|---|---|---|
| P0-01 SSRF | Fermé | DNS effectif à la validation et à chaque requête ; toutes IP retournées vérifiées ; redirects refusés | `public-url.ts`, `IsPublicUrl`, tests DNS/private/mixte |
| P0-02 secrets | Accepté temporairement | env ignorés + `0600`, scan CI, procédure rotation/révocation ; secrets locaux remplacés pour stack locale | `docs/security/secrets-management.md`, `npm run secrets:scan` |
| P0-03 uploads publics | Fermé | bucket privé, URLs signées ≤300 s, aucune policy client, MIME réel/structure/taille, rollback orphelin | migration `20260715153000`, 12 tests upload, preuve locale `public=false` |
| P0-04 Stripe webhook | Fermé | signature, event idempotent, paiement `paid`, metadata, agent publié/payant, montant/devise, payment id unique | `handle-webhook.usecase.ts` + tests |
| P0-05 E2E critiques | Report Phase C (bloquant beta) | tests unitaires backend + smoke web présents ; live auth/paiement/upload exige staging | Roadmap Phase C ; aucune beta avant E2E live |
| P1-01 rate limiting | Fermé | profils dédiés chat/upload/checkout/webhook/onboarding/API keys ; quota chat user minute/jour + outils MCP | `RATE_LIMITS`, 7 tests metadata, `ChatQuotaService` |
| P1-02 erreurs IA | Fermé | client reçoit erreur générique ; logs redigent tokens/secrets | test `ChatController stream error redaction` |
| P1-03 champs non bornés | Fermé | `MaxLength`, `ArrayMaxSize`, limites config/prompt/collections/prix | DTO create/update + tests de bornes |
| P1-04 rôle metadata | Fermé | DB source d'autorité ; premier login toujours `USER`, metadata ignorée | guards + 3 tests rôle |
| P1-05 fichiers malveillants | Accepté partiellement | magic bytes + structure + PDF actif refusé ; AV/CDR absent, allowlist images/PDF seulement | `upload-file.validator.ts`, doc exploitation |
| P1-06 mobile mocké | Accepté / exclu beta | Expo reste prototype mocké, explicitement hors release/beta | Phase F décide intégration ou exclusion définitive |
| P1-07 desktop | Fermé | endpoint release obligatoire HTTPS/non-local, CSP, prototype gelé, capability zéro IPC | build négatif + `cargo check` |
| P1-08 open redirect | Fermé | allowlist chemins internes, rejet absolu/protocol-relative/encodé/backslash | 5 tests Playwright |
| P2-04 lint/audit | Fermé | lint warnings bloquants CI ; 0 high/critical ; 10 moderate Expo acceptées | CI, `vulnerabilites-acceptees.md` |

## Acceptations formelles et conditions de levée

### Secrets fournisseurs (P0-02)

Acceptation limitée au développement local. **Interdit d'inviter un utilisateur beta** avant :

1. création des secrets staging distincts ;
2. déploiement et smoke auth/upload/paiement ;
3. révocation des anciennes clés Supabase/DB/Stripe/IA ;
4. journal de rotation complété sans valeurs secrètes.

Responsable : opérateur ayant accès aux consoles fournisseurs. Procédure :
`docs/security/secrets-management.md`.

### Antivirus/CDR (P1-05)

Accepté pour beta contrôlée car : formats limités JPEG/PNG/WebP/GIF/PDF, structure validée, PDF
actif refusé, objets privés, non exécutés. Interdit d'ajouter Office, archives, exécutables ou accès
public avant pipeline quarantaine → scan → promotion.

### Mobile (P1-06)

Hors périmètre beta et ouverture publique actuelle. Aucun artefact Expo ne doit être distribué comme
client Claake fonctionnel. Décision finale en Phase F.

### E2E live (P0-05)

Déplacé en Phase C car dépend matériellement du staging Phase A. Reste **gate beta**, pas dette
facultative : auth, SSRF MCP, upload privé, review/révocation et paiement doivent réussir en live.

## Vérification finale locale

```txt
Supabase local : healthy
bucket agent-files-private : public=false, limite=10 MiB, 5 MIME, 0 policy client
backend : démarre sur :3002 ; /health=200 ; upload sans auth=401
lint : vert
security:check : vert (0 high/critical ; moderate Expo acceptées)
backend tests : 49 suites / 303 tests
builds : API/web/desktop verts ; cargo check vert
```

## Décision

Phase B est fermée selon critère roadmap : éléments P0/P1 **corrigés ou acceptés explicitement avec
justification et condition de levée**. Cela ne vaut pas autorisation beta : Phase A distante puis gates
opérateur/E2E Phase C restent obligatoires.
