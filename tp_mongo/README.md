# Mini TP — Favoris (MySQL) & Wishlist (MongoDB)

API Express + TypeScript qui permet à chaque utilisateur de gérer ses jeux favoris (MySQL) et sa wishlist avec des notes personnelles (MongoDB).

La justification des choix SQL / NoSQL est dans [`docs/CHOIX_TECHNIQUES.md`](docs/CHOIX_TECHNIQUES.md).

## Lancer le projet

Prérequis : MySQL sur `localhost:3306` (par exemple MySQL de XAMPP) et MongoDB sur `localhost:27017`.

```bash
cp .env.example .env     # puis renseigner JWT_SECRET (et MYSQL_PASSWORD si besoin)
npm install
npm run db:init          # crée la base MySQL, le catalogue de 12 jeux, 2 comptes et la collection MongoDB
npm run dev              # http://localhost:3003
```

`npm run db:reset` vide les favoris et les wishlists.

Comptes de démo : `alice` / `password123` et `bastien` / `password123`.

## Utilisation

1. Se connecter pour obtenir un token :
   ```http
   POST /api/auth/login
   { "username": "alice", "password": "password123" }
   ```
2. Envoyer le token dans toutes les requêtes favoris et wishlist :
   ```
   Authorization: Bearer <token>
   ```

### Routes

| Méthode | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Créer un compte `{ username, password }` |
| POST | `/api/auth/login` | Obtenir un token |
| GET | `/api/games` | Catalogue des jeux (ids utilisables) |
| **Favoris (MySQL)** | | |
| POST | `/api/favorites/:gameId` | Ajouter aux favoris |
| GET | `/api/favorites?page=1&limit=10` | Mes favoris (paginés) |
| DELETE | `/api/favorites/:gameId` | Retirer des favoris |
| GET | `/api/favorites/stats` | Total, répartition par genre, dates, jeux les plus mis en favori |
| **Wishlist (MongoDB)** | | |
| POST | `/api/wishlist/:gameId` | Ajouter (body facultatif : `{ note, details }`) |
| GET | `/api/wishlist?page=1&limit=10` | Ma wishlist (paginée) |
| PATCH | `/api/wishlist/:gameId` | Ajouter ou modifier la note : `{ "note": "Pour Noël", "details": { "priorite": 1 } }` |
| DELETE | `/api/wishlist/:gameId` | Retirer de la wishlist |

### Règles métier

| Règle | Comment elle est appliquée |
|---|---|
| Pas de doublon | Favoris : contrainte `UNIQUE (user_id, game_id)`. Wishlist : `$push` conditionné par `$ne`. Dans les deux cas → `409` |
| Le jeu doit exister | Vérification dans la table `games` avant l'ajout → `404` sinon |
| Chaque utilisateur gère ses propres listes | L'utilisateur vient du token JWT, et toutes les requêtes filtrent sur son id |
| Pagination | `?page=` et `?limit=` (10 par défaut, 100 maximum), avec `total` et `totalPages` dans la réponse |

## Livrables

| Livrable | Fichier |
|---|---|
| Configuration MySQL | [`src/config/mysql.ts`](src/config/mysql.ts) |
| Services | [`src/services/FavoriteService.ts`](src/services/FavoriteService.ts), [`src/services/WishlistService.ts`](src/services/WishlistService.ts) |
| Contrôleurs | [`src/controllers/favoriteController.ts`](src/controllers/favoriteController.ts), [`src/controllers/wishlistController.ts`](src/controllers/wishlistController.ts) |
| Routes | [`src/routes/favoriteRoutes.ts`](src/routes/favoriteRoutes.ts), [`src/routes/wishlistRoutes.ts`](src/routes/wishlistRoutes.ts) |
| Script SQL | [`database/mysql/schema.sql`](database/mysql/schema.sql) (+ catalogue : [`seed.sql`](database/mysql/seed.sql)) |
| Schéma MongoDB | [`database/mongodb/wishlists.schema.json`](database/mongodb/wishlists.schema.json) |
| Justification SQL / NoSQL | [`docs/CHOIX_TECHNIQUES.md`](docs/CHOIX_TECHNIQUES.md) |
