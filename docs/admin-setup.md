# Création des comptes Admin et Super Admin

## Prérequis

- Docker lancé avec la BDD locale (`docker compose up`)
- Backend NestJS en cours (`npm run api`)
- Accès au [dashboard Supabase](https://supabase.com/dashboard)

---

## Étape 1 — Créer les comptes Supabase Auth

1. Aller sur **Supabase Dashboard > Authentication > Users**
2. Cliquer sur **Add user > Create new user**
3. Créer les comptes suivants :

| Email | Mot de passe | Rôle cible |
|---|---|---|
| `superadmin@claake.com` | *(ton choix)* | SUPER_ADMIN |
| `admin@claake.com` | *(ton choix)* | ADMIN |

> Cocher **Auto Confirm User** pour activer le compte immédiatement.

---

## Étape 2 — Synchroniser avec la BDD locale

Les comptes Supabase Auth existent dans le cloud, mais la table `users` en BDD Docker locale ne les connaît pas encore.

### Option A — Via Prisma Studio

```bash
cd backend
npx prisma studio
```

Dans la table `users`, modifier le champ `role` :
- `superadmin@claake.com` → `SUPER_ADMIN`
- `admin@claake.com` → `ADMIN`

Pour l'admin, remplir aussi `admin_permissions` :

```json
{
  "canManageUsers": true,
  "canManageAgents": true,
  "canManageCategories": true,
  "canManageReviews": true,
  "canViewStats": true,
  "canViewActivity": true
}
```

### Option B — Via SQL (Docker)

```bash
docker exec -it supabase-db psql -U postgres -d postgres
```

```sql
-- Mettre à jour les rôles
UPDATE users SET role = 'SUPER_ADMIN' WHERE email = 'superadmin@claake.com';

UPDATE users
SET role = 'ADMIN',
    admin_permissions = '{
      "canManageUsers": true,
      "canManageAgents": true,
      "canManageCategories": true,
      "canManageReviews": true,
      "canViewStats": true,
      "canViewActivity": true
    }'::jsonb
WHERE email = 'admin@claake.com';
```

---

## Étape 3 — Synchroniser le rôle dans Supabase Auth metadata

Pour que le middleware frontend détecte le rôle, il doit être présent dans les metadata Supabase Auth.

Dans le **SQL Editor** du dashboard Supabase (cloud), exécuter :

```sql
-- Pour le super admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "super_admin"}'::jsonb
WHERE email = 'superadmin@claake.com';

-- Pour l'admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@claake.com';
```

---

## Vérification

1. Se connecter sur `/login` avec le compte super admin
2. Le bouton **Administration** doit apparaître dans le header
3. Aller sur `/admin` — le menu doit afficher **Super Administration** avec le lien **Gérer les admins**
4. Se connecter avec le compte admin — le menu affiche **Administration** sans le lien de gestion des admins

---

## Différences entre les rôles

| Fonctionnalité | ADMIN | SUPER_ADMIN |
|---|:---:|:---:|
| Dashboard admin | ✅ | ✅ |
| CRUD agents | ✅* | ✅ |
| CRUD utilisateurs | ✅* | ✅ |
| CRUD catégories | ✅* | ✅ |
| CRUD avis | ✅* | ✅ |
| Statistiques | ✅* | ✅ |
| Activité | ✅* | ✅ |
| Promouvoir/rétrograder admin | ❌ | ✅ |
| Configurer permissions admin | ❌ | ✅ |

*\* Selon les permissions attribuées par le super admin*

---

## Notes

- Le **SUPER_ADMIN** ne peut pas être modifié par un autre admin
- Un **ADMIN** ne peut pas s'attribuer plus de permissions
- Les permissions sont stockées en JSON dans la colonne `admin_permissions` de la table `users`
- Le rôle en BDD (`users.role`) est la **source de vérité** — le backend le lit à chaque requête authentifiée
