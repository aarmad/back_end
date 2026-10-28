import { Router } from "express";
import { addToWishlist, getWishlist, removeFromWishlist, updateWishlistNote } from "../controllers/wishlistController";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.use(requireAuth);

router.get("/", getWishlist);
router.post("/:gameId", addToWishlist);
router.patch("/:gameId", updateWishlistNote);
router.delete("/:gameId", removeFromWishlist);

export default router;
