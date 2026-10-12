import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query, transaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { requireFields, pick } from "../utils/validators.js";
import { insertSql } from "../models/common.js";
import { generateOtp, sendRegisterOtp as deliverRegisterOtp } from "../services/otpService.js";

function publicUser(user) {
  const { password_hash: _passwordHash, is_active: _isActive, ...safeUser } = user;
  return safeUser;
}

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function signOtpToken(email, phone, purpose = "register") {
  return jwt.sign({ type: "contact_verification", email, phone, purpose }, env.jwtSecret, { expiresIn: "15m" });
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = "") {
  const value = String(phone).trim().replace(/[^\d+]/g, "");
  const digits = value.replace(/\D/g, "");
  if (!value.startsWith("+") && digits.length === 10) return `+91${digits}`;
  return value;
}

function assertValidEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Enter a valid email address.", 400);
  }
}

function assertValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) {
    throw new AppError("Enter a valid mobile number.", 400);
  }
}

async function findUserByEmail(email) {
  const rows = await query("SELECT * FROM users WHERE email = :email LIMIT 1", { email });
  return rows[0];
}

async function ensureUniqueEmailAndPhone(email, phone) {
  const [existingUser] = await query(
    "SELECT id FROM users WHERE email = :email OR phone = :phone LIMIT 1",
    { email, phone }
  );
  if (existingUser) {
    throw new AppError("An account with this email or mobile number already exists.", 409);
  }

  const [existingStudent] = await query(
    "SELECT id FROM students WHERE email = :email OR phone = :phone LIMIT 1",
    { email, phone }
  );
  if (existingStudent) {
    throw new AppError("A student profile with this email or mobile number already exists.", 409);
  }

  const [existingCompany] = await query(
    "SELECT id FROM companies WHERE email = :email OR phone = :phone LIMIT 1",
    { email, phone }
  );
  if (existingCompany) {
    throw new AppError("A company profile with this email or mobile number already exists.", 409);
  }
}

function verifyOtpToken(token, email, phone, purpose = "register") {
  if (!token) throw new AppError("Verify your email and mobile number before registering.", 400);
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (decoded.type !== "contact_verification" || decoded.email !== email || decoded.phone !== phone || decoded.purpose !== purpose) {
      throw new Error("Invalid token scope.");
    }
  } catch (_error) {
    throw new AppError("Email/mobile verification expired. Please verify again.", 400);
  }
}

export async function sendRegisterOtp(req, res) {
  requireFields(req.body, ["email", "phone"]);
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  assertValidEmail(email);
  assertValidPhone(phone);
  await ensureUniqueEmailAndPhone(email, phone);

  const otp = generateOtp();
  const otp_hash = await bcrypt.hash(otp, env.bcryptRounds);
  await query(
    `INSERT INTO otp_verifications (email, phone, purpose, otp_hash, expires_at)
     VALUES (:email, :phone, 'register', :otp_hash, NOW() + (:expires * INTERVAL '1 minute'))`,
    { email, phone, otp_hash, expires: env.otpExpiresMinutes }
  );
  const delivery = await deliverRegisterOtp({ email, phone, otp });

  res.json({
    message: delivery.smsDelivered ? "OTP sent to your email and mobile number." : "OTP sent to your email. SMS is not enabled for this Brevo account.",
    expiresInMinutes: env.otpExpiresMinutes,
    ...(env.nodeEnv !== "production" && env.otpDevResponse ? { devOtp: otp } : {})
  });
}

export async function verifyRegisterOtp(req, res) {
  requireFields(req.body, ["email", "phone", "otp"]);
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  const otp = String(req.body.otp).trim();
  assertValidEmail(email);
  assertValidPhone(phone);
  if (!/^\d{6}$/.test(otp)) throw new AppError("Enter the 6-digit OTP.", 400);

  const rows = await query(
    `SELECT * FROM otp_verifications
     WHERE email = :email AND phone = :phone AND purpose = 'register' AND verified_at IS NULL
     ORDER BY id DESC LIMIT 1`,
    { email, phone }
  );
  const record = rows[0];
  if (!record) throw new AppError("OTP not found. Please request a new OTP.", 400);
  if (new Date(record.expires_at).getTime() < Date.now()) throw new AppError("OTP expired. Please request a new OTP.", 400);
  if (record.attempts >= 5) throw new AppError("Too many OTP attempts. Please request a new OTP.", 429);

  const ok = await bcrypt.compare(otp, record.otp_hash);
  if (!ok) {
    await query("UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = :id", { id: record.id });
    throw new AppError("Invalid OTP.", 400);
  }

  await query("UPDATE otp_verifications SET verified_at = NOW() WHERE id = :id", { id: record.id });
  res.json({ message: "Email and mobile number verified.", otpToken: signOtpToken(email, phone) });
}

