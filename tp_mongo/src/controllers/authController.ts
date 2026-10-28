import type { Request, Response } from "express";
import { authService } from "../services/AuthService";
import { bodyOf, requireString } from "../utils/validation";

export const register = async (req: Request, res: Response) => {
  const body = bodyOf(req);
  const username = requireString(body, "username", { min: 3, max: 50 });
  const password = requireString(body, "password", { min: 8, max: 100 });
  res.status(201).json(await authService.register(username, password));
};

export const login = async (req: Request, res: Response) => {
  const body = bodyOf(req);
  res.json(await authService.login(requireString(body, "username"), requireString(body, "password")));
};
