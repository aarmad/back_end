# Choix techniques : MySQL pour les favoris, MongoDB pour la wishlist

L'application gère deux listes de jeux par utilisateur. Les deux se ressemblent, mais elles n'ont pas les mêmes besoins. Chacune est donc stockée dans la base qui correspond le mieux à ces besoins.

## Favoris → MySQL (table `user_favorites`)

Un favori est une donnée simple et toujours identique : un utilisateur, un jeu, une date. Ce dont on a besoin ici, c'est d'une cohérence stricte et de statistiques.

- **Unicité garantie par la base.** La contrainte `UNIQUE KEY unique_favorite (user_id, game_id)` empêche un doublon même si deux requêtes arrivent en même temps. L'API n'a pas besoin de vérifier avant d'insérer : elle tente l'insertion et transforme l'erreur `ER_DUP_ENTRY` en réponse `409 Conflict`.
- **Relations entre tables.** Les clés étrangères vers `games` et `users` garantissent qu'un favori pointe toujours vers un jeu et un utilisateur qui existent. Avec `ON DELETE CASCADE`, supprimer un jeu du catalogue supprime aussi ses favoris : aucun favori ne reste orphelin.
- **Statistiques en SQL.** `GET /api/favorites/stats` repose sur des `COUNT`, des `GROUP BY genre` et des `JOIN` avec le catalogue : c'est exactement ce que SQL fait le mieux.
- **Pagination efficace.** L'index `idx_user (user_id)` permet de retrouver directement les favoris d'un utilisateur, puis `LIMIT/OFFSET` découpe le résultat en pages.

## Wishlist → MongoDB (collection `wishlists`)

Une entrée de wishlist contient des informations personnelles dont la forme n'est pas connue à l'avance : une note, mais aussi une priorité, des tags, un prix visé, une plateforme souhaitée… Ce qui compte ici, c'est la flexibilité.

- **Un document par utilisateur.** La wishlist complète, avec ses jeux et ses notes, est un seul document. On la lit en une requête, sans jointure :
  ```json
  {
    "userId": "user-alice",
    "games": [
      { "gameId": "rdr2", "addedAt": "…", "note": "Pour Noël", "details": { "tags": ["western"] } },
      { "gameId": "hades", "addedAt": "…" }
    ],
    "createdAt": "…", "updatedAt": "…"
  }
  ```
- **Notes sans structure fixe.** Le champ `details` accepte n'importe quel objet. En SQL, il faudrait ajouter une colonne et faire une migration à chaque nouveau champ, ou stocker du JSON dans une colonne texte.
- **Mises à jour atomiques.** `$push` ajoute un jeu, `$pull` le retire, et `$set` sur `games.$` modifie la note du bon élément. Le filtre `"games.gameId": { $ne: gameId }` refuse un doublon dans la même opération, sans risque de concurrence.
- **Pagination côté base.** `$slice` sur le tableau ne renvoie que la page demandée, et `$size` donne le total.
- **Garde-fous malgré la flexibilité.** La collection a un validateur JSON Schema (`database/mongodb/wishlists.schema.json`) qui impose `userId`, `games[].gameId` et `addedAt`, ainsi qu'un index unique sur `userId`.

## Ce que ce découpage implique

- **Le catalogue des jeux reste dans MySQL** (table `games`) et sert de référence aux deux listes. Avant chaque ajout, `GameService.getExisting()` vérifie que le jeu existe, que ce soit pour un favori ou pour la wishlist.
- **Pas de clé étrangère entre MongoDB et MySQL.** La wishlist ne peut pas référencer `games` comme le fait une clé étrangère. On vérifie l'existence du jeu au moment de l'ajout, et à la lecture les informations du jeu sont récupérées dans MySQL (« jointure » faite par l'application). Si un jeu a été retiré du catalogue entre-temps, l'entrée est marquée `removedFromCatalog` au lieu de faire échouer la requête.
- **Pas de transaction commune aux deux bases.** Les deux listes sont indépendantes, donc ce n'est pas nécessaire ici.

## Sécurité : « chaque utilisateur ne gère que ses propres listes »

Toutes les routes `/api/favorites` et `/api/wishlist` exigent un token JWT, obtenu avec `POST /api/auth/login`. L'identifiant de l'utilisateur est lu **uniquement dans le token**, jamais dans l'URL ni dans le body. Toutes les requêtes SQL et MongoDB filtrent sur cet identifiant : un utilisateur ne peut donc ni lire ni modifier la liste d'un autre. Une tentative renvoie simplement `404`, sans révéler que le jeu existe dans la liste de quelqu'un d'autre.

## En résumé

| Besoin | Favoris (MySQL) | Wishlist (MongoDB) |
|---|---|---|
| Structure des données | Fixe (user, jeu, date) | Variable (notes, détails libres) |
| Empêcher les doublons | Contrainte `UNIQUE` | Filtre `$ne` + `$push` atomique |
| Lien avec les jeux | Clé étrangère | Vérification par l'application |
| Statistiques | `GROUP BY`, `JOIN`, `COUNT` | — |
| Ajouter un nouveau champ | Migration `ALTER TABLE` | Aucune migration |
