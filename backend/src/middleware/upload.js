import path from "path";
import multer from "multer";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const storage = multer.diskStorage({
  destination: env.uploadDir,
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname);
    const base = path.basename(file.originalname, extension).replace(/[^a-z0-9_-]+/gi, "-").toLowerCase();
    callback(null, `${Date.now()}-${base}${extension}`);
  }
});

export const resumeUpload = multer({
  storage,
  limits: { fileSize: env.maxUploadMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set([
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]);
    if (!allowed.has(file.mimetype)) {
      callback(new AppError("Resume must be a PDF, DOC, or DOCX file.", 400));
      return;
    }
    callback(null, true);
  }
});
