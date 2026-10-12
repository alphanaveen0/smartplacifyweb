import dotenv from "dotenv";

dotenv.config();

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5001),
  frontendOrigins: String(process.env.FRONTEND_ORIGIN || "http://localhost:8000,http://127.0.0.1:8000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  db: {
    host: required("DB_HOST", "localhost"),
    port: Number(process.env.DB_PORT || 5432),
    user: required("DB_USER", "postgres"),
    password: process.env.DB_PASSWORD || "",
    database: required("DB_NAME", "postgres"),
    max: Number(process.env.DB_POOL_MAX || 10),
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false
  },
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10),
  otpDevResponse: process.env.OTP_DEV_RESPONSE === "true",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  uploadDir: process.env.UPLOAD_DIR || "uploads/resumes",
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5)
};
