import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { resumeUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { chat, resumeCheck } from "../controllers/aiController.js";

const router = Router();
router.use(authenticate);
router.post("/chat", asyncHandler(chat));
router.post("/resume-check", resumeUpload.single("resume"), asyncHandler(resumeCheck));

export default router;
