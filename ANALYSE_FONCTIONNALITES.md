# Analyse des fonctionnalites

Ce document synthétise l'etat du projet a partir du code existant dans `frontendWeb`, `backend` et `shared`.

## Resume rapide

- Le frontend web couvre deja une grande partie du produit en termes d'ecrans et d'experience utilisateur.
- Le backend expose aujourd'hui surtout un MVP catalogue avec `agents`, `categories`, `users` et `stats`.
- Le plus gros travail restant consiste a brancher l'authentification, la publication d'agents, le dashboard reel et les workflows admin.

## Tableau de synthese

| Fonctionnalite | Deja fait | Reste a developper |
| --- | --- | --- |
| Catalogue d'agents | Home, catalogue, cartes d'agents, filtres et detail agent visibles dans le frontend. Backend present pour lister les agents et recuperer un agent. | Brancher tous les filtres profonds, corriger les incoherences de liens categorie, enrichir la recherche et la pagination si necessaire. |
| Categories | Categories consommees par le frontend pour le catalogue et le formulaire de publication. Endpoint backend `GET /categories` present. | Rien de bloquant pour le MVP, seulement enrichissement et administration des categories si besoin. |
| Detail agent | Page detail riche avec metadonnees, tags, rating, mode d'execution et experience de consultation. Backend `GET /agents/:id` present. | Ajouter les vraies actions utilisateur autour de l'agent: utiliser, acheter, ajouter a la bibliotheque, laisser un avis, suivre les versions. |
| Chat / essai d'agent | UI de chat et structures partagees presentes dans `shared`. | Creer le vrai endpoint backend `/chat`, gerer l'execution d'agent, l'historique, les erreurs provider, les quotas et le mode sandbox. |
| Authentification | Login, register, callback et integration Supabase presents cote frontend. Un guard Supabase existe cote backend. | Exposer un vrai module backend auth, brancher le guard sur les routes, exposer `/auth/profile`, mettre a jour le profil et utiliser le token pour identifier l'utilisateur. |
| Profil utilisateur | Page `settings` existante avec formulaire. Types et client API prevus dans `shared`. | Charger les donnees reelles, sauvegarder nom/bio/avatar, gerer suppression de compte et changement de type de compte. |
| Dashboard utilisateur | Ecran dashboard present avec cartes et structure de stats. Endpoint backend `GET /stats/dashboard` existant. | Passer le vrai token, recuperer le vrai `userId` depuis l'auth, alimenter l'activite recente et les chiffres reels. |
| Mes agents | Page `Mes agents` existante avec CTA vers la publication. | Lister les agents du createur connecte, afficher statuts, edition, suppression, brouillons et suivi de validation. |
| Publication d'agent | Wizard frontend en 5 etapes deja construit. Backend `POST /agents` existe. | Brancher le submit au backend, remplacer le `creatorId` placeholder, gerer upload `.agentjson`, validations, erreurs et confirmation reelle. |
| Bibliotheque / favoris | Page bibliotheque presente cote frontend. Le schema Prisma contient `Favorite` et `Collection`. | Ajouter les endpoints favoris/bibliotheque, boutons d'ajout/retrait depuis le catalogue et la fiche agent, et la liste reelle cote dashboard. |
| Reviews / notes | Le frontend affiche deja rating et `review_count`. Le schema Prisma contient `Review`. | Creer les endpoints de creation, listing, moderation et calcul des notes; brancher l'affichage des avis sur les fiches agents. |
| Admin dashboard | UI admin deja presente avec stats, liste users, liste agents et revue. Endpoints backend `GET /stats/admin` et `GET /users` presents. | Proteger ces routes par auth + role admin, passer le vrai token, ajouter actions reelles de moderation et gestion utilisateurs. |
| Revue / moderation d'agents | Page admin de revue presente mais statique. Le domaine backend contient `AgentStatus` et `AgentVersion`. | Creer la file de revue reelle, approuver/rejeter/suspendre, historiser les decisions et brancher le workflow de validation. |
| Roles et permissions | Notions de roles visibles dans le frontend et le backend. | Appliquer les roles sur les routes, garantir les gardes dashboard/admin et synchroniser les roles avec Supabase/utilisateur interne. |
| API keys utilisateur | UI presente et exploitable localement dans le navigateur. | Si voulu en production, stocker cote serveur de maniere securisee, sync par compte et brancher aux executions reelles d'agents. |
| Paiements / abonnements | Le schema Prisma modele `Purchase`, `Subscription`, `UsageCredit`, `CreditTransaction`. Le frontend mentionne deja la monetisation future. | Construire toute la couche checkout, webhooks, abonnements, credits, historique d'achats et verification d'acces. |
| Pipelines multi-agents | Le schema Prisma contient `Pipeline`. | Concevoir puis exposer les endpoints et ecrans de creation, execution et partage de pipelines. |
| Teams / organisation | Le schema Prisma contient `Team` et des traces SSO. | Aucune feature visible vraiment branchee: il faut definir le besoin produit puis implementer gestion d'equipe, invitations et permissions. |
| Upload assets agent | Le schema agent prevoit `configUrl`, `imageUrl`, `screenshots`. | Ajouter l'upload de fichiers, le stockage, la validation et le lien avec la publication d'agent. |

## Priorites recommandees

### Priorite 1

- Auth backend reelle et protection des routes.
- Profil utilisateur (`GET/PATCH /auth/profile`).
- Publication d'agent vraiment persistante.
- Dashboard utilisateur et admin branches avec vrai token.

### Priorite 2

- Mes agents.
- Bibliotheque / favoris.
- Revue admin des agents.
- Reviews / notes.
- Chat backend `/chat`.

### Priorite 3

- Paiements, abonnements et credits.
- Upload complet des assets agent.
- Pipelines multi-agents.
- Teams / organisation.

## Dette technique / ecarts identifies

- Le client partage attend `/chat` et `/auth/profile`, mais ces routes ne sont pas exposees par le backend actuel.
- Le dashboard frontend appelle l'API avec un token vide.
- Le backend stats utilise encore un `userId` en query param au lieu de l'extraire du token.
- La creation d'agent backend utilise un `creatorId` fictif, donc la fonctionnalite est inachevee.
- Plusieurs pages frontend sont des placeholders visuels deja prets mais sans logique metier branchee.

## Conclusion

Le projet est bien avance en termes d'interface et de structure de domaine, mais il manque encore le coeur applicatif pour transformer les ecrans en fonctionnalites reelles. Pour un MVP coherent, il faut d'abord fermer la boucle `auth -> profil -> publication agent -> dashboard -> moderation`.
