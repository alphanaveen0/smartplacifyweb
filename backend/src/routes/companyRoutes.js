import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createCompany, deleteCompany, getCompany, listCompanies, updateCompany } from "../controllers/companyController.js";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(listCompanies));
router.post("/", authorize("tpo"), asyncHandler(createCompany));
router.get("/:id", asyncHandler(getCompany));
router.put("/:id", asyncHandler(updateCompany));
router.delete("/:id", authorize("tpo"), asyncHandler(deleteCompany));

export default router;
