import type { Request, Response } from "express";
import { gameService } from "../services/GameService";

export const listGames = async (_req: Request, res: Response) => {
  res.json(await gameService.list());
};
