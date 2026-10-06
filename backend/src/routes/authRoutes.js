import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { forgotPassword, login, logout, me, register, updateMe } from "../controllers/authController.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/register", asyncHandler(register));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/logout", authenticate, asyncHandler(logout));
router.get("/me", authenticate, asyncHandler(me));
router.put("/me", authenticate, asyncHandler(updateMe));

export default router;
