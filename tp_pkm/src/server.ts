import "dotenv/config";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { GameError } from "./classes/GameError";
import { HttpError } from "./errors/HttpError";
import { Prisma } from "./generated/prisma/client";
import gameRoutes from "./routes/gameRoutes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API Pokémon — routes disponibles sous /api" });
});

app.use("/api", gameRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

// Gestion centralisée des erreurs (Express 5 transmet aussi les erreurs des handlers async)
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err instanceof GameError) return res.status(400).json({ error: err.message });
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return res.status(409).json({ error: "Cette ressource existe déjà (nom déjà utilisé ou attaque déjà apprise)" });
  }
  if (err instanceof SyntaxError && "body" in err) return res.status(400).json({ error: "JSON invalide" });

  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`API Pokémon démarrée sur http://localhost:${port}`);
});
