import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { shapeList } from "../utils/apiFeatures.js";
import { interviewColumns, insertSql, updateSql } from "../models/common.js";
import { pick, requireFields } from "../utils/validators.js";
import { createNotification } from "../services/notificationService.js";
import { getInterviews } from "../services/dashboardBuilder.js";

const searchKeys = ["student_name", "job_title", "company_name", "interview_date", "mode", "round_name", "status"];

function scopeInterviews(user, rows) {
  if (user.role === "student") return rows.filter((row) => Number(row.student_id) === Number(user.student_id));
  if (user.role === "company") return rows.filter((row) => Number(row.company_id) === Number(user.company_id));
  return rows;
}

function canManageInterview(user, interview) {
  return user.role === "tpo" || (user.role === "company" && Number(user.company_id) === Number(interview.company_id));
}

export async function listInterviews(req, res) {
  let rows = scopeInterviews(req.user, await getInterviews());
  if (req.query.studentId) rows = rows.filter((row) => Number(row.student_id) === Number(req.query.studentId));
  if (req.query.companyId) rows = rows.filter((row) => Number(row.company_id) === Number(req.query.companyId));
  res.json(req.query.page || req.query.search || req.query.filters ? shapeList(rows, req.query, searchKeys) : rows);
}

export async function createInterview(req, res) {
  requireFields(req.body, ["application_id", "student_id", "company_id", "job_id", "interview_date", "interview_time"]);
  if (req.user.role === "student") throw new AppError("Students cannot schedule interviews.", 403);
  if (req.user.role === "company" && Number(req.user.company_id) !== Number(req.body.company_id)) throw new AppError("Forbidden.", 403);
  const payload = pick(req.body, interviewColumns);
  const { sql, params } = insertSql("interviews", payload);
  const result = await query(sql, params);
  await query(
    "UPDATE applications SET status = IF(:status = 'COMPLETED', status, 'INTERVIEW_SCHEDULED') WHERE id = :id",
    { id: payload.application_id, status: payload.status || "SCHEDULED" }
  );
  await createNotification({
    role: "student",
    title: "Interview scheduled",
    message: `${payload.round_name || "Interview"} scheduled for ${payload.interview_date}.`,
    type: "Interview"
  });
  const rows = await getInterviews();
  res.status(201).json(rows.find((row) => Number(row.id) === Number(result.insertId)));
}

export async function updateInterview(req, res) {
  const current = (await getInterviews()).find((row) => Number(row.id) === Number(req.params.id));
  if (!current) throw new AppError("Interview not found.", 404);
  if (!canManageInterview(req.user, current)) throw new AppError("Forbidden.", 403);
  const payload = pick(req.body, interviewColumns);
  if (!Object.keys(payload).length) return res.json(current);
  const { sql, params } = updateSql("interviews", payload, req.params.id);
  await query(sql, params);
  const rows = await getInterviews();
  res.json(rows.find((row) => Number(row.id) === Number(req.params.id)));
}

export async function deleteInterview(req, res) {
  const current = (await getInterviews()).find((row) => Number(row.id) === Number(req.params.id));
  if (!current) throw new AppError("Interview not found.", 404);
  if (!canManageInterview(req.user, current)) throw new AppError("Forbidden.", 403);
  await query("DELETE FROM interviews WHERE id = :id", { id: req.params.id });
  res.json({ ok: true });
}
