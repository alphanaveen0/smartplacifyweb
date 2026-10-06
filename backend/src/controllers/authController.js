import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query, transaction } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { requireFields, pick } from "../utils/validators.js";
import { insertSql } from "../models/common.js";

function publicUser(user) {
  const { password_hash: _passwordHash, is_active: _isActive, ...safeUser } = user;
  return safeUser;
}

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function findUserByEmail(email) {
  const rows = await query("SELECT * FROM users WHERE email = :email LIMIT 1", { email });
  return rows[0];
}

export async function login(req, res) {
  requireFields(req.body, ["email", "password"]);
  const user = await findUserByEmail(req.body.email);
  if (!user || !user.is_active) throw new AppError("Invalid email or password.", 401);
  const ok = await bcrypt.compare(req.body.password, user.password_hash);
  if (!ok) throw new AppError("Invalid email or password.", 401);
  res.json({ token: sign(user), user: publicUser(user) });
}

export async function register(req, res) {
  requireFields(req.body, ["name", "email", "password", "role"]);
  if (!["student", "company", "tpo"].includes(req.body.role)) throw new AppError("Choose a valid role.", 400);
  const existing = await findUserByEmail(req.body.email);
  if (existing) throw new AppError("An account with this email already exists.", 409);

  const password_hash = await bcrypt.hash(req.body.password, env.bcryptRounds);
  const user = await transaction(async (connection) => {
    let student_id = null;
    let company_id = null;

    if (req.body.role === "student") {
      const [result] = await connection.execute(
        `INSERT INTO students (full_name, email, college, graduation_year, placement_status)
         VALUES (:full_name, :email, 'Gurugram University', 2027, 'PROFILE_PENDING')`,
        { full_name: req.body.name, email: req.body.email }
      );
      student_id = result.insertId;
    }

    if (req.body.role === "company") {
      const [result] = await connection.execute(
        `INSERT INTO companies (name, email, logo, verified)
         VALUES (:name, :email, :logo, FALSE)`,
        { name: req.body.name, email: req.body.email, logo: req.body.name.slice(0, 2).toUpperCase() }
      );
      company_id = result.insertId;
    }

    const { sql, params } = insertSql("users", {
      name: req.body.name,
      email: req.body.email,
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
  const payload = pick(req.body, ["name", "email"]);
  if (!Object.keys(payload).length) return res.json(publicUser(req.user));
  await query(
    `UPDATE users SET ${Object.keys(payload).map((key) => `${key} = :${key}`).join(", ")} WHERE id = :id`,
    { ...payload, id: req.user.id }
  );
  const rows = await query("SELECT id, name, email, role, student_id, company_id, is_active FROM users WHERE id = :id", { id: req.user.id });
  res.json(publicUser(rows[0]));
}

export async function forgotPassword(req, res) {
  requireFields(req.body, ["email"]);
  res.json({ message: `Password reset instructions were sent to ${req.body.email}.` });
}

export async function logout(_req, res) {
  res.json({ ok: true });
}
