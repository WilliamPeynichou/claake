# Déploiement staging sur o2Switch

## Architecture retenue

o2Switch mutualisé ne fournit pas Docker. Staging utilise donc deux applications Node.js 22
Phusion Passenger, chacune sur un sous-domaine HTTPS :

```txt
staging.<domaine>      → Next.js standalone → current/frontendWeb/server.js
api-staging.<domaine>  → NestJS             → current/backend/dist/src/main.js
```

Build effectué dans GitHub Actions. Serveur reçoit deux archives Linux prêtes à démarrer. Chaque
release est extraite dans `releases/<git-sha>`, puis un symlink `current` bascule atomiquement.

## Acceptation temporaire Supabase

Le projet Supabase existant `claake` sert temporairement de staging. Cette décision ne satisfait
pas l'isolation staging/production prévue par la roadmap.

Règles :

- aucune donnée utilisateur réelle pendant la beta staging ;
- clés Stripe test uniquement ;
- ne pas considérer ce projet comme production ;
- créer un projet Supabase production distinct avant ouverture publique ;
- migration Storage `20260715153000` non appliquée avant sauvegarde et validation opérateur.

## Préparation cPanel

### 1. DNS et TLS

Créer deux sous-domaines dans cPanel :

- `staging.<domaine>` ;
- `api-staging.<domaine>`.

Attendre certificat AutoSSL valide sur les deux URLs avant déploiement.

### 2. Racines

Choisir deux dossiers hors `public_html`, par exemple :

```txt
/home/<user>/claake-staging-web
/home/<user>/claake-staging-api
```

Créer dans chacun :

```txt
releases/
current -> releases/<sha>
```

Le workflow crée `releases` et `current`; les dossiers parents doivent exister.

### 3. Applications Node.js 22

Dans **Setup Node.js App** :

#### Web

```txt
Node version: 22
Mode: Production
Application root: claake-staging-web/current/frontendWeb
Application URL: https://staging.<domaine>
Startup file: server.js
```

#### API

```txt
Node version: 22
Mode: Production
Application root: claake-staging-api/current/backend
Application URL: https://api-staging.<domaine>
Startup file: dist/src/main.js
```

NestJS détecte Passenger et écoute sur sa socket `passenger`; aucun port public n'est requis.

## Variables runtime o2Switch

Les définir dans l'interface de chaque application Node.js. Ne jamais les committer ni les envoyer
dans le chat.

### Web

| Variable | Valeur attendue |
| --- | --- |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé anonyme Supabase staging |
| `NEXT_PUBLIC_API_URL` | origine API staging HTTPS, suffixée par `/v1` |

Les variables `NEXT_PUBLIC_*` sont intégrées pendant le build GitHub. Les garder aussi dans cPanel
rend le runtime explicite, mais toute modification exige un nouveau build.

### API

| Variable | Valeur attendue |
| --- | --- |
| `NODE_ENV` | `production` |
| `WEB_URL` | origine web staging HTTPS |
| `DATABASE_URL` | connexion PostgreSQL Supabase staging |
| `SUPABASE_URL` | URL Supabase staging |
| `SUPABASE_ANON_KEY` | clé anonyme Supabase staging |
| `SUPABASE_SERVICE_ROLE_KEY` | clé service Supabase staging |
| `ENCRYPTION_KEY` | 64 caractères hexadécimaux dédiés staging |
| `STRIPE_SECRET_KEY` | clé Stripe test |
| `STRIPE_WEBHOOK_SECRET` | secret webhook Stripe test |

Ajouter les clés fournisseurs IA/OAuth nécessaires aux parcours testés. Ne jamais réutiliser les
secrets production.

## SSH o2Switch

1. Activer SSH dans cPanel.
2. Autoriser IP si pare-feu o2Switch le demande.
3. Générer une clé de déploiement dédiée, sans réutiliser une clé personnelle.
4. Ajouter clé publique au compte o2Switch.
5. Conserver clé privée uniquement dans GitHub Environment `staging`.
6. Capturer empreinte serveur depuis réseau de confiance :

```bash
ssh-keyscan -H <hôte-ssh-o2switch> > known_hosts
ssh-keygen -lf known_hosts
```

Comparer empreinte avec celle fournie par o2Switch avant ajout GitHub.

## Configuration GitHub Environment `staging`

Déjà présents :

```txt
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_SUPABASE_URL
```

Secrets restant à ajouter :

```txt
O2SWITCH_HOST
O2SWITCH_USER
O2SWITCH_SSH_KEY
O2SWITCH_KNOWN_HOSTS
```

Variables non secrètes à ajouter :

```txt
WEB_URL=https://staging.<domaine>
API_URL=https://api-staging.<domaine>
O2SWITCH_WEB_ROOT=/home/<user>/claake-staging-web
O2SWITCH_API_ROOT=/home/<user>/claake-staging-api
```

## Déploiement

Workflow manuel :

```txt
Actions → Deploy staging to o2Switch → Run workflow
```

Il :

1. valide toutes les configurations ;
2. construit Next standalone et NestJS ;
3. transfère deux artefacts versionnés et installe les dépendances de production déterministes ;
4. transfère les archives par SSH avec vérification `known_hosts` ;
5. active les deux releases atomiquement ;
6. redémarre Passenger ;
7. vérifie accueil web et `GET /health` API.

Les migrations DB ne sont volontairement pas lancées par ce workflow tant que le projet Supabase
existant est réutilisé.

## Rollback

Lister releases :

```bash
ls -1 /home/<user>/claake-staging-web/releases
ls -1 /home/<user>/claake-staging-api/releases
```

Basculer les deux applications vers même SHA validé :

```bash
ln -sfn /home/<user>/claake-staging-web/releases/<sha> \
  /home/<user>/claake-staging-web/current.new
ln -sfn /home/<user>/claake-staging-api/releases/<sha> \
  /home/<user>/claake-staging-api/current.new
mv -Tf /home/<user>/claake-staging-web/current.new \
  /home/<user>/claake-staging-web/current
mv -Tf /home/<user>/claake-staging-api/current.new \
  /home/<user>/claake-staging-api/current
touch /home/<user>/claake-staging-web/current/frontendWeb/tmp/restart.txt
touch /home/<user>/claake-staging-api/current/backend/tmp/restart.txt
```

Puis vérifier :

```bash
curl --fail https://staging.<domaine>/
curl --fail https://api-staging.<domaine>/health
```

Ne jamais rollback code sans vérifier compatibilité du schéma DB. Les migrations destructives
nécessitent procédure distincte et sauvegarde testée.
