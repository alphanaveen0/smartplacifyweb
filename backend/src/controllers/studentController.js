import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { shapeList } from "../utils/apiFeatures.js";
import { pick, requireFields } from "../utils/validators.js";
import { insertSql, studentColumns, updateSql } from "../models/common.js";

const searchKeys = ["full_name", "email", "college_roll_no", "phone", "college", "course", "branch", "skills", "placement_status"];

function canAccessStudent(user, id) {
  return user.role === "tpo" || Number(user.student_id) === Number(id);
}

export async function listStudents(req, res) {
  let rows = await query("SELECT * FROM students ORDER BY id DESC");
  if (req.user.role === "student") rows = rows.filter((row) => Number(row.id) === Number(req.user.student_id));
  res.json(req.query.page || req.query.search || req.query.filters ? shapeList(rows, req.query, searchKeys) : rows);
}

export async function getStudent(req, res) {
  if (!canAccessStudent(req.user, req.params.id)) throw new AppError("Forbidden.", 403);
  const rows = await query("SELECT * FROM students WHERE id = :id", { id: req.params.id });
  if (!rows[0]) throw new AppError("Student not found.", 404);
  res.json(rows[0]);
}

export async function createStudent(req, res) {
  requireFields(req.body, ["full_name", "email"]);
  const payload = pick(req.body, studentColumns);
  const { sql, params } = insertSql("students", payload);
  const result = await query(sql, params);
  const rows = await query("SELECT * FROM students WHERE id = :id", { id: result.insertId });
  res.status(201).json(rows[0]);
}

export async function updateStudent(req, res) {
  if (!canAccessStudent(req.user, req.params.id)) throw new AppError("Forbidden.", 403);
  const payload = pick(req.body, studentColumns);
  if (!Object.keys(payload).length) {
    const rows = await query("SELECT * FROM students WHERE id = :id", { id: req.params.id });
    if (!rows[0]) throw new AppError("Student not found.", 404);
    return res.json(rows[0]);
  }
  const { sql, params } = updateSql("students", payload, req.params.id);
  await query(sql, params);
  const rows = await query("SELECT * FROM students WHERE id = :id", { id: req.params.id });
  res.json(rows[0]);
}

export async function deleteStudent(req, res) {
  await query("DELETE FROM students WHERE id = :id", { id: req.params.id });
  res.json({ ok: true });
}

export async function uploadResume(req, res) {
  if (!canAccessStudent(req.user, req.params.id)) throw new AppError("Forbidden.", 403);
  if (!req.file) throw new AppError("Resume file is required.", 400);
  await query(
    `UPDATE students SET resume_name = :resume_name, resume_path = :resume_path, resume_updated_at = CURRENT_DATE WHERE id = :id`,
    { id: req.params.id, resume_name: req.file.originalname, resume_path: req.file.path }
  );
  const rows = await query("SELECT * FROM students WHERE id = :id", { id: req.params.id });
  res.json(rows[0]);
}
