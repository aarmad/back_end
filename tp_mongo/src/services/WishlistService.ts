import { wishlists } from "../config/mongodb";
import type { WishlistItem } from "../models/wishlist";
import { HttpError } from "../utils/HttpError";
import { toPage, type Page, type Pagination } from "../utils/pagination";
import { gameService, type Game } from "./GameService";

export interface PersonalNote {
  note?: string;
  details?: Record<string, unknown>;
}

export interface WishlistEntry extends Omit<WishlistItem, "gameId"> {
  game: Game | { id: string; removedFromCatalog: true };
}

// Wishlist stockée dans MongoDB : un document par utilisateur, avec un tableau de jeux.
// Toutes les requêtes filtrent sur l'utilisateur connecté.
export class WishlistService {
  async add(userId: string, gameId: string, personal: PersonalNote = {}): Promise<WishlistEntry> {
    const game = await gameService.getExisting(gameId);
    const now = new Date();

    // Crée la wishlist de l'utilisateur si elle n'existe pas encore
    await wishlists.updateOne(
      { userId },
      { $setOnInsert: { userId, games: [], createdAt: now, updatedAt: now } },
      { upsert: true },
    );

    const item: WishlistItem = { gameId, addedAt: now, ...personal, ...(personal.note !== undefined && { noteUpdatedAt: now }) };
    // Le filtre "games.gameId: { $ne }" rend l'ajout atomique : impossible d'ajouter deux fois le même jeu
    const result = await wishlists.updateOne(
      { userId, "games.gameId": { $ne: gameId } },
      { $push: { games: item }, $set: { updatedAt: now } },
    );
    if (result.modifiedCount === 0) throw new HttpError(409, `"${game.title}" est déjà dans votre wishlist`);

    const { gameId: _, ...rest } = item;
    return { game, ...rest };
  }

  // Jeux les plus récemment ajoutés en premier ; la pagination est faite par MongoDB avec $slice
  async list(userId: string, pagination: Pagination): Promise<Page<WishlistEntry>> {
    const [page] = await wishlists
      .aggregate<{ total: number; items: WishlistItem[] }>([
        { $match: { userId } },
        {
          $project: {
            _id: 0,
            total: { $size: "$games" },
            items: { $slice: [{ $reverseArray: "$games" }, pagination.offset, pagination.limit] },
          },
        },
      ])
      .toArray();

    if (!page) return toPage([], 0, pagination);

    // "Jointure" applicative : les infos des jeux viennent du catalogue MySQL
    const games = await gameService.findByIds(page.items.map((item) => item.gameId));
    const items = page.items.map(({ gameId, ...rest }) => ({
      game: games.get(gameId) ?? { id: gameId, removedFromCatalog: true as const },
      ...rest,
    }));
    return toPage(items, page.total, pagination);
  }

  async updateNote(userId: string, gameId: string, personal: PersonalNote): Promise<WishlistEntry> {
    const now = new Date();
    const set: Record<string, unknown> = { updatedAt: now, "games.$.noteUpdatedAt": now };
    if (personal.note !== undefined) set["games.$.note"] = personal.note;
    if (personal.details !== undefined) set["games.$.details"] = personal.details;

    const updated = await wishlists.findOneAndUpdate(
      { userId, "games.gameId": gameId },
      { $set: set },
      { returnDocument: "after", projection: { games: { $elemMatch: { gameId } } } },
    );
    if (!updated) throw new HttpError(404, `Le jeu "${gameId}" n'est pas dans votre wishlist`);

    const { gameId: _, ...rest } = updated.games[0];
    const games = await gameService.findByIds([gameId]);
    return { game: games.get(gameId) ?? { id: gameId, removedFromCatalog: true }, ...rest };
  }

  async remove(userId: string, gameId: string): Promise<void> {
    const result = await wishlists.updateOne(
      { userId, "games.gameId": gameId },
      { $pull: { games: { gameId } }, $set: { updatedAt: new Date() } },
    );
    if (result.matchedCount === 0) throw new HttpError(404, `Le jeu "${gameId}" n'est pas dans votre wishlist`);
  }
}

export const wishlistService = new WishlistService();
