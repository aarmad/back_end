import { prisma } from "../src/db/prisma";

// Jeu de données de démo : 8 attaques, 2 dresseurs avec 3 Pokémon chacun
const attacks = [
  { name: "Charge", damage: 10, usageLimit: 30 },
  { name: "Griffe", damage: 12, usageLimit: 25 },
  { name: "Éclair", damage: 25, usageLimit: 15 },
  { name: "Tonnerre", damage: 45, usageLimit: 5 },
  { name: "Flammèche", damage: 25, usageLimit: 15 },
  { name: "Lance-Flammes", damage: 45, usageLimit: 5 },
  { name: "Pistolet à O", damage: 25, usageLimit: 15 },
  { name: "Hydrocanon", damage: 50, usageLimit: 4 },
  { name: "Fouet Lianes", damage: 25, usageLimit: 15 },
  { name: "Tranch'Herbe", damage: 35, usageLimit: 8 },
];

const trainers = [
  {
    name: "Sacha",
    pokemons: [
      { name: "Pikachu", lifePoint: 100, attacks: ["Charge", "Éclair", "Tonnerre"] },
      { name: "Salamèche", lifePoint: 110, attacks: ["Griffe", "Flammèche", "Lance-Flammes"] },
      { name: "Bulbizarre", lifePoint: 120, attacks: ["Charge", "Fouet Lianes", "Tranch'Herbe"] },
    ],
  },
  {
    name: "Ondine",
    pokemons: [
      { name: "Stari", lifePoint: 95, attacks: ["Charge", "Pistolet à O"] },
      { name: "Psykokwak", lifePoint: 115, attacks: ["Griffe", "Pistolet à O", "Hydrocanon"] },
      { name: "Staross", lifePoint: 125, attacks: ["Charge", "Pistolet à O", "Hydrocanon", "Éclair"] },
    ],
  },
];

async function main() {
  await prisma.pokemonAttack.deleteMany();
  await prisma.pokemon.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.attack.deleteMany();

  await prisma.attack.createMany({ data: attacks });
  const attackIds = new Map((await prisma.attack.findMany()).map((attack) => [attack.name, attack.id]));

  for (const trainer of trainers) {
    await prisma.trainer.create({
      data: {
        name: trainer.name,
        pokemons: {
          create: trainer.pokemons.map((pokemon) => ({
            name: pokemon.name,
            lifePoint: pokemon.lifePoint,
            maxLifePoint: pokemon.lifePoint,
            attacks: { create: pokemon.attacks.map((name) => ({ attackId: attackIds.get(name)! })) },
          })),
        },
      },
    });
  }
  console.log(`Seed terminé : ${attacks.length} attaques, ${trainers.length} dresseurs`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
