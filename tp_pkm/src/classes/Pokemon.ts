import { Attack } from "./Attack";
import { GameError } from "./GameError";

export interface AttackReport {
  attacker: string;
  target: string;
  attack: string;
  damage: number;
  targetLifePoint: number;
}

export class Pokemon {
  static readonly MAX_ATTACKS = 4;

  private _lifePoint: number;
  private readonly _attacks: Attack[] = [];

  constructor(
    public readonly name: string,
    public readonly maxLifePoint: number,
    lifePoint: number = maxLifePoint,
    attacks: Attack[] = [],
    public readonly id?: number,
  ) {
    if (!name.trim()) throw new GameError("Un Pokémon doit avoir un nom");
    if (!Number.isInteger(maxLifePoint) || maxLifePoint < 1) throw new GameError("Les PV doivent être un entier ≥ 1");
    this._lifePoint = Math.min(Math.max(lifePoint, 0), maxLifePoint);
    attacks.forEach((attack) => this.learnAttack(attack));
  }

  get lifePoint(): number {
    return this._lifePoint;
  }

  get attacks(): readonly Attack[] {
    return this._attacks;
  }

  // Apprend une attaque : 4 maximum, sans doublon
  learnAttack(attack: Attack): void {
    if (this._attacks.length >= Pokemon.MAX_ATTACKS) {
      throw new GameError(`${this.name} connaît déjà ${Pokemon.MAX_ATTACKS} attaques`);
    }
    if (this._attacks.some((known) => known.name === attack.name)) {
      throw new GameError(`${this.name} connaît déjà l'attaque ${attack.name}`);
    }
    this._attacks.push(attack);
  }

  // Restaure les PV et réinitialise les usages des attaques
  heal(): void {
    this._lifePoint = this.maxLifePoint;
    this._attacks.forEach((attack) => attack.resetUsage());
  }

  isKO(): boolean {
    return this._lifePoint <= 0;
  }

  availableAttacks(): Attack[] {
    return this._attacks.filter((attack) => attack.isAvailable());
  }

  canAttack(): boolean {
    return !this.isKO() && this.availableAttacks().length > 0;
  }

  receiveDamage(damage: number): void {
    this._lifePoint = Math.max(0, this._lifePoint - damage);
  }

  // Attaque la cible avec une attaque disponible tirée au hasard (null si aucune)
  attack(target: Pokemon, random: () => number = Math.random): AttackReport | null {
    if (this.isKO()) throw new GameError(`${this.name} est K.O. et ne peut pas attaquer`);
    const available = this.availableAttacks();
    if (available.length === 0) return null;

    const chosen = available[Math.floor(random() * available.length)];
    const damage = chosen.use();
    target.receiveDamage(damage);
    return {
      attacker: this.name,
      target: target.name,
      attack: chosen.name,
      damage,
      targetLifePoint: target.lifePoint,
    };
  }

  toString(): string {
    return `${this.name} (${this._lifePoint}/${this.maxLifePoint} PV)`;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      lifePoint: this._lifePoint,
      maxLifePoint: this.maxLifePoint,
      attacks: this._attacks,
    };
  }
}
