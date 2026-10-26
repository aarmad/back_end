import { Attack } from "../classes/Attack";
import { Pokemon } from "../classes/Pokemon";
import { Trainer } from "../classes/Trainer";
import { prisma } from "../db/prisma";
import { HttpError, notFound } from "../errors/HttpError";
import type { Prisma } from "../generated/prisma/client";

// Fait le lien entre la base (Prisma) et les classes métier
const pokemonInclude = {
  attacks: { include: { attack: true }, orderBy: { attackId: "asc" } },
} satisfies Prisma.PokemonInclude;

const trainerInclude = {
  pokemons: { include: pokemonInclude, orderBy: { id: "asc" } },
} satisfies Prisma.TrainerInclude;

type AttackRow = Prisma.AttackGetPayload<object>;
type PokemonRow = Prisma.PokemonGetPayload<{ include: typeof pokemonInclude }>;
type TrainerRow = Prisma.TrainerGetPayload<{ include: typeof trainerInclude }>;

const toAttack = (row: AttackRow, usageCount = 0) => new Attack(row.name, row.damage, row.usageLimit, usageCount, row.id);

const toPokemon = (row: PokemonRow) =>
  new Pokemon(
    row.name,
    row.maxLifePoint,
    row.lifePoint,
    row.attacks.map((learned) => toAttack(learned.attack, learned.usageCount)),
    row.id,
  );

const toTrainer = (row: TrainerRow) => new Trainer(row.name, row.level, row.experience, row.pokemons.map(toPokemon), row.id);

export class GameRepository {
  // ---------- Attaques ----------

  async listAttacks(): Promise<Attack[]> {
    const rows = await prisma.attack.findMany({ orderBy: { id: "asc" } });
    return rows.map((row) => toAttack(row));
  }

  async getAttack(id: number): Promise<Attack> {
    const row = await prisma.attack.findUnique({ where: { id } });
    if (!row) throw notFound("Attaque", id);
    return toAttack(row);
  }

  async createAttack(attack: Attack): Promise<Attack> {
    const row = await prisma.attack.create({
      data: { name: attack.name, damage: attack.damage, usageLimit: attack.usageLimit },
    });
    return toAttack(row);
  }

  // ---------- Pokémon ----------

  async listPokemons(): Promise<Pokemon[]> {
    const rows = await prisma.pokemon.findMany({ include: pokemonInclude, orderBy: { id: "asc" } });
    return rows.map(toPokemon);
  }

  async getPokemon(id: number): Promise<Pokemon> {
    const row = await prisma.pokemon.findUnique({ where: { id }, include: pokemonInclude });
    if (!row) throw notFound("Pokémon", id);
    return toPokemon(row);
  }

  async createPokemon(pokemon: Pokemon, trainerId?: number): Promise<Pokemon> {
    if (trainerId !== undefined) await this.getTrainer(trainerId);
    const row = await prisma.pokemon.create({
      data: { name: pokemon.name, lifePoint: pokemon.lifePoint, maxLifePoint: pokemon.maxLifePoint, trainerId },
      include: pokemonInclude,
    });
    return toPokemon(row);
  }

  async addLearnedAttack(pokemonId: number, attackId: number): Promise<void> {
    await prisma.pokemonAttack.create({ data: { pokemonId, attackId } });
  }

  // Enregistre les PV et les compteurs d'usage d'un Pokémon
  async savePokemon(pokemon: Pokemon, tx: Prisma.TransactionClient = prisma): Promise<void> {
    if (pokemon.id === undefined) throw new Error("Pokémon non persisté");
    const pokemonId = pokemon.id;
    await tx.pokemon.update({ where: { id: pokemonId }, data: { lifePoint: pokemon.lifePoint } });
    for (const attack of pokemon.attacks) {
      await tx.pokemonAttack.update({
        where: { pokemonId_attackId: { pokemonId, attackId: attack.id! } },
        data: { usageCount: attack.usageCount },
      });
    }
  }

  // ---------- Dresseurs ----------

  async listTrainers(): Promise<Trainer[]> {
    const rows = await prisma.trainer.findMany({ include: trainerInclude, orderBy: { id: "asc" } });
    return rows.map(toTrainer);
  }

  async getTrainer(id: number): Promise<Trainer> {
    const row = await prisma.trainer.findUnique({ where: { id }, include: trainerInclude });
    if (!row) throw notFound("Dresseur", id);
    return toTrainer(row);
  }

  async createTrainer(trainer: Trainer): Promise<Trainer> {
    const row = await prisma.trainer.create({
      data: { name: trainer.name, level: trainer.level, experience: trainer.experience },
      include: trainerInclude,
    });
    return toTrainer(row);
  }

  async assignPokemon(trainerId: number, pokemonId: number): Promise<void> {
    const row = await prisma.pokemon.findUnique({ where: { id: pokemonId } });
    if (!row) throw notFound("Pokémon", pokemonId);
    if (row.trainerId !== null && row.trainerId !== trainerId) {
      throw new HttpError(409, `Le Pokémon ${pokemonId} appartient déjà à un autre dresseur`);
    }
    await prisma.pokemon.update({ where: { id: pokemonId }, data: { trainerId } });
  }

  // Enregistre niveau, expérience et l'état de tous les Pokémon des dresseurs, en une transaction
  async saveTrainers(...trainers: Trainer[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const trainer of trainers) {
        if (trainer.id === undefined) throw new Error("Dresseur non persisté");
        await tx.trainer.update({
          where: { id: trainer.id },
          data: { level: trainer.level, experience: trainer.experience },
        });
        for (const pokemon of trainer.pokemons) await this.savePokemon(pokemon, tx);
      }
    });
  }

  async savePokemons(...pokemons: Pokemon[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const pokemon of pokemons) await this.savePokemon(pokemon, tx);
    });
  }
}

export const gameRepository = new GameRepository();
