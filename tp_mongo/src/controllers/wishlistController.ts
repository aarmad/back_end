import type { Request, Response } from "express";
import { currentUserId } from "../middlewares/auth";
import { wishlistService, type PersonalNote } from "../services/WishlistService";
import { HttpError } from "../utils/HttpError";
import { parsePagination } from "../utils/pagination";
import { bodyOf, parseGameId } from "../utils/validation";

const MAX_NOTE_LENGTH = 1000;

// Lit { note?, details? } : la note est un texte, details un objet libre (priorité, tags, prix visé...)
function parsePersonalNote(body: Record<string, unknown>, { required }: { required: boolean }): PersonalNote {
  const { note, details } = body;
  const personal: PersonalNote = {};

  if (note !== undefined) {
    if (typeof note !== "string" || note.length > MAX_NOTE_LENGTH) {
      throw new HttpError(400, `"note" doit être un texte de ${MAX_NOTE_LENGTH} caractères maximum`);
    }
    personal.note = note.trim();
  }
  if (details !== undefined) {
    if (details === null || typeof details !== "object" || Array.isArray(details)) {
      throw new HttpError(400, '"details" doit être un objet');
    }
    personal.details = details as Record<string, unknown>;
  }
  if (required && personal.note === undefined && personal.details === undefined) {
    throw new HttpError(400, 'Indiquez une "note" et/ou des "details"');
  }
  return personal;
}

export const addToWishlist = async (req: Request, res: Response) => {
  const personal = parsePersonalNote(bodyOf(req), { required: false });
  const entry = await wishlistService.add(currentUserId(res), parseGameId(req.params.gameId), personal);
  res.status(201).json(entry);
};

export const getWishlist = async (req: Request, res: Response) => {
  res.json(await wishlistService.list(currentUserId(res), parsePagination(req.query)));
};

export const updateWishlistNote = async (req: Request, res: Response) => {
  const personal = parsePersonalNote(bodyOf(req), { required: true });
  res.json(await wishlistService.updateNote(currentUserId(res), parseGameId(req.params.gameId), personal));
};

export const removeFromWishlist = async (req: Request, res: Response) => {
  await wishlistService.remove(currentUserId(res), parseGameId(req.params.gameId));
  res.status(204).end();
};
