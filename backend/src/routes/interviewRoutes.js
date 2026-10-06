import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createInterview, deleteInterview, listInterviews, updateInterview } from "../controllers/interviewController.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(listInterviews));
router.post("/", asyncHandler(createInterview));
router.put("/:id", asyncHandler(updateInterview));
router.delete("/:id", asyncHandler(deleteInterview));

export default router;