export async function login(req, res) {
  requireFields(req.body, ["email", "password"]);
  const email = normalizeEmail(req.body.email);
  assertValidEmail(email);
  const user = await findUserByEmail(email);
  if (!user || !user.is_active) throw new AppError("Invalid email or password.", 401);
  const ok = await bcrypt.compare(req.body.password, user.password_hash);
  if (!ok) throw new AppError("Invalid email or password.", 401);
  res.json({ token: sign(user), user: publicUser(user) });
}

export async function register(req, res) {
  requireFields(req.body, ["name", "email", "phone", "password", "role"]);
  if (!["student", "company", "tpo"].includes(req.body.role)) throw new AppError("Choose a valid role.", 400);
  const name = String(req.body.name).trim();
  const email = normalizeEmail(req.body.email);
  const phone = normalizePhone(req.body.phone);
  if (!name) throw new AppError("Name is required.", 400);
  assertValidEmail(email);
  assertValidPhone(phone);
  if (String(req.body.password).length < 8) throw new AppError("Password must be at least 8 characters.", 400);
  verifyOtpToken(req.body.otpToken, email, phone);
  await ensureUniqueEmailAndPhone(email, phone);

  const password_hash = await bcrypt.hash(req.body.password, env.bcryptRounds);
  const user = await transaction(async (connection) => {
    let student_id = null;
    let company_id = null;

    if (req.body.role === "student") {
      const [result] = await connection.execute(
        `INSERT INTO students (full_name, email, phone, college, graduation_year, placement_status)
         VALUES (:full_name, :email, :phone, 'Gurugram University', 2027, 'PROFILE_PENDING')
         RETURNING id`,
        { full_name: name, email, phone }
      );
      student_id = result.insertId;
    }

    if (req.body.role === "company") {
      const [result] = await connection.execute(
        `INSERT INTO companies (name, email, phone, logo, verified)
         VALUES (:name, :email, :phone, :logo, FALSE)
         RETURNING id`,
        { name, email, phone, logo: name.slice(0, 2).toUpperCase() }
      );
      company_id = result.insertId;
    }

    const { sql, params } = insertSql("users", {
      name,
      email,
      phone,
      password_hash,
      role: req.body.role,
      student_id,
      company_id
    });
    const [result] = await connection.execute(sql, params);
    const [rows] = await connection.execute("SELECT * FROM users WHERE id = :id", { id: result.insertId });
    return rows[0];
  });

  res.status(201).json({ token: sign(user), user: publicUser(user) });
}

export async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

export async function updateMe(req, res) {
  const normalizedBody = { ...req.body, phone: req.body.phone ?? req.body.mobile };
  const payload = pick(normalizedBody, ["name", "email", "phone"]);
  if (payload.email) {
    payload.email = normalizeEmail(payload.email);
    assertValidEmail(payload.email);
  }
  if (payload.phone) {
    payload.phone = normalizePhone(payload.phone);
    assertValidPhone(payload.phone);
  }
  if (!Object.keys(payload).length) return res.json(publicUser(req.user));
  if (payload.email || payload.phone) {
    const [duplicate] = await query(
      "SELECT id FROM users WHERE id <> :id AND (email = :email OR phone = :phone) LIMIT 1",
      { id: req.user.id, email: payload.email || req.user.email, phone: payload.phone || req.user.phone || "" }
    );
    if (duplicate) throw new AppError("An account with this email or mobile number already exists.", 409);
  }
  await query(
    `UPDATE users SET ${Object.keys(payload).map((key) => `${key} = :${key}`).join(", ")} WHERE id = :id`,
    { ...payload, id: req.user.id }
  );
  const rows = await query("SELECT id, name, email, phone, role, student_id, company_id, is_active FROM users WHERE id = :id", { id: req.user.id });
  res.json(publicUser(rows[0]));
}

export async function forgotPassword(req, res) {
  requireFields(req.body, ["email"]);
  res.json({ message: `Password reset instructions were sent to ${req.body.email}.` });
}

export async function logout(_req, res) {
  res.json({ ok: true });
}
