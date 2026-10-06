import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createApplication, listApplications, updateApplication } from "../controllers/applicationController.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(listApplications));
router.post("/", asyncHandler(createApplication));
router.put("/:id", asyncHandler(updateApplication));

export default router;
