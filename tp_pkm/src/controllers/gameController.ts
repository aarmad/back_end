import type { Request, Response } from "express";
import { Attack } from "../classes/Attack";
import { GameError } from "../classes/GameError";
import { Pokemon } from "../classes/Pokemon";
import { Trainer } from "../classes/Trainer";
import { HttpError } from "../errors/HttpError";
import { gameRepository as repo } from "../repositories/GameRepository";
import { CombatService } from "../services/CombatService";

const combatService = new CombatService();

// ---------- Validation des entrées ----------

const parseId = (value: unknown, field = "id"): number => {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, `"${field}" doit être un entier positif`);
  return id;
};

const requireString = (body: Record<string, unknown>, field: string): string => {
  const value = body[field];
  if (typeof value !== "string" || !value.trim()) throw new HttpError(400, `"${field}" est requis (texte)`);
  return value.trim();
};

const requireInt = (body: Record<string, unknown>, field: string): number => {
  const value = body[field];
  if (typeof value !== "number" || !Number.isInteger(value)) throw new HttpError(400, `"${field}" est requis (entier)`);
  return value;
};

const bodyOf = (req: Request): Record<string, unknown> => (req.body && typeof req.body === "object" ? req.body : {});

// ---------- Attaques ----------

export const listAttacks = async (_req: Request, res: Response) => {
  res.json(await repo.listAttacks());
};

export const getAttack = async (req: Request, res: Response) => {
  res.json(await repo.getAttack(parseId(req.params.id)));
};

export const createAttack = async (req: Request, res: Response) => {
  const body = bodyOf(req);
  const attack = new Attack(requireString(body, "name"), requireInt(body, "damage"), requireInt(body, "usageLimit"));
  res.status(201).json(await repo.createAttack(attack));
};

// ---------- Pokémon ----------

export const listPokemons = async (_req: Request, res: Response) => {
  res.json(await repo.listPokemons());
};

export const getPokemon = async (req: Request, res: Response) => {
  res.json(await repo.getPokemon(parseId(req.params.id)));
};

export const createPokemon = async (req: Request, res: Response) => {
  const body = bodyOf(req);
  const pokemon = new Pokemon(requireString(body, "name"), requireInt(body, "lifePoint"));
  const trainerId = body.trainerId === undefined ? undefined : parseId(body.trainerId, "trainerId");
  res.status(201).json(await repo.createPokemon(pokemon, trainerId));
};

export const learnAttack = async (req: Request, res: Response) => {
  const pokemon = await repo.getPokemon(parseId(req.params.id));
  const attack = await repo.getAttack(parseId(bodyOf(req).attackId, "attackId"));
  pokemon.learnAttack(attack.clone()); // vérifie la limite de 4 et les doublons
  await repo.addLearnedAttack(pokemon.id!, attack.id!);
  res.status(201).json(await repo.getPokemon(pokemon.id!));
};

export const healPokemon = async (req: Request, res: Response) => {
  const pokemon = await repo.getPokemon(parseId(req.params.id));
  pokemon.heal();
  await repo.savePokemons(pokemon);
  res.json(pokemon);
};

export const pokemonAttack = async (req: Request, res: Response) => {
  const attackerId = parseId(req.params.id);
  const targetId = parseId(bodyOf(req).targetId, "targetId");
  if (attackerId === targetId) throw new GameError("Un Pokémon ne peut pas s'attaquer lui-même");

  const attacker = await repo.getPokemon(attackerId);
  const target = await repo.getPokemon(targetId);
  if (target.isKO()) throw new GameError(`${target.name} est déjà K.O.`);

  const report = attacker.attack(target);
  if (!report) throw new GameError(`${attacker.name} n'a plus d'attaque disponible (passez par la taverne)`);
  await repo.savePokemons(attacker, target);
  res.json({ report, attacker, target });
};

// ---------- Dresseurs ----------

export const listTrainers = async (_req: Request, res: Response) => {
  res.json(await repo.listTrainers());
};

export const getTrainer = async (req: Request, res: Response) => {
  res.json(await repo.getTrainer(parseId(req.params.id)));
};

export const createTrainer = async (req: Request, res: Response) => {
  const trainer = new Trainer(requireString(bodyOf(req), "name"));
  res.status(201).json(await repo.createTrainer(trainer));
};

export const addPokemonToTrainer = async (req: Request, res: Response) => {
  const trainer = await repo.getTrainer(parseId(req.params.id));
  const pokemonId = parseId(bodyOf(req).pokemonId, "pokemonId");
  if (trainer.pokemons.some((pokemon) => pokemon.id === pokemonId)) {
    throw new GameError(`${trainer.name} possède déjà le Pokémon ${pokemonId}`);
  }
  const pokemon = await repo.getPokemon(pokemonId);
  await repo.assignPokemon(trainer.id!, pokemonId);
  trainer.addPokemon(pokemon);
  res.json(trainer);
};

export const tavern = async (req: Request, res: Response) => {
  const trainer = await repo.getTrainer(parseId(req.params.id));
  trainer.healAllAtTavern();
  await repo.saveTrainers(trainer);
  res.json(trainer);
};

export const gainExperience = async (req: Request, res: Response) => {
  const trainer = await repo.getTrainer(parseId(req.params.id));
  const levelsGained = trainer.gainExperience(requireInt(bodyOf(req), "amount"));
  await repo.saveTrainers(trainer);
  res.json({ levelsGained, trainer });
};

// ---------- Combats ----------

const loadOpponents = async (req: Request) => {
  const body = bodyOf(req);
  const trainer1Id = parseId(body.trainer1Id, "trainer1Id");
  const trainer2Id = parseId(body.trainer2Id, "trainer2Id");
  if (trainer1Id === trainer2Id) throw new GameError("Un dresseur ne peut pas se battre contre lui-même");
  return [await repo.getTrainer(trainer1Id), await repo.getTrainer(trainer2Id)] as const;
};

const runCombat =
  <T>(combat: (trainer1: Trainer, trainer2: Trainer) => T) =>
  async (req: Request, res: Response) => {
    const [trainer1, trainer2] = await loadOpponents(req);
    const result = combat(trainer1, trainer2);
    await repo.saveTrainers(trainer1, trainer2);
    res.json({ result, trainers: [trainer1, trainer2] });
  };

export const randomChallenge = runCombat((t1, t2) => combatService.randomChallenge(t1, t2));
export const arena1 = runCombat((t1, t2) => combatService.arena1(t1, t2));
export const deterministicChallenge = runCombat((t1, t2) => combatService.deterministicChallenge(t1, t2));
export const arena2 = runCombat((t1, t2) => combatService.arena2(t1, t2));
