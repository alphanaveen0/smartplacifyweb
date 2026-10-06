import { apiClient, toQueryString, USE_MOCKS } from "./apiClient.js";
import {
  addNotification,
  calculateEligibility,
  delay,
  enrichApplication,
  filterRows,
  loadDb,
  nextId,
  paginateRows,
  saveDb,
  searchRows,
  sortRows
} from "./mockData.js";

const searchKeys = ["student_name", "student_roll_no", "student_branch", "job_title", "company_name", "status", "salary_package"];

export const applicationService = {
  async list(query = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/applications${toQueryString(query)}`);
    }

    const db = loadDb();
    let rows = db.applications.map((application) => enrichApplication(application, db));

    if (query.studentId) {
      rows = rows.filter((application) => Number(application.student_id) === Number(query.studentId));
    }

    if (query.companyId) {
      rows = rows.filter((application) => Number(application.company_id) === Number(query.companyId));
    }

    const searched = searchRows(rows, query.search, searchKeys);
    const filtered = filterRows(searched, query.filters);
    const sorted = sortRows(filtered, query.sortKey, query.sortDir);
    return delay(paginateRows(sorted, query.page, query.pageSize));
  },

  async all() {
    if (!USE_MOCKS) return apiClient("/applications");
    const db = loadDb();
    return delay(db.applications.map((application) => enrichApplication(application, db)));
  },

  async apply(studentId, jobId) {
    if (!USE_MOCKS) {
      return apiClient("/applications", { method: "POST", body: { student_id: studentId, job_id: jobId } });
    }

    const db = loadDb();
    const student = db.students.find((row) => row.id === Number(studentId));
    const job = db.jobs.find((row) => row.id === Number(jobId));

    if (!student || !job) throw new Error("Student or job not found.");
    if (job.status !== "ACTIVE") throw new Error("This job is not accepting applications.");
    if (db.applications.some((application) => application.student_id === student.id && application.job_id === job.id)) {
      throw new Error("Application already submitted for this job.");
    }

    const eligibility = calculateEligibility(student, job);

    if (!eligibility.eligible) {
      throw new Error("Student does not meet the eligibility criteria.");
    }

    const application = {
      id: nextId(db.applications),
      student_id: student.id,
      job_id: job.id,
      status: "APPLIED",
      eligibility_score: eligibility.score,
      applied_at: new Date().toISOString().slice(0, 10),
      result: "",
      package_offered: ""
    };

    db.applications = [application, ...db.applications];
    saveDb(db);
    addNotification({
      role: "student",
      title: "Application submitted",
      message: `Your application for ${job.title} was submitted successfully.`,
      type: "Application"
    });

    return delay(enrichApplication(application, loadDb()));
  },

  async updateStatus(id, status, payload = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/applications/${id}`, { method: "PUT", body: { status, ...payload } });
    }

    const db = loadDb();
    let updated;
    db.applications = db.applications.map((application) => {
      if (application.id !== Number(id)) return application;
      updated = {
        ...application,
        status,
        result: payload.result || application.result,
        package_offered: payload.package_offered || application.package_offered
      };
      return updated;
    });

    if (!updated) throw new Error("Application not found.");

    saveDb(db);
    const enriched = enrichApplication(updated, loadDb());
    addNotification({
      role: "student",
      title: `Application ${status.toLowerCase()}`,
      message: `${enriched.company_name} marked ${enriched.job_title} as ${status}.`,
      type: "Application"
    });
    return delay(enriched);
  }
};
