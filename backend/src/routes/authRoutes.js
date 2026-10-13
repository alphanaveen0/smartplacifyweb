import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import { profileImageUpload } from "../middleware/upload.js";
import { forgotPassword, login, logout, me, register, sendRegisterOtp, updateMe, uploadAvatar, verifyRegisterOtp } from "../controllers/authController.js";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/otp/send", asyncHandler(sendRegisterOtp));
router.post("/otp/verify", asyncHandler(verifyRegisterOtp));
router.post("/register", asyncHandler(register));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/logout", authenticate, asyncHandler(logout));
router.get("/me", authenticate, asyncHandler(me));
router.put("/me", authenticate, asyncHandler(updateMe));
router.post("/me/avatar", authenticate, profileImageUpload.single("avatar"), asyncHandler(uploadAvatar));

export default router;
