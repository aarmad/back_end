import { GameError } from "../classes/GameError";
import { Pokemon } from "../classes/Pokemon";
import { Trainer } from "../classes/Trainer";

export interface FightResult {
  winner: Pokemon | null; // null = match nul (aucun des deux ne peut plus attaquer, PV égaux)
  turns: number;
  log: string[];
}

export interface ChallengeResult {
  mode: "random" | "deterministic";
  trainer1: string;
  trainer2: string;
  pokemon1: string;
  pokemon2: string;
  winner: string | null;
  turns: number;
  log: string[];
}

export interface ArenaResult {
  mode: "arena1" | "arena2";
  roundsPlayed: number;
  winner: string | null;
  reason: string;
  victories: Record<string, number>;
  rounds: Omit<ChallengeResult, "log">[];
}

export class CombatService {
  static readonly ARENA_ROUNDS = 100;
  static readonly EXPERIENCE_PER_VICTORY = 1;

  constructor(private readonly random: () => number = Math.random) {}

  // Les deux Pokémon s'attaquent à tour de rôle jusqu'à ce que l'un soit K.O.
  fight(pokemon1: Pokemon, pokemon2: Pokemon): FightResult {
    const log: string[] = [];
    let attacker = pokemon1;
    let defender = pokemon2;
    let turns = 0;

    while (!pokemon1.isKO() && !pokemon2.isKO()) {
      // Toutes les attaques épuisées des deux côtés : le combat ne peut plus avancer
      if (!pokemon1.canAttack() && !pokemon2.canAttack()) {
        log.push("Plus aucune attaque disponible : fin du combat");
        break;
      }
      const report = attacker.attack(defender, this.random);
      if (report) {
        turns++;
        log.push(
          `${report.attacker} utilise ${report.attack} sur ${report.target} : -${report.damage} PV ` +
            `(reste ${report.targetLifePoint}/${defender.maxLifePoint})`,
        );
      } else {
        log.push(`${attacker.name} n'a plus d'attaque disponible et passe son tour`);
      }
      [attacker, defender] = [defender, attacker];
    }

    let winner: Pokemon | null;
    if (pokemon2.isKO()) winner = pokemon1;
    else if (pokemon1.isKO()) winner = pokemon2;
    else if (pokemon1.lifePoint !== pokemon2.lifePoint) winner = pokemon1.lifePoint > pokemon2.lifePoint ? pokemon1 : pokemon2;
    else winner = null;

    log.push(winner ? `${winner.name} remporte le combat !` : "Match nul !");
    return { winner, turns, log };
  }

  // Défi aléatoire : taverne pour les deux, puis un Pokémon tiré au hasard chacun
  randomChallenge(trainer1: Trainer, trainer2: Trainer): ChallengeResult {
    this.assertOpponents(trainer1, trainer2);
    trainer1.healAllAtTavern();
    trainer2.healAllAtTavern();
    return this.challenge("random", trainer1, trainer2, trainer1.randomPokemon(this.random), trainer2.randomPokemon(this.random));
  }

  // Défi déterministe : chacun envoie son Pokémon avec le plus de PV, sans passer par la taverne
  deterministicChallenge(trainer1: Trainer, trainer2: Trainer): ChallengeResult {
    this.assertOpponents(trainer1, trainer2);
    return this.challenge("deterministic", trainer1, trainer2, trainer1.strongestPokemon(), trainer2.strongestPokemon());
  }

  // Arène 1 : 100 défis aléatoires, victoire au plus haut niveau (puis à l'expérience)
  arena1(trainer1: Trainer, trainer2: Trainer): ArenaResult {
    this.assertOpponents(trainer1, trainer2);
    const rounds: ChallengeResult[] = [];
    for (let i = 0; i < CombatService.ARENA_ROUNDS; i++) {
      rounds.push(this.randomChallenge(trainer1, trainer2));
    }
    const winner = this.bestTrainer(trainer1, trainer2);
    return this.arenaResult("arena1", trainer1, trainer2, rounds, winner, this.levelReason(trainer1, trainer2, winner));
  }

