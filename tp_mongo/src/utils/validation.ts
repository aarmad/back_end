import type { Request } from "express";
import { HttpError } from "./HttpError";

export const bodyOf = (req: Request): Record<string, unknown> =>
  req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};

export function requireString(body: Record<string, unknown>, field: string, { min = 1, max = 255 } = {}): string {
  const value = body[field];
  if (typeof value !== "string" || value.trim().length < min || value.trim().length > max) {
    throw new HttpError(400, `"${field}" est requis (texte de ${min} à ${max} caractères)`);
  }
  return value.trim();
}

// Identifiant de jeu passé dans l'URL (games.id, VARCHAR(100))
export function parseGameId(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 100) {
    throw new HttpError(400, "Identifiant de jeu invalide");
  }
  return value.trim();
}
