const express = require("express");
const { ObjectId } = require("mongodb");
const { client, games } = require("./db");

const app = express();
app.use(express.json());

const MAX_LIMIT = 50;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Échappe les caractères spéciaux pour qu'un mot-clé comme "c++" ne casse pas la regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseObjectId = (id) => {
  if (!ObjectId.isValid(id)) throw new HttpError(400, "Identifiant invalide");
  return new ObjectId(id);
};

const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
};

const paginate = async (filter, query) => {
  const { page, limit, skip } = parsePagination(query);
  const [items, total] = await Promise.all([
    games.find(filter).sort({ rating: -1, title: 1 }).skip(skip).limit(limit).toArray(),
    games.countDocuments(filter),
  ]);
  return { page, limit, total, totalPages: Math.ceil(total / limit), items };
};

// Vérifie le body d'un jeu et renvoie le document à insérer
const validateGame = (body) => {
  const errors = [];
  const isText = (value) => typeof value === "string" && value.trim() !== "";
  const { title, description, genre, platforms, releaseYear, rating, developer } = body ?? {};

  if (!isText(title)) errors.push("title est requis (texte)");
  if (!isText(description)) errors.push("description est requis (texte)");
  if (!isText(genre)) errors.push("genre est requis (texte)");
  if (!Array.isArray(platforms) || platforms.length === 0 || !platforms.every(isText)) {
    errors.push("platforms doit être une liste non vide de textes");
  }
  if (!Number.isInteger(releaseYear) || releaseYear < 1950 || releaseYear > new Date().getFullYear() + 2) {
    errors.push("releaseYear doit être une année valide");
  }
  if (typeof rating !== "number" || rating < 0 || rating > 10) errors.push("rating doit être un nombre entre 0 et 10");
  if (developer !== undefined && !isText(developer)) errors.push("developer doit être un texte");
  if (errors.length) throw new HttpError(400, errors.join(", "));

  return {
    title: title.trim(),
    description: description.trim(),
    genre: genre.trim().toLowerCase(),
    platforms: platforms.map((p) => p.trim()),
    releaseYear,
    rating,
    ...(developer && { developer: developer.trim() }),
    createdAt: new Date(),
  };
};

app.get("/", (_req, res) => {
  res.json({ message: "API Jeux vidéo — routes : POST /items, GET /items, GET /items/:id, GET /search" });
});

// Create
app.post("/items", async (req, res) => {
  const game = validateGame(req.body);
  const { insertedId } = await games.insertOne(game);
  res.status(201).json({ _id: insertedId, ...game });
});

// Read : liste paginée (?page=1&limit=10)
app.get("/items", async (req, res) => {
  res.json(await paginate({}, req.query));
});

// Read : un document
app.get("/items/:id", async (req, res) => {
  const game = await games.findOne({ _id: parseObjectId(req.params.id) });
  if (!game) throw new HttpError(404, "Jeu introuvable");
  res.json(game);
});

// Recherche : /search?keyword=zelda&genre=aventure&platform=switch&minRating=8&maxYear=2020
app.get("/search", async (req, res) => {
  const { keyword, genre, platform, minRating, maxYear } = req.query;
  const filter = {};

  if (keyword) {
    const regex = { $regex: escapeRegex(keyword), $options: "i" };
    filter.$or = [{ title: regex }, { description: regex }, { developer: regex }];
  }
  if (genre) filter.genre = { $regex: `^${escapeRegex(genre)}$`, $options: "i" };
  if (platform) filter.platforms = { $regex: `^${escapeRegex(platform)}$`, $options: "i" };
  if (minRating !== undefined) {
    const value = Number(minRating);
    if (Number.isNaN(value)) throw new HttpError(400, "minRating doit être un nombre");
    filter.rating = { $gte: value };
  }
  if (maxYear !== undefined) {
    const value = Number(maxYear);
    if (!Number.isInteger(value)) throw new HttpError(400, "maxYear doit être une année");
    filter.releaseYear = { $lte: value };
  }
  if (Object.keys(filter).length === 0) {
    throw new HttpError(400, "Indiquez au moins un critère : keyword, genre, platform, minRating ou maxYear");
  }

  res.json({ criteria: { keyword, genre, platform, minRating, maxYear }, ...(await paginate(filter, req.query)) });
});

app.use((_req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "JSON invalide" });
  console.error(err);
  res.status(500).json({ error: "Erreur interne du serveur" });
});

const port = Number(process.env.PORT) || 3002;

client
  .connect()
  .then(() => {
    app.listen(port, () => console.log(`API Jeux vidéo démarrée sur http://localhost:${port}`));
  })
  .catch((err) => {
    console.error("Connexion à MongoDB impossible :", err.message);
    process.exit(1);
  });
