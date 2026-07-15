# Gestion et rotation des secrets

Date : 2026-07-15 — propriétaire : équipe plateforme/sécurité

## Règles obligatoires

1. Aucun secret dans Git, issue, log, capture, Slack ou variable `NEXT_PUBLIC_*` / `VITE_*`.
2. `.env` sert uniquement au développement local, reste ignoré et permission `0600` recommandée.
3. Staging et production utilisent des projets/comptes séparés et des secrets distincts.
4. Les secrets serveur vivent dans le secret manager du fournisseur de déploiement. Les variables
   publiques Supabase anon/publishable restent non privilégiées, mais doivent aussi être séparées.
5. CI n'utilise que placeholders non fonctionnels pour les builds. Les jobs d'intégration live
   utilisent des GitHub Environments séparés avec approbation et secrets à portée minimale.
6. Rotation au moins tous les 90 jours, immédiatement après exposition, départ d'un mainteneur ou
   suspicion d'incident.

## Inventaire et emplacement

| Secret | Portée | Stockage | Rotation/révocation |
|---|---|---|---|
| `DATABASE_URL` | backend staging/prod | secret manager déploiement | nouveau mot de passe DB, mettre à jour backend, révoquer ancien |
| `SUPABASE_SERVICE_ROLE_KEY` | backend seulement | secret manager | Supabase Dashboard/API keys ; jamais client |
| `SUPABASE_ANON_KEY` | clients + backend | variables publiques par env | rotation Supabase si nécessaire |
| `STRIPE_SECRET_KEY` | backend | secret manager | Stripe Developers/API keys ; clé restreinte si possible |
| `STRIPE_WEBHOOK_SECRET` | backend webhook | secret manager | recréer secret endpoint, déployer, retirer ancien |
| `ENCRYPTION_KEY` | backend | secret manager | rotation versionnée ; voir procédure AES ci-dessous |
| clés OpenAI/Mistral | backend | secret manager | créer nouvelle clé, déployer, révoquer ancienne |
| OAuth GitHub secret | backend | secret manager | régénérer OAuth app, déployer, révoquer ancien |

## Rotation immédiate P0-02

L'audit local a détecté des valeurs sensibles dans `backend/.env` ignoré. Leur présence hors Git
n'empêche pas qu'elles puissent être anciennes ou compromises. Une personne ayant accès aux
fournisseurs doit effectuer cette checklist sans copier les valeurs dans un ticket :

- [ ] Créer/identifier projets Supabase **staging** et **production** distincts.
- [ ] Régénérer mot de passe DB et `DATABASE_URL` de chaque environnement.
- [ ] Régénérer service role/secret Supabase ; mettre à jour backend uniquement.
- [ ] Créer nouvelles clés Stripe test pour staging ; live pour production ; permissions minimales.
- [ ] Recréer secrets des endpoints webhook Stripe, un endpoint par environnement.
- [ ] Régénérer clés OpenAI/Mistral/OAuth utilisées, si activées.
- [ ] Générer une nouvelle `ENCRYPTION_KEY` par environnement.
- [ ] Déployer nouvelles valeurs, redémarrer, vérifier health/auth/upload/paiement.
- [ ] Révoquer les anciennes valeurs après validation (fenêtre maximale 30 minutes).
- [ ] Remplacer le `.env` local par valeurs de développement/staging à privilèges minimaux.
- [ ] Noter date, opérateur et identifiants de versions (jamais les valeurs) dans journal d'exploitation.

La tâche P0-02 ne peut être déclarée totalement fermée avant cases cochées par opérateur habilité.

## Rotation `ENCRYPTION_KEY`

Le backend chiffre des clés utilisateur/vendeur avec AES-GCM. Une rotation brutale sans conservation
de l'ancienne clé rend les données illisibles. Utiliser le keyring existant :

1. ajouter nouvelle clé avec nouvel identifiant dans configuration sécurisée ;
2. définir nouvel identifiant courant pour les nouvelles écritures ;
3. réencrypter les données existantes en batch, avec sauvegarde DB et métrique d'échec ;
4. vérifier que plus aucun ciphertext ne référence ancien identifiant ;
5. retirer ancienne clé du secret manager.

Ne jamais réutiliser la même clé entre staging et production.

## Incident secret exposé

1. Révoquer/désactiver d'abord ; ne pas attendre nettoyage Git.
2. Identifier portée via logs fournisseur et période d'exposition.
3. Rotation complète des secrets dérivés ou partageant le même compte.
4. Purger le secret du fichier et de l'historique si Git l'a contenu (`git filter-repo`), puis forcer
   tous les clones à se resynchroniser. La purge ne remplace jamais la révocation.
5. Ouvrir incident avec chronologie, impact, actions et prévention — sans valeur secrète.

## Contrôles

- `npm run secrets:scan` scanne fichiers Git suivis et non ignorés avant commit/CI.
- CI exécute ce gate sur chaque PR et push vers `main`.
- `git ls-files '*env*'` ne doit montrer que fichiers `.example` et code de validation.
- Les logs applicatifs utilisent redaction ; ne jamais logger headers Authorization, cookies ou env.
