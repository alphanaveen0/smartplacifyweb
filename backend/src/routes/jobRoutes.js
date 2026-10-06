import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { checkEligibility, createJob, deleteJob, eligibilitySummary, getJob, listJobs, updateJob } from "../controllers/jobController.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(listJobs));
router.post("/", authorize("company", "tpo"), asyncHandler(createJob));
router.get("/:jobId/eligibility", authorize("company", "tpo"), asyncHandler(eligibilitySummary));
router.get("/:jobId/eligibility/:studentId", asyncHandler(checkEligibility));
router.get("/:id", asyncHandler(getJob));
router.put("/:id", authorize("company", "tpo"), asyncHandler(updateJob));
router.delete("/:id", authorize("company", "tpo"), asyncHandler(deleteJob));

export default router;
