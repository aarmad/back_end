import { GameError } from "./GameError";
import { Pokemon } from "./Pokemon";

export class Trainer {
  static readonly EXPERIENCE_PER_LEVEL = 10;

  private _level: number;
  private _experience: number;
  private readonly _pokemons: Pokemon[] = [];

  constructor(
    public readonly name: string,
    level = 1,
    experience = 0,
    pokemons: Pokemon[] = [],
    public readonly id?: number,
  ) {
    if (!name.trim()) throw new GameError("Un dresseur doit avoir un nom");
    this._level = level;
    this._experience = experience;
    pokemons.forEach((pokemon) => this.addPokemon(pokemon));
  }

  get level(): number {
    return this._level;
  }

  get experience(): number {
    return this._experience;
  }

  get pokemons(): readonly Pokemon[] {
    return this._pokemons;
  }

  addPokemon(pokemon: Pokemon): void {
    if (this._pokemons.includes(pokemon)) {
      throw new GameError(`${this.name} possède déjà ${pokemon.name}`);
    }
    this._pokemons.push(pokemon);
  }

  // Soigne tous les Pokémon du dresseur
  healAllAtTavern(): void {
    this._pokemons.forEach((pokemon) => pokemon.heal());
  }

  // Ajoute de l'expérience ; chaque palier de 10 fait monter d'un niveau. Renvoie le nombre de niveaux gagnés.
  gainExperience(amount: number): number {
    if (!Number.isInteger(amount) || amount < 0) throw new GameError("L'expérience gagnée doit être un entier positif");
    this._experience += amount;
    let levelsGained = 0;
    while (this._experience >= Trainer.EXPERIENCE_PER_LEVEL) {
      this._experience -= Trainer.EXPERIENCE_PER_LEVEL;
      this._level++;
      levelsGained++;
    }
    return levelsGained;
  }

  alivePokemons(): Pokemon[] {
    return this._pokemons.filter((pokemon) => !pokemon.isKO());
  }

  hasAlivePokemon(): boolean {
    return this.alivePokemons().length > 0;
  }

  randomPokemon(random: () => number = Math.random): Pokemon {
    const alive = this.alivePokemons();
    if (alive.length === 0) throw new GameError(`${this.name} n'a aucun Pokémon en état de combattre`);
    return alive[Math.floor(random() * alive.length)];
  }

  // Pokémon en état de combattre ayant le plus de PV
  strongestPokemon(): Pokemon {
    const alive = this.alivePokemons();
    if (alive.length === 0) throw new GameError(`${this.name} n'a aucun Pokémon en état de combattre`);
    return alive.reduce((best, pokemon) => (pokemon.lifePoint > best.lifePoint ? pokemon : best));
  }

  toString(): string {
    return `${this.name} (niv. ${this._level}, ${this._experience}/${Trainer.EXPERIENCE_PER_LEVEL} XP)`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      level: this._level,
      experience: this._experience,
      pokemons: this._pokemons,
    };
  }
}
