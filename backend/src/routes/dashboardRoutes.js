import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDashboard } from "../controllers/dashboardController.js";

const router = Router();
router.use(authenticate);
router.get("/:role", asyncHandler(getDashboard));

export default router;
