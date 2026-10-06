import { apiClient, toQueryString, USE_MOCKS } from "./apiClient.js";
import {
  addNotification,
  delay,
  deleteRow,
  enrichInterview,
  filterRows,
  loadDb,
  paginateRows,
  saveDb,
  searchRows,
  sortRows,
  upsertRow
} from "./mockData.js";

const searchKeys = ["student_name", "job_title", "company_name", "interview_date", "mode", "round_name", "status"];

export const interviewService = {
  async list(query = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/interviews${toQueryString(query)}`);
    }

    const db = loadDb();
    let rows = db.interviews.map((interview) => enrichInterview(interview, db));

    if (query.studentId) {
      rows = rows.filter((interview) => Number(interview.student_id) === Number(query.studentId));
    }

    if (query.companyId) {
      rows = rows.filter((interview) => Number(interview.company_id) === Number(query.companyId));
    }

    const searched = searchRows(rows, query.search, searchKeys);
    const filtered = filterRows(searched, query.filters);
    const sorted = sortRows(filtered, query.sortKey, query.sortDir);
    return delay(paginateRows(sorted, query.page, query.pageSize));
  },

  async save(payload) {
    if (!USE_MOCKS) {
      const method = payload.id ? "PUT" : "POST";
      const path = payload.id ? `/interviews/${payload.id}` : "/interviews";
      return apiClient(path, { method, body: payload });
    }

    const saved = upsertRow("interviews", payload);
    const db = loadDb();

    if (payload.application_id) {
      db.applications = db.applications.map((application) =>
        application.id === Number(payload.application_id)
          ? { ...application, status: payload.status === "COMPLETED" ? application.status : "INTERVIEW_SCHEDULED" }
          : application
      );
      saveDb(db);
    }

    const enriched = enrichInterview(saved, loadDb());
    addNotification({
      role: "student",
      title: "Interview scheduled",
      message: `${enriched.company_name} scheduled ${enriched.round_name || "an interview"} for ${enriched.interview_date}.`,
      type: "Interview"
    });
    return delay(enriched);
  },

  async remove(id) {
    if (!USE_MOCKS) return apiClient(`/interviews/${id}`, { method: "DELETE" });
    deleteRow("interviews", id);
    return delay({ ok: true });
  }
};
