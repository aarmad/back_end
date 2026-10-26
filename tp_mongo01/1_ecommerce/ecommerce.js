// TP MongoDB — Base de données e-commerce
// Lancer avec : mongosh 1_ecommerce/ecommerce.js

// 1. Création de la base (équivalent de "use ecommerce")
db = db.getSiblingDB("ecommerce");

// On repart de zéro pour pouvoir relancer le script
db.users.drop();
db.products.drop();
db.orders.drop();

// 2 + 3. Les collections sont créées automatiquement à la première insertion

print("\n=== Insertion des utilisateurs ===");
printjson(
  db.users.insertMany([
    { nom: "Alice Martin", age: 28, ville: "Paris" },
    { nom: "Bastien Leroy", age: 35, ville: "Lyon" },
    { nom: "Chloé Dubois", age: 22, ville: "Paris" },
  ]),
);

print("\n=== Insertion des produits ===");
printjson(
  db.products.insertMany([
    { nom: "Clavier mécanique", prix: 89.99, categorie: "Informatique" },
    { nom: "Souris sans fil", prix: 29.9, categorie: "Informatique" },
    { nom: "Casque audio", prix: 149.0, categorie: "Audio" },
    { nom: "Tapis de souris", prix: 12.5, categorie: "Accessoires" },
  ]),
);

print("\n=== Insertion d'une commande ===");
const achats = [
  { nom: "Clavier mécanique", prix: 89.99, quantite: 1 },
  { nom: "Tapis de souris", prix: 12.5, quantite: 2 },
];
const total = Math.round(achats.reduce((somme, p) => somme + p.prix * p.quantite, 0) * 100) / 100;
printjson(
  db.orders.insertOne({
    utilisateur: "Alice Martin",
    produits: achats,
    total: total, // 89.99 + 2 × 12.50 = 114.99
    date: new Date(),
  }),
);

// 4. Requêtes
print("\n=== Tous les utilisateurs ===");
printjson(db.users.find().toArray());

print("\n=== Produits dont le prix est supérieur à 50 ===");
printjson(db.products.find({ prix: { $gt: 50 } }).toArray());

print("\n=== Utilisateurs habitant à Paris ===");
printjson(db.users.find({ ville: "Paris" }).toArray());

print("\n=== Toutes les commandes ===");
printjson(db.orders.find().toArray());

// 5. Mise à jour : Bastien a eu 36 ans
print("\n=== Mise à jour de l'âge de Bastien Leroy ===");
printjson(db.users.updateOne({ nom: "Bastien Leroy" }, { $set: { age: 36 } }));
printjson(db.users.findOne({ nom: "Bastien Leroy" }));

// 6. Suppression d'un produit
print("\n=== Suppression du produit « Souris sans fil » ===");
printjson(db.products.deleteOne({ nom: "Souris sans fil" }));
printjson(db.products.find({}, { _id: 0, nom: 1, prix: 1 }).toArray());
