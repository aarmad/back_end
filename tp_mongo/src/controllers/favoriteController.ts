import type { Request, Response } from "express";
import { currentUserId } from "../middlewares/auth";
import { favoriteService } from "../services/FavoriteService";
import { parsePagination } from "../utils/pagination";
import { parseGameId } from "../utils/validation";

export const addFavorite = async (req: Request, res: Response) => {
  const favorite = await favoriteService.add(currentUserId(res), parseGameId(req.params.gameId));
  res.status(201).json(favorite);
};

export const listFavorites = async (req: Request, res: Response) => {
  res.json(await favoriteService.list(currentUserId(res), parsePagination(req.query)));
};

export const removeFavorite = async (req: Request, res: Response) => {
  await favoriteService.remove(currentUserId(res), parseGameId(req.params.gameId));
  res.status(204).end();
};

export const favoriteStats = async (_req: Request, res: Response) => {
  res.json(await favoriteService.stats(currentUserId(res)));
};
