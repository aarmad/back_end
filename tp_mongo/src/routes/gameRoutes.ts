import { Router } from "express";
import { listGames } from "../controllers/gameController";

const router = Router();

router.get("/", listGames);

export default router;
