import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { mysqlPool } from "../config/mysql";
import { HttpError } from "../utils/HttpError";
import { toPage, type Page, type Pagination } from "../utils/pagination";
import { gameService, type Game } from "./GameService";

export interface Favorite {
  game: Game;
  addedAt: Date;
}

export interface FavoriteStats {
  total: number;
  byGenre: { genre: string; count: number }[];
  firstAddedAt: Date | null;
  lastAddedAt: Date | null;
  // Classement global (tous utilisateurs confondus) : seuls des compteurs sont exposés
  mostFavoritedGames: { game: Game; favorites: number }[];
}

interface FavoriteRow extends RowDataPacket {
  game_id: string;
  title: string;
  genre: string;
  release_year: number;
  added_at: Date;
}

const toFavorite = (row: FavoriteRow): Favorite => ({
  game: { id: row.game_id, title: row.title, genre: row.genre, releaseYear: row.release_year },
  addedAt: row.added_at,
});

// Favoris stockés dans MySQL (table user_favorites). Toutes les requêtes filtrent sur l'utilisateur connecté.
export class FavoriteService {
  async add(userId: string, gameId: string): Promise<Favorite> {
    const game = await gameService.getExisting(gameId);
    try {
      await mysqlPool.query("INSERT INTO user_favorites (user_id, game_id) VALUES (?, ?)", [userId, gameId]);
    } catch (error) {
      // La contrainte UNIQUE (user_id, game_id) garantit l'absence de doublon, même en cas de requêtes simultanées
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") {
        throw new HttpError(409, `"${game.title}" est déjà dans vos favoris`);
      }
      throw error;
    }
    const [rows] = await mysqlPool.query<FavoriteRow[]>(
      "SELECT added_at FROM user_favorites WHERE user_id = ? AND game_id = ?",
      [userId, gameId],
    );
    return { game, addedAt: rows[0].added_at };
  }

  async list(userId: string, pagination: Pagination): Promise<Page<Favorite>> {
    const [rows] = await mysqlPool.query<FavoriteRow[]>(
      `SELECT f.game_id, f.added_at, g.title, g.genre, g.release_year
         FROM user_favorites f
         JOIN games g ON g.id = f.game_id
        WHERE f.user_id = ?
        ORDER BY f.added_at DESC, f.id DESC
        LIMIT ? OFFSET ?`,
      [userId, pagination.limit, pagination.offset],
    );
    const [[{ total }]] = await mysqlPool.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS total FROM user_favorites WHERE user_id = ?",
      [userId],
    );
    return toPage(rows.map(toFavorite), total, pagination);
  }

  async remove(userId: string, gameId: string): Promise<void> {
    const [result] = await mysqlPool.query<ResultSetHeader>(
      "DELETE FROM user_favorites WHERE user_id = ? AND game_id = ?",
      [userId, gameId],
    );
    if (result.affectedRows === 0) throw new HttpError(404, `Le jeu "${gameId}" n'est pas dans vos favoris`);
  }

  async stats(userId: string): Promise<FavoriteStats> {
    const [[summary]] = await mysqlPool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, MIN(added_at) AS firstAddedAt, MAX(added_at) AS lastAddedAt
         FROM user_favorites WHERE user_id = ?`,
      [userId],
    );
    const [byGenre] = await mysqlPool.query<RowDataPacket[]>(
      `SELECT g.genre, COUNT(*) AS count
         FROM user_favorites f JOIN games g ON g.id = f.game_id
        WHERE f.user_id = ?
        GROUP BY g.genre
        ORDER BY count DESC, g.genre`,
      [userId],
    );
    const [top] = await mysqlPool.query<(FavoriteRow & { favorites: number })[]>(
      `SELECT g.id AS game_id, g.title, g.genre, g.release_year, COUNT(*) AS favorites
         FROM user_favorites f JOIN games g ON g.id = f.game_id
        GROUP BY g.id, g.title, g.genre, g.release_year
        ORDER BY favorites DESC, g.title
        LIMIT 5`,
    );

    return {
      total: summary.total,
      byGenre: byGenre.map((row) => ({ genre: row.genre, count: row.count })),
      firstAddedAt: summary.firstAddedAt,
      lastAddedAt: summary.lastAddedAt,
      mostFavoritedGames: top.map((row) => ({ game: toFavorite(row).game, favorites: row.favorites })),
    };
  }
}

export const favoriteService = new FavoriteService();
