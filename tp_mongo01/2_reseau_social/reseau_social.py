"""TP MongoDB — modèle NoSQL d'un réseau social (utilisateurs, publications, commentaires, likes).

Modèle choisi :
- collection `users`     : un document par utilisateur
- collection `posts`     : un document par publication, qui embarque
    - `comments` : liste des commentaires (auteur + texte + date)
    - `likes`    : liste des _id des utilisateurs qui ont aimé (un like par utilisateur grâce à $addToSet)
  Les commentaires et les likes sont toujours lus avec leur publication : on les embarque
  au lieu de créer des collections séparées. L'auteur est référencé par son _id.

Lancer avec : python reseau_social.py
"""

from datetime import datetime, timedelta

from pymongo import DESCENDING, MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["reseau_social"]


def titre(texte):
    print(f"\n=== {texte} ===")


def reinitialiser():
    db.users.drop()
    db.posts.drop()
    db.posts.create_index("author_id")


# 1. Utilisateurs
def inserer_utilisateurs():
    resultat = db.users.insert_many(
        [
            {"username": "alice", "nom": "Alice Martin", "ville": "Paris", "inscription": datetime(2026, 1, 12)},
            {"username": "bastien", "nom": "Bastien Leroy", "ville": "Lyon", "inscription": datetime(2026, 3, 4)},
            {"username": "chloe", "nom": "Chloé Dubois", "ville": "Paris", "inscription": datetime(2026, 5, 20)},
        ]
    )
    return dict(zip(["alice", "bastien", "chloe"], resultat.inserted_ids))


# 2. Publications
def inserer_publications(users):
    debut = datetime(2026, 10, 1, 9, 0)
    publications = [
        ("alice", "Premier jour à la salle d'escalade, je suis courbaturée !"),
        ("alice", "Quelqu'un a une bonne recette de tarte aux pommes ?"),
        ("bastien", "Nouveau setup bureau terminé, enfin un écran vertical."),
        ("chloe", "Coucher de soleil incroyable sur les quais de Seine ce soir."),
        ("bastien", "Je cherche des recommandations de romans de science-fiction."),
        ("alice", "Rando au Vercors ce week-end, qui est partant ?"),
    ]
    resultat = db.posts.insert_many(
        [
            {
                "author_id": users[auteur],
                "contenu": contenu,
                "date": debut + timedelta(hours=6 * i),
                "comments": [],
                "likes": [],
            }
            for i, (auteur, contenu) in enumerate(publications)
        ]
    )
    return resultat.inserted_ids


# 3. Commentaires (ajoutés dans la publication avec $push)
def commenter(post_id, user_id, texte):
    db.posts.update_one(
        {"_id": post_id},
        {"$push": {"comments": {"user_id": user_id, "texte": texte, "date": datetime.now()}}},
    )


# 4. Likes ($addToSet : un utilisateur ne peut liker qu'une seule fois)
def liker(post_id, user_id):
    db.posts.update_one({"_id": post_id}, {"$addToSet": {"likes": user_id}})


def ajouter_interactions(users, posts):
    commenter(posts[1], users["chloe"], "Celle de ma grand-mère, je t'envoie ça !")
    commenter(posts[1], users["bastien"], "Avec de la cannelle, toujours.")
    commenter(posts[2], users["alice"], "Joli ! Tu as mis quoi comme clavier ?")
    commenter(posts[3], users["bastien"], "Superbe photo")
    commenter(posts[4], users["chloe"], "Fondation d'Asimov, un classique.")
    commenter(posts[4], users["alice"], "Le Problème à trois corps !")

    liker(posts[0], users["bastien"])
    for user in ("alice", "bastien", "chloe"):
        liker(posts[3], users[user])
    liker(posts[3], users["alice"])  # second like ignoré par $addToSet
    liker(posts[1], users["chloe"])
    liker(posts[1], users["bastien"])
    liker(posts[4], users["alice"])


# ---------- Requêtes ----------

def afficher_publication(post):
    print(f"- [{post['date']:%d/%m %Hh}] {post['contenu']}  ({len(post['likes'])} like(s), {len(post['comments'])} commentaire(s))")


def toutes_les_publications():
    titre("1. Toutes les publications")
    for post in db.posts.find().sort("date", DESCENDING):
        auteur = db.users.find_one({"_id": post["author_id"]}, {"username": 1})
        print(f"@{auteur['username']}", end=" ")
        afficher_publication(post)


def publications_de(username):
    titre(f"2. Publications de @{username}")
    user = db.users.find_one({"username": username})
    for post in db.posts.find({"author_id": user["_id"]}).sort("date", DESCENDING):
        afficher_publication(post)


def commentaires_de(post_id):
    post = db.posts.find_one({"_id": post_id}, {"contenu": 1, "comments": 1})
    titre(f"3. Commentaires de « {post['contenu']} »")
    noms = {u["_id"]: u["username"] for u in db.users.find({}, {"username": 1})}
    for comment in post["comments"]:
        print(f"- @{noms[comment['user_id']]} : {comment['texte']}")


def publication_la_plus_likee():
    titre("4. Publication ayant le plus de likes")
    resultat = db.posts.aggregate(
        [
            {"$addFields": {"nb_likes": {"$size": "$likes"}}},
            {"$sort": {"nb_likes": DESCENDING, "date": DESCENDING}},
            {"$limit": 1},
            {"$lookup": {"from": "users", "localField": "author_id", "foreignField": "_id", "as": "auteur"}},
        ]
    ).next()
    print(f"@{resultat['auteur'][0]['username']} : « {resultat['contenu']} » avec {resultat['nb_likes']} likes")


def publications_par_utilisateur():
    titre("5. Nombre de publications par utilisateur")
    # On part de users pour inclure aussi ceux qui n'ont rien publié
    resultat = db.users.aggregate(
        [
            {"$lookup": {"from": "posts", "localField": "_id", "foreignField": "author_id", "as": "posts"}},
            {"$project": {"_id": 0, "username": 1, "nb_publications": {"$size": "$posts"}}},
            {"$sort": {"nb_publications": DESCENDING, "username": 1}},
        ]
    )
    for ligne in resultat:
        print(f"- @{ligne['username']} : {ligne['nb_publications']}")


if __name__ == "__main__":
    reinitialiser()
    users = inserer_utilisateurs()
    posts = inserer_publications(users)
    ajouter_interactions(users, posts)
    print(f"{db.users.count_documents({})} utilisateurs et {db.posts.count_documents({})} publications insérés")

    toutes_les_publications()
    publications_de("alice")
    commentaires_de(posts[4])
    publication_la_plus_likee()
    publications_par_utilisateur()
