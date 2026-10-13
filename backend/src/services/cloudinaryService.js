import crypto from "crypto";
import fs from "fs/promises";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

function assertConfigured() {
  if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
    throw new AppError("Cloudinary is not configured on the server.", 500);
  }
}

function signParams(params) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${env.cloudinary.apiSecret}`)
    .digest("hex");
}

export async function uploadProfileImage(file, userId) {
  assertConfigured();
  if (!file) throw new AppError("Profile image is required.", 400);

  const timestamp = Math.floor(Date.now() / 1000);
  const publicId = `user-${userId}-${Date.now()}`;
  const params = {
    folder: env.cloudinary.folder,
    public_id: publicId,
    timestamp,
    transformation: "c_fill,g_face,w_400,h_400,q_auto,f_auto"
  };
  const signature = signParams(params);
  const buffer = await fs.readFile(file.path);
  const formData = new FormData();

  Object.entries(params).forEach(([key, value]) => formData.append(key, String(value)));
  formData.append("api_key", env.cloudinary.apiKey);
  formData.append("signature", signature);
  formData.append("file", new Blob([buffer], { type: file.mimetype }), file.originalname);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${env.cloudinary.cloudName}/image/upload`, {
    method: "POST",
    body: formData
  });
  const payload = await response.json().catch(() => ({}));
  await fs.unlink(file.path).catch(() => {});

  if (!response.ok) {
    throw new AppError(payload.error?.message || "Unable to upload profile image.", 502);
  }

  return {
    url: payload.secure_url,
    publicId: payload.public_id
  };
}
