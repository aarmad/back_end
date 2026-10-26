import { Router } from "express";
import * as game from "../controllers/gameController";

const router = Router();

// Attaques
router.get("/attacks", game.listAttacks);
router.post("/attacks", game.createAttack);
router.get("/attacks/:id", game.getAttack);

// Pokémon
router.get("/pokemons", game.listPokemons);
router.post("/pokemons", game.createPokemon);
router.get("/pokemons/:id", game.getPokemon);
router.post("/pokemons/:id/attacks", game.learnAttack);
router.post("/pokemons/:id/heal", game.healPokemon);
router.post("/pokemons/:id/attack", game.pokemonAttack);

// Dresseurs
router.get("/trainers", game.listTrainers);
router.post("/trainers", game.createTrainer);
router.get("/trainers/:id", game.getTrainer);
router.post("/trainers/:id/pokemons", game.addPokemonToTrainer);
router.post("/trainers/:id/tavern", game.tavern);
router.post("/trainers/:id/experience", game.gainExperience);

// Combats (body : { trainer1Id, trainer2Id })
router.post("/combats/random-challenge", game.randomChallenge);
router.post("/combats/arena1", game.arena1);
router.post("/combats/deterministic-challenge", game.deterministicChallenge);
router.post("/combats/arena2", game.arena2);

export default router;