  // Arène 2 : 100 défis déterministes, arrêt dès qu'un dresseur n'a plus de Pokémon en état de combattre
  arena2(trainer1: Trainer, trainer2: Trainer): ArenaResult {
    this.assertOpponents(trainer1, trainer2);
    const rounds: ChallengeResult[] = [];
    while (rounds.length < CombatService.ARENA_ROUNDS && trainer1.hasAlivePokemon() && trainer2.hasAlivePokemon()) {
      rounds.push(this.deterministicChallenge(trainer1, trainer2));
    }

    const alive1 = trainer1.hasAlivePokemon();
    const alive2 = trainer2.hasAlivePokemon();
    if (alive1 && alive2) {
      const winner = this.bestTrainer(trainer1, trainer2);
      return this.arenaResult("arena2", trainer1, trainer2, rounds, winner, this.levelReason(trainer1, trainer2, winner));
    }
    if (!alive1 && !alive2) {
      return this.arenaResult("arena2", trainer1, trainer2, rounds, null, "Aucun des deux dresseurs n'a de Pokémon en état de combattre");
    }
    const [winner, loser] = alive1 ? [trainer1, trainer2] : [trainer2, trainer1];
    return this.arenaResult("arena2", trainer1, trainer2, rounds, winner, `${loser.name} n'a plus aucun Pokémon en état de combattre`);
  }

  private challenge(
    mode: ChallengeResult["mode"],
    trainer1: Trainer,
    trainer2: Trainer,
    pokemon1: Pokemon,
    pokemon2: Pokemon,
  ): ChallengeResult {
    const { winner, turns, log } = this.fight(pokemon1, pokemon2);
    const winningTrainer = winner === pokemon1 ? trainer1 : winner === pokemon2 ? trainer2 : null;
    winningTrainer?.gainExperience(CombatService.EXPERIENCE_PER_VICTORY);

    return {
      mode,
      trainer1: trainer1.name,
      trainer2: trainer2.name,
      pokemon1: pokemon1.name,
      pokemon2: pokemon2.name,
      winner: winningTrainer?.name ?? null,
      turns,
      log,
    };
  }

  private bestTrainer(trainer1: Trainer, trainer2: Trainer): Trainer | null {
    if (trainer1.level !== trainer2.level) return trainer1.level > trainer2.level ? trainer1 : trainer2;
    if (trainer1.experience !== trainer2.experience) return trainer1.experience > trainer2.experience ? trainer1 : trainer2;
    return null;
  }

  private levelReason(trainer1: Trainer, trainer2: Trainer, winner: Trainer | null): string {
    if (!winner) return "Égalité parfaite de niveau et d'expérience";
    return trainer1.level !== trainer2.level ? "Niveau le plus élevé" : "Même niveau, plus d'expérience";
  }

  private arenaResult(
    mode: ArenaResult["mode"],
    trainer1: Trainer,
    trainer2: Trainer,
    rounds: ChallengeResult[],
    winner: Trainer | null,
    reason: string,
  ): ArenaResult {
    const victories = { [trainer1.name]: 0, [trainer2.name]: 0 };
    rounds.forEach((round) => {
      if (round.winner) victories[round.winner]++;
    });
    return {
      mode,
      roundsPlayed: rounds.length,
      winner: winner?.name ?? null,
      reason,
      victories,
      rounds: rounds.map(({ log, ...summary }) => summary),
    };
  }

  private assertOpponents(trainer1: Trainer, trainer2: Trainer): void {
    if (trainer1 === trainer2 || (trainer1.id !== undefined && trainer1.id === trainer2.id)) {
      throw new GameError("Un dresseur ne peut pas se battre contre lui-même");
    }
    for (const trainer of [trainer1, trainer2]) {
      if (trainer.pokemons.length === 0) throw new GameError(`${trainer.name} n'a aucun Pokémon`);
    }
  }
}
