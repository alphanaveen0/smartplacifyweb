import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { shapeList, today } from "../utils/apiFeatures.js";
import { calculateEligibility } from "../utils/eligibility.js";
import { createNotification } from "../services/notificationService.js";

const searchKeys = ["student_name", "student_roll_no", "student_branch", "job_title", "company_name", "status", "salary_package"];

async function allApplications() {
  return query(
    `SELECT a.*, s.full_name AS student_name, s.college_roll_no AS student_roll_no,
            s.branch AS student_branch, s.resume_name,
            j.title AS job_title, j.salary_package, j.location, j.company_id,
            c.name AS company_name, c.logo AS company_logo
     FROM applications a
     JOIN students s ON s.id = a.student_id
     JOIN jobs j ON j.id = a.job_id
     JOIN companies c ON c.id = j.company_id
     ORDER BY a.id DESC`
  );
}

function scopeApplications(user, rows) {
  if (user.role === "student") return rows.filter((row) => Number(row.student_id) === Number(user.student_id));
  if (user.role === "company") return rows.filter((row) => Number(row.company_id) === Number(user.company_id));
  return rows;
}

export async function listApplications(req, res) {
  let rows = scopeApplications(req.user, await allApplications());
  if (req.query.studentId) rows = rows.filter((row) => Number(row.student_id) === Number(req.query.studentId));
  if (req.query.companyId) rows = rows.filter((row) => Number(row.company_id) === Number(req.query.companyId));
  res.json(req.query.page || req.query.search || req.query.filters ? shapeList(rows, req.query, searchKeys) : rows);
}

export async function createApplication(req, res) {
  const studentId = Number(req.body.student_id);
  const jobId = Number(req.body.job_id);
  if (!studentId || !jobId) throw new AppError("student_id and job_id are required.", 400);
  if (req.user.role === "student" && Number(req.user.student_id) !== studentId) throw new AppError("Forbidden.", 403);

  const [student] = await query("SELECT * FROM students WHERE id = :id", { id: studentId });
  const [job] = await query("SELECT * FROM jobs WHERE id = :id", { id: jobId });
  if (!student || !job) throw new AppError("Student or job not found.", 404);
  if (job.status !== "ACTIVE") throw new AppError("This job is not accepting applications.", 400);
  const eligibility = calculateEligibility(student, job);
  if (!eligibility.eligible) throw new AppError("Student does not meet the eligibility criteria.", 400, eligibility.checks);

  try {
    const result = await query(
      `INSERT INTO applications (student_id, job_id, status, eligibility_score, applied_at)
       VALUES (:student_id, :job_id, 'APPLIED', :eligibility_score, :applied_at)`,
      { student_id: studentId, job_id: jobId, eligibility_score: eligibility.score, applied_at: today() }
    );
    await createNotification({
      role: "student",
      title: "Application submitted",
      message: `Your application for ${job.title} was submitted successfully.`,
      type: "Application"
    });
    const rows = await allApplications();
    res.status(201).json(rows.find((row) => Number(row.id) === Number(result.insertId)));
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") throw new AppError("Application already submitted for this job.", 409);
    throw error;
  }
}

export async function updateApplication(req, res) {
  const rows = await allApplications();
  const application = rows.find((row) => Number(row.id) === Number(req.params.id));
  if (!application) throw new AppError("Application not found.", 404);
  if (req.user.role === "student") throw new AppError("Students cannot update application decisions.", 403);
  if (req.user.role === "company" && Number(req.user.company_id) !== Number(application.company_id)) throw new AppError("Forbidden.", 403);
  const status = req.body.status || application.status;
  await query(
    `UPDATE applications
     SET status = :status, result = :result, package_offered = :package_offered
     WHERE id = :id`,
    {
      id: req.params.id,
      status,
      result: req.body.result ?? application.result,
      package_offered: req.body.package_offered ?? application.package_offered
    }
  );
  await createNotification({
    role: "student",
    title: `Application ${String(status).toLowerCase()}`,
    message: `${application.company_name} marked ${application.job_title} as ${status}.`,
    type: "Application"
  });
  const updated = await allApplications();
  res.json(updated.find((row) => Number(row.id) === Number(req.params.id)));
}
