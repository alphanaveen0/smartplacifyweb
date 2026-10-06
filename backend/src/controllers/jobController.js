import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { shapeList } from "../utils/apiFeatures.js";
import { calculateEligibility } from "../utils/eligibility.js";
import { pick, requireFields } from "../utils/validators.js";
import { insertSql, jobColumns, updateSql } from "../models/common.js";

const searchKeys = ["title", "description", "location", "job_type", "salary_package", "eligible_branches", "status", "company_name"];

async function allJobs() {
  return query(
    `SELECT j.*, c.name AS company_name
     FROM jobs j
     JOIN companies c ON c.id = j.company_id
     ORDER BY j.id DESC`
  );
}

async function allStudents() {
  return query("SELECT * FROM students ORDER BY id DESC");
}

async function allApplications() {
  return query("SELECT * FROM applications ORDER BY id DESC");
}

function scopeJobs(user, rows) {
  if (user.role === "company") return rows.filter((row) => Number(row.company_id) === Number(user.company_id));
  if (user.role === "student") return rows.filter((row) => row.status === "ACTIVE");
  return rows;
}

function canManageJob(user, job) {
  return user.role === "tpo" || (user.role === "company" && Number(user.company_id) === Number(job.company_id));
}

function applicationStatusFor(jobId, studentId, applications) {
  return applications.find((application) =>
    Number(application.job_id) === Number(jobId) && Number(application.student_id) === Number(studentId)
  )?.status || "NOT_APPLIED";
}

function buildEligibilitySummary(job, students, applications) {
  const rows = students.map((student) => {
    const eligibility = calculateEligibility(student, job);
    return {
      id: `${job.id}-${student.id}`,
      student_id: student.id,
      student_roll_no: student.college_roll_no || "",
      student_name: student.full_name,
      department: student.branch,
      cgpa: Number(student.cgpa),
      batch: student.graduation_year,
      backlogs: student.backlogs,
      eligibility,
      eligibility_status: eligibility.eligible ? "ELIGIBLE" : "NOT_ELIGIBLE",
      application_status: applicationStatusFor(job.id, student.id, applications)
    };
  });

  return {
    job,
    total: rows.length,
    eligible: rows.filter((row) => row.eligibility.eligible).length,
    notEligible: rows.filter((row) => !row.eligibility.eligible).length,
    applied: rows.filter((row) => row.application_status !== "NOT_APPLIED").length,
    students: rows
  };
}

export async function listJobs(req, res) {
  let rows = scopeJobs(req.user, await allJobs());
  if (req.query.companyId) rows = rows.filter((row) => Number(row.company_id) === Number(req.query.companyId));
  if (req.query.activeOnly) rows = rows.filter((row) => row.status === "ACTIVE");

  if (req.user.role === "student" || req.query.studentId) {
    const studentId = req.user.role === "student" ? req.user.student_id : req.query.studentId;
    const [student] = await query("SELECT * FROM students WHERE id = :id", { id: studentId });
    const applications = await allApplications();
    if (student) {
      rows = rows.map((job) => {
        const eligibility = calculateEligibility(student, job);
        return {
          ...job,
          eligibility,
          eligibility_status: eligibility.eligible ? "ELIGIBLE" : "NOT_ELIGIBLE",
          application_status: applicationStatusFor(job.id, student.id, applications)
        };
      });
    }
  }

  if (req.query.includeEligibilitySummary && req.user.role !== "student") {
    const [students, applications] = await Promise.all([allStudents(), allApplications()]);
    rows = rows.map((job) => ({ ...job, eligibility_summary: buildEligibilitySummary(job, students, applications) }));
  }

  res.json(req.query.page || req.query.search || req.query.filters ? shapeList(rows, req.query, searchKeys) : rows);
}

export async function getJob(req, res) {
  const rows = await allJobs();
  const job = scopeJobs(req.user, rows).find((row) => Number(row.id) === Number(req.params.id));
  if (!job) throw new AppError("Job not found.", 404);
  res.json(job);
}

export async function createJob(req, res) {
  requireFields(req.body, ["title", "description", "company_id"]);
  const payload = pick(req.body, jobColumns);
  if (req.user.role === "company") payload.company_id = req.user.company_id;
  if (req.user.role !== "tpo" && req.user.role !== "company") throw new AppError("Forbidden.", 403);
  const { sql, params } = insertSql("jobs", payload);
  const result = await query(sql, params);
  const rows = await allJobs();
  res.status(201).json(rows.find((row) => Number(row.id) === Number(result.insertId)));
}

export async function updateJob(req, res) {
  const current = (await query("SELECT * FROM jobs WHERE id = :id", { id: req.params.id }))[0];
  if (!current) throw new AppError("Job not found.", 404);
  if (!canManageJob(req.user, current)) throw new AppError("Forbidden.", 403);
  const payload = pick(req.body, jobColumns);
  if (req.user.role === "company") payload.company_id = req.user.company_id;
  if (!Object.keys(payload).length) {
    const rows = await allJobs();
    return res.json(rows.find((row) => Number(row.id) === Number(req.params.id)));
  }
  const { sql, params } = updateSql("jobs", payload, req.params.id);
  await query(sql, params);
  const rows = await allJobs();
  res.json(rows.find((row) => Number(row.id) === Number(req.params.id)));
}

export async function deleteJob(req, res) {
  const current = (await query("SELECT * FROM jobs WHERE id = :id", { id: req.params.id }))[0];
  if (!current) throw new AppError("Job not found.", 404);
  if (!canManageJob(req.user, current)) throw new AppError("Forbidden.", 403);
  await query("DELETE FROM jobs WHERE id = :id", { id: req.params.id });
  res.json({ ok: true });
}

export async function checkEligibility(req, res) {
  if (req.user.role === "student" && Number(req.user.student_id) !== Number(req.params.studentId)) {
    throw new AppError("Forbidden.", 403);
  }
  const [job] = await query("SELECT * FROM jobs WHERE id = :id", { id: req.params.jobId });
  const [student] = await query("SELECT * FROM students WHERE id = :id", { id: req.params.studentId });
  if (!job || !student) throw new AppError("Student or job not found.", 404);
  res.json(calculateEligibility(student, job));
}

export async function eligibilitySummary(req, res) {
  const rows = await allJobs();
  const job = rows.find((row) => Number(row.id) === Number(req.params.jobId));
  if (!job) throw new AppError("Job not found.", 404);
  if (req.user.role === "student") throw new AppError("Forbidden.", 403);
  if (req.user.role === "company" && Number(req.user.company_id) !== Number(job.company_id)) throw new AppError("Forbidden.", 403);
  const [students, applications] = await Promise.all([allStudents(), allApplications()]);
  res.json(buildEligibilitySummary(job, students, applications));
}
