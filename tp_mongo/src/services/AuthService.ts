import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { env } from "../config/env";
import { mysqlPool } from "../config/mysql";
import { HttpError } from "../utils/HttpError";

interface UserRow extends RowDataPacket {
  id: string;
  username: string;
  password_hash: string;
}

export interface AuthResult {
  token: string;
  user: { id: string; username: string };
}

export class AuthService {
  async register(username: string, password: string): Promise<AuthResult> {
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      await mysqlPool.query("INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)", [id, username, passwordHash]);
    } catch (error) {
      if ((error as { code?: string }).code === "ER_DUP_ENTRY") throw new HttpError(409, "Ce nom d'utilisateur est déjà pris");
      throw error;
    }
    return this.issueToken(id, username);
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const [rows] = await mysqlPool.query<UserRow[]>("SELECT * FROM users WHERE username = ?", [username]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError(401, "Identifiants invalides");
    }
    return this.issueToken(user.id, user.username);
  }

  // Renvoie l'id de l'utilisateur contenu dans un token valide
  verify(token: string): string {
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      if (typeof payload === "string" || typeof payload.sub !== "string") throw new Error("payload invalide");
      return payload.sub;
    } catch {
      throw new HttpError(401, "Token invalide ou expiré");
    }
  }

  private issueToken(id: string, username: string): AuthResult {
    const options: SignOptions = { subject: id, expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
    return { token: jwt.sign({ username }, env.jwtSecret, options), user: { id, username } };
  }
}

export const authService = new AuthService();
