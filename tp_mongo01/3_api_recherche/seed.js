const { client, games } = require("./db");

const data = [
  { title: "The Legend of Zelda: Breath of the Wild", description: "Explorez librement un Hyrule immense en monde ouvert.", genre: "aventure", platforms: ["Switch", "Wii U"], releaseYear: 2017, rating: 9.7, developer: "Nintendo" },
  { title: "Elden Ring", description: "Un action-RPG exigeant dans un monde ouvert sombre imaginé avec George R. R. Martin.", genre: "rpg", platforms: ["PC", "PS5", "Xbox Series"], releaseYear: 2022, rating: 9.5, developer: "FromSoftware" },
  { title: "Hades", description: "Un rogue-like nerveux où Zagreus tente de s'échapper des Enfers.", genre: "action", platforms: ["PC", "Switch", "PS5"], releaseYear: 2020, rating: 9.3, developer: "Supergiant Games" },
  { title: "Stardew Valley", description: "Reprenez la ferme de votre grand-père et cultivez votre vie à la campagne.", genre: "simulation", platforms: ["PC", "Switch", "PS4", "Mobile"], releaseYear: 2016, rating: 8.9, developer: "ConcernedApe" },
  { title: "Celeste", description: "Un jeu de plateforme précis sur l'ascension d'une montagne et l'anxiété.", genre: "plateforme", platforms: ["PC", "Switch"], releaseYear: 2018, rating: 9.1, developer: "Maddy Makes Games" },
  { title: "The Witcher 3: Wild Hunt", description: "Geralt de Riv parcourt un monde ouvert à la recherche de Ciri.", genre: "rpg", platforms: ["PC", "PS4", "Switch"], releaseYear: 2015, rating: 9.4, developer: "CD Projekt Red" },
  { title: "Hollow Knight", description: "Un metroidvania dans le royaume souterrain et ruiné d'Hallownest.", genre: "action", platforms: ["PC", "Switch"], releaseYear: 2017, rating: 9.0, developer: "Team Cherry" },
  { title: "Mario Kart 8 Deluxe", description: "Des courses de karts déjantées avec Mario et ses amis.", genre: "course", platforms: ["Switch"], releaseYear: 2017, rating: 8.8, developer: "Nintendo" },
  { title: "Minecraft", description: "Construisez et explorez un monde fait de blocs, seul ou à plusieurs.", genre: "bac à sable", platforms: ["PC", "Switch", "PS4", "Mobile"], releaseYear: 2011, rating: 9.0, developer: "Mojang" },
  { title: "Among Us", description: "Démasquez l'imposteur caché dans l'équipage d'un vaisseau spatial.", genre: "party", platforms: ["PC", "Mobile", "Switch"], releaseYear: 2018, rating: 7.6, developer: "Innersloth" },
  { title: "Red Dead Redemption 2", description: "L'épopée d'Arthur Morgan dans un Far West en monde ouvert.", genre: "aventure", platforms: ["PC", "PS4", "Xbox One"], releaseYear: 2018, rating: 9.6, developer: "Rockstar Games" },
  { title: "Tetris Effect", description: "Le puzzle culte revisité avec de la musique et des effets visuels envoûtants.", genre: "puzzle", platforms: ["PC", "PS4", "Switch"], releaseYear: 2018, rating: 8.7, developer: "Enhance" },
];

async function main() {
  await client.connect();
  await games.deleteMany({});
  const { insertedCount } = await games.insertMany(data.map((game) => ({ ...game, createdAt: new Date() })));
  await games.createIndex({ genre: 1 });
  await games.createIndex({ rating: -1 });
  console.log(`${insertedCount} jeux insérés dans la collection games`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => client.close());
