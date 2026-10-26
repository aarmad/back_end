# TP MongoDB

Prérequis : MongoDB en local sur `mongodb://localhost:27017`, `mongosh`, Python 3 et Node.js.

| Partie | Dossier | Lancer |
|---|---|---|
| 1. E-commerce | `1_ecommerce/` | `mongosh 1_ecommerce/ecommerce.js` |
| 2. Réseau social (Python) | `2_reseau_social/` | voir ci-dessous |
| 3. API de recherche | `3_api_recherche/` | voir ci-dessous |

---

## 1. Base e-commerce

Le script `ecommerce.js` crée la base `ecommerce`, puis :

- insère 3 utilisateurs, 4 produits et 1 commande ;
- affiche tous les utilisateurs, les produits à plus de 50 €, les utilisateurs de Paris et toutes les commandes ;
- modifie l'âge d'un utilisateur, puis supprime un produit.

La commande embarque le nom de l'utilisateur et une copie des produits achetés (nom, prix, quantité). Le prix reste ainsi celui payé au moment de l'achat, même si le produit change de prix ou est supprimé ensuite.

Le script vide les collections au début, on peut donc le relancer autant de fois qu'on veut.

---

## 2. Réseau social (Python + pymongo)

```bash
cd 2_reseau_social
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python reseau_social.py
```

### Modèle de données (base `reseau_social`)

```js
// users
{ _id, username: "alice", nom: "Alice Martin", ville: "Paris", inscription: ISODate }

// posts
{
  _id, author_id: ObjectId,           // référence vers users
  contenu: "…", date: ISODate,
  comments: [ { user_id: ObjectId, texte: "…", date: ISODate } ],  // embarqués
  likes: [ ObjectId, ObjectId ]       // _id des utilisateurs qui ont aimé
}
```

- **Commentaires et likes embarqués dans la publication** : on les affiche toujours avec elle, donc une seule lecture suffit.
- **Likes ajoutés avec `$addToSet`** : un utilisateur ne peut aimer une publication qu'une seule fois.
- **Auteur référencé par son `_id`** plutôt que copié : un utilisateur publie beaucoup, et son profil peut changer.

### Requêtes réalisées

1. Toutes les publications : `find().sort(date)`.
2. Publications d'un utilisateur : `find({ author_id })`.
3. Commentaires d'une publication : lecture du tableau `comments`.
4. Publication la plus likée : agrégation `$size` sur `likes`, puis `$sort` et `$limit: 1`.
5. Nombre de publications par utilisateur : agrégation `$lookup` depuis `users`, pour compter aussi ceux qui n'ont rien publié.

### Pourquoi MongoDB est adapté à ce type d'application ?

- **Le document correspond à ce qu'on affiche.** Une publication, ses commentaires et ses likes forment un seul document JSON, lu en une seule requête et sans jointure. Cela correspond directement à un fil d'actualité.
- **Le schéma est flexible.** On peut ajouter des champs (photo, vidéo, hashtags, sondage…) sur certaines publications seulement, sans migration.
- **Les mises à jour sont atomiques et simples.** `$push` ajoute un commentaire et `$addToSet` un like, sans doublon, sans transaction ni table de liaison.
- **La base monte en charge horizontalement.** Un réseau social reçoit énormément de lectures et d'écritures ; MongoDB répartit les données sur plusieurs serveurs (sharding).
- **L'intégration avec Python est naturelle.** Un document MongoDB est directement un `dict` Python avec pymongo, sans ORM ni mapping.

### Quels seraient les inconvénients d'une base SQL dans ce cas ?

- **Beaucoup de jointures.** Afficher une publication avec son auteur, ses commentaires et ses likes demande des jointures entre 4 tables (`users`, `posts`, `comments`, `likes`). C'est coûteux sur un fil d'actualité très consulté.
- **Un schéma rigide.** Chaque nouveau type de contenu (image, vidéo, sondage) impose un `ALTER TABLE` et une migration, ou des colonnes souvent vides.
- **La montée en charge est plus difficile.** Une base SQL se fait surtout grossir verticalement (un serveur plus puissant) ; la répartition sur plusieurs serveurs est complexe.
- **Un décalage avec le code.** Il faut convertir les lignes des tables en objets imbriqués côté Python (ORM ou code de conversion), alors que le front attend du JSON imbriqué.

SQL garde l'avantage pour les données très relationnelles qui exigent une cohérence forte, comme des paiements ou un stock. Pour un réseau social, ces avantages comptent moins que la rapidité de lecture et la flexibilité.

---

## 3. API de recherche — Jeux vidéo (Express + MongoDB)

```bash
cd 3_api_recherche
npm install
npm run seed     # 12 jeux dans la base jeux_video, collection games
npm start        # http://localhost:3002
```

Variables d'environnement facultatives (voir `.env.example`) : `MONGO_URL`, `MONGO_DB`, `PORT`.

### Entité : Jeu

```json
{
  "title": "Hades",
  "description": "Un rogue-like nerveux où Zagreus tente de s'échapper des Enfers.",
  "genre": "action",
  "platforms": ["PC", "Switch", "PS5"],
  "releaseYear": 2020,
  "rating": 9.3,
  "developer": "Supergiant Games"
}
```

### Routes

| Méthode | Route | Description |
|---|---|---|
| POST | `/items` | Crée un jeu (champs validés, 400 si invalide) |
| GET | `/items/:id` | Lit un jeu (400 si id invalide, 404 si introuvable) |
| GET | `/items?page=1&limit=10` | Liste paginée, triée par note |
| GET | `/search?keyword=…` | Recherche (paginée aussi) |

### Recherche

- `keyword` : regex **insensible à la casse** sur `title`, `description` et `developer`. Les caractères spéciaux sont échappés, donc `c++` ne casse pas la requête.
- Filtres combinables :
  - `genre` (ex. `rpg`)
  - `platform` (ex. `switch`)
  - `minRating` (note ≥, ex. `9`)
  - `maxYear` (sorti au plus tard en, ex. `2020`)

Exemples :

```
GET /search?keyword=monde
GET /search?keyword=monde&genre=rpg
GET /search?platform=switch&minRating=9.3
GET /search?keyword=knight&maxYear=2020
```
