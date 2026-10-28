import type { RowDataPacket } from "mysql2";
import { mysqlPool } from "../config/mysql";
import { HttpError } from "../utils/HttpError";

export interface Game {
  id: string;
  title: string;
  genre: string;
  releaseYear: number;
}

interface GameRow extends RowDataPacket {
  id: string;
  title: string;
  genre: string;
  release_year: number;
}

const toGame = (row: GameRow): Game => ({
  id: row.id,
  title: row.title,
  genre: row.genre,
  releaseYear: row.release_year,
});

// Catalogue des jeux (MySQL) : sert de référence pour les favoris ET la wishlist
export class GameService {
  async list(): Promise<Game[]> {
    const [rows] = await mysqlPool.query<GameRow[]>("SELECT * FROM games ORDER BY title");
    return rows.map(toGame);
  }

  // Règle métier : un jeu doit exister avant d'être ajouté à une liste
  async getExisting(gameId: string): Promise<Game> {
    const [rows] = await mysqlPool.query<GameRow[]>("SELECT * FROM games WHERE id = ?", [gameId]);
    if (rows.length === 0) throw new HttpError(404, `Le jeu "${gameId}" n'existe pas dans le catalogue`);
    return toGame(rows[0]);
  }

  async findByIds(ids: string[]): Promise<Map<string, Game>> {
    if (ids.length === 0) return new Map();
    const [rows] = await mysqlPool.query<GameRow[]>("SELECT * FROM games WHERE id IN (?)", [ids]);
    return new Map(rows.map((row) => [row.id, toGame(row)]));
  }
}

export const gameService = new GameService();
