import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/HttpError";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "Route introuvable" });
}

// Express 5 transmet aussi ici les erreurs des handlers async
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if ((err as { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({ error: "JSON invalide" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
}
