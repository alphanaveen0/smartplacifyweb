import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { shapeList } from "../utils/apiFeatures.js";
import { pick, requireFields, toBoolean } from "../utils/validators.js";
import { companyColumns, insertSql, updateSql } from "../models/common.js";

const searchKeys = ["name", "email", "phone", "website", "industry", "location", "description"];

function canAccessCompany(user, id) {
  return user.role === "tpo" || Number(user.company_id) === Number(id);
}

export async function listCompanies(req, res) {
  let rows = await query("SELECT * FROM companies ORDER BY id DESC");
  if (req.user.role === "company") rows = rows.filter((row) => Number(row.id) === Number(req.user.company_id));
  res.json(req.query.page || req.query.search || req.query.filters ? shapeList(rows, req.query, searchKeys) : rows);
}

export async function getCompany(req, res) {
  if (!canAccessCompany(req.user, req.params.id)) throw new AppError("Forbidden.", 403);
  const rows = await query("SELECT * FROM companies WHERE id = :id", { id: req.params.id });
  if (!rows[0]) throw new AppError("Company not found.", 404);
  res.json(rows[0]);
}

export async function createCompany(req, res) {
  requireFields(req.body, ["name", "email"]);
  const payload = pick(req.body, companyColumns);
  if (payload.verified !== undefined) payload.verified = toBoolean(payload.verified);
  const { sql, params } = insertSql("companies", payload);
  const result = await query(sql, params);
  const rows = await query("SELECT * FROM companies WHERE id = :id", { id: result.insertId });
  res.status(201).json(rows[0]);
}

export async function updateCompany(req, res) {
  if (!canAccessCompany(req.user, req.params.id)) throw new AppError("Forbidden.", 403);
  const payload = pick(req.body, companyColumns);
  if (req.user.role === "company") delete payload.verified;
  if (!Object.keys(payload).length) {
    const rows = await query("SELECT * FROM companies WHERE id = :id", { id: req.params.id });
    if (!rows[0]) throw new AppError("Company not found.", 404);
    return res.json(rows[0]);
  }
  if (payload.verified !== undefined) payload.verified = toBoolean(payload.verified);
  const { sql, params } = updateSql("companies", payload, req.params.id);
  await query(sql, params);
  const rows = await query("SELECT * FROM companies WHERE id = :id", { id: req.params.id });
  res.json(rows[0]);
}

export async function deleteCompany(req, res) {
  await query("DELETE FROM companies WHERE id = :id", { id: req.params.id });
  res.json({ ok: true });
}
