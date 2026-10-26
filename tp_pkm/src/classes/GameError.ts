// Erreur levée quand une règle du jeu n'est pas respectée (renvoyée en 400 par l'API)
export class GameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameError";
  }
}
