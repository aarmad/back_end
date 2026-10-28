import type { NextFunction, Request, Response } from "express";
import { authService } from "../services/AuthService";
import { HttpError } from "../utils/HttpError";

// Exige un header "Authorization: Bearer <token>" et place l'id de l'utilisateur dans res.locals.userId.
// L'id ne vient jamais de l'URL ni du body : chaque utilisateur ne peut gérer que ses propres listes.
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  if (scheme !== "Bearer" || !token) throw new HttpError(401, "Authentification requise (header Authorization: Bearer <token>)");
  res.locals.userId = authService.verify(token);
  next();
}

export const currentUserId = (res: Response): string => res.locals.userId as string;
