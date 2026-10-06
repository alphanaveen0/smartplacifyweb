import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { resumeUpload } from "../middleware/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent, uploadResume } from "../controllers/studentController.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(listStudents));
router.post("/", authorize("tpo"), asyncHandler(createStudent));
router.get("/:id", asyncHandler(getStudent));
router.put("/:id", asyncHandler(updateStudent));
router.delete("/:id", authorize("tpo"), asyncHandler(deleteStudent));
router.post("/:id/resume", resumeUpload.single("resume"), asyncHandler(uploadResume));

export default router;
