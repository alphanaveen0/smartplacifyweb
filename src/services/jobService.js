import { apiClient, toQueryString, USE_MOCKS } from "./apiClient.js";
import { calculateEligibility, delay, deleteRow, filterRows, loadDb, paginateRows, searchRows, sortRows, upsertRow } from "./mockData.js";

const searchKeys = ["title", "description", "location", "job_type", "salary_package", "eligible_branches", "status", "company_name"];

function enrichJob(job, db) {
  const company = db.companies.find((row) => row.id === Number(job.company_id));
  return {
    ...job,
    company_name: company?.name || "Unknown company"
  };
}

function applicationStatusFor(jobId, studentId, db) {
  return db.applications.find((application) =>
    Number(application.job_id) === Number(jobId) && Number(application.student_id) === Number(studentId)
  )?.status || "NOT_APPLIED";
}

function withStudentEligibility(job, student, db) {
  if (!student) return job;
  const eligibility = calculateEligibility(student, job);
  return {
    ...job,
    eligibility,
    eligibility_status: eligibility.eligible ? "ELIGIBLE" : "NOT_ELIGIBLE",
    application_status: applicationStatusFor(job.id, student.id, db)
  };
}

function summarizeEligibility(job, db) {
  const rows = db.students.map((student) => {
    const eligibility = calculateEligibility(student, job);
    return {
      id: `${job.id}-${student.id}`,
      student_id: student.id,
      student_roll_no: student.college_roll_no || "",
      student_name: student.full_name,
      department: student.branch,
      cgpa: student.cgpa,
      batch: student.graduation_year,
      backlogs: student.backlogs,
      eligibility,
      eligibility_status: eligibility.eligible ? "ELIGIBLE" : "NOT_ELIGIBLE",
      application_status: applicationStatusFor(job.id, student.id, db)
    };
  });

  return {
    job: enrichJob(job, db),
    total: rows.length,
    eligible: rows.filter((row) => row.eligibility.eligible).length,
    notEligible: rows.filter((row) => !row.eligibility.eligible).length,
    applied: rows.filter((row) => row.application_status !== "NOT_APPLIED").length,
    students: rows
  };
}

export const jobService = {
  async list(query = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/jobs${toQueryString(query)}`);
    }

    const db = loadDb();
    let rows = db.jobs.map((job) => enrichJob(job, db));
    const student = query.studentId ? db.students.find((row) => Number(row.id) === Number(query.studentId)) : null;

    if (query.companyId) {
      rows = rows.filter((job) => Number(job.company_id) === Number(query.companyId));
    }

    if (query.activeOnly) {
      rows = rows.filter((job) => job.status === "ACTIVE");
    }

    if (student) {
      rows = rows.map((job) => withStudentEligibility(job, student, db));
    }

    if (query.includeEligibilitySummary) {
      rows = rows.map((job) => ({ ...job, eligibility_summary: summarizeEligibility(job, db) }));
    }

    const searched = searchRows(rows, query.search, searchKeys);
    const filtered = filterRows(searched, query.filters);
    const sorted = sortRows(filtered, query.sortKey, query.sortDir);
    return delay(paginateRows(sorted, query.page, query.pageSize));
  },

  async all() {
    if (!USE_MOCKS) return apiClient("/jobs");
    const db = loadDb();
    return delay(db.jobs.map((job) => enrichJob(job, db)));
  },

  async get(id) {
    if (!USE_MOCKS) return apiClient(`/jobs/${id}`);
    const db = loadDb();
    const job = db.jobs.find((row) => row.id === Number(id));
    if (!job) throw new Error("Job not found.");
    return delay(enrichJob(job, db));
  },

  async save(payload) {
    if (!USE_MOCKS) {
      const method = payload.id ? "PUT" : "POST";
      const path = payload.id ? `/jobs/${payload.id}` : "/jobs";
      return apiClient(path, { method, body: payload });
    }

    return delay(upsertRow("jobs", payload));
  },

  async remove(id) {
    if (!USE_MOCKS) return apiClient(`/jobs/${id}`, { method: "DELETE" });
    deleteRow("jobs", id);
    return delay({ ok: true });
  },

  async checkEligibility(jobId, studentId) {
    if (!USE_MOCKS) return apiClient(`/jobs/${jobId}/eligibility/${studentId}`);
    const db = loadDb();
    const job = db.jobs.find((row) => row.id === Number(jobId));
    const student = db.students.find((row) => row.id === Number(studentId));

    if (!job || !student) {
      throw new Error("Student or job not found.");
    }

    return delay(calculateEligibility(student, job));
  },

  async eligibilitySummary(jobId) {
    if (!USE_MOCKS) return apiClient(`/jobs/${jobId}/eligibility`);
    const db = loadDb();
    const job = db.jobs.find((row) => row.id === Number(jobId));

    if (!job) {
      throw new Error("Job not found.");
    }

    return delay(summarizeEligibility(job, db));
  }
};
