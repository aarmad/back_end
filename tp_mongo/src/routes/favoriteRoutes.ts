import { Router } from "express";
import { addFavorite, favoriteStats, listFavorites, removeFavorite } from "../controllers/favoriteController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/", listFavorites);
router.get("/stats", favoriteStats);
router.post("/:gameId", addFavorite);
router.delete("/:gameId", removeFavorite);

export default router;
