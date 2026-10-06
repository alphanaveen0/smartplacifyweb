import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { summary } from "../controllers/reportController.js";

const router = Router();
router.use(authenticate);
router.get("/summary", authorize("tpo"), asyncHandler(summary));

export default router;
