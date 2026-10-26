import { GameError } from "./GameError";

export class Attack {
  private _usageCount: number;

  constructor(
    public readonly name: string,
    public readonly damage: number,
    public readonly usageLimit: number,
    usageCount = 0,
    public readonly id?: number,
  ) {
    if (!name.trim()) throw new GameError("Une attaque doit avoir un nom");
    if (!Number.isInteger(damage) || damage < 0) throw new GameError("Les dégâts doivent être un entier positif");
    if (!Number.isInteger(usageLimit) || usageLimit < 1) throw new GameError("La limite d'usage doit être un entier ≥ 1");
    this._usageCount = usageCount;
  }

  get usageCount(): number {
    return this._usageCount;
  }

  isAvailable(): boolean {
    return this._usageCount < this.usageLimit;
  }

  // Utilise l'attaque : incrémente le compteur et renvoie les dégâts infligés
  use(): number {
    if (!this.isAvailable()) throw new GameError(`L'attaque ${this.name} n'a plus d'utilisations`);
    this._usageCount++;
    return this.damage;
  }

  resetUsage(): void {
    this._usageCount = 0;
  }

  // Copie vierge : chaque Pokémon possède son propre compteur d'usage
  clone(): Attack {
    return new Attack(this.name, this.damage, this.usageLimit, 0, this.id);
  }

  toString(): string {
    return `${this.name} — dégâts : ${this.damage}, utilisations : ${this._usageCount}/${this.usageLimit}`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      damage: this.damage,
      usageLimit: this.usageLimit,
      usageCount: this._usageCount,
      description: this.toString(),
    };
  }
}
