import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotificationController, listNotifications, markAllRead, markRead } from "../controllers/notificationController.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(listNotifications));
router.post("/", asyncHandler(createNotificationController));
router.put("/read-all", asyncHandler(markAllRead));
router.put("/:id/read", asyncHandler(markRead));

export default router;
