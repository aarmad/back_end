import express from "express";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import authRoutes from "./routes/authRoutes";
import favoriteRoutes from "./routes/favoriteRoutes";
import gameRoutes from "./routes/gameRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";

export const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API Favoris (MySQL) & Wishlist (MongoDB) — voir le README pour les routes" });
});

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/wishlist", wishlistRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
