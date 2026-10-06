import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ask,
  candidateMatches,
  contextualInsights,
  interviewPreparation,
  jobMatches,
  placementRisk,
  reportInsights,
  studentInsights
} from "../controllers/smartAIController.js";

const router = Router();
router.use(authenticate);

router.post("/insights", asyncHandler(contextualInsights));
router.post("/ask", asyncHandler(ask));
router.get("/student-insights", authorize("student"), asyncHandler(studentInsights));
router.get("/job-matches", authorize("student"), asyncHandler(jobMatches));
router.get("/placement-risk", authorize("tpo"), asyncHandler(placementRisk));
router.post("/candidate-matches", authorize("company", "tpo"), asyncHandler(candidateMatches));
router.get("/report-insights", authorize("tpo"), asyncHandler(reportInsights));
router.post("/interview-preparation", asyncHandler(interviewPreparation));

export default router;
