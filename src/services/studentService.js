import { apiClient, toQueryString, USE_MOCKS } from "./apiClient.js";
import { delay, deleteRow, filterRows, loadDb, paginateRows, searchRows, sortRows, upsertRow } from "./mockData.js";

const searchKeys = ["full_name", "email", "college_roll_no", "phone", "college", "course", "branch", "skills", "placement_status"];

export const studentService = {
  async list(query = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/students${toQueryString(query)}`);
    }

    const db = loadDb();
    const searched = searchRows(db.students, query.search, searchKeys);
    const filtered = filterRows(searched, query.filters);
    const sorted = sortRows(filtered, query.sortKey, query.sortDir);
    return delay(paginateRows(sorted, query.page, query.pageSize));
  },

  async all() {
    if (!USE_MOCKS) return apiClient("/students");
    return delay(loadDb().students);
  },

  async get(id) {
    if (!USE_MOCKS) return apiClient(`/students/${id}`);
    const student = loadDb().students.find((row) => row.id === Number(id));
    if (!student) throw new Error("Student not found.");
    return delay(student);
  },

  async save(payload) {
    if (!USE_MOCKS) {
      const method = payload.id ? "PUT" : "POST";
      const path = payload.id ? `/students/${payload.id}` : "/students";
      return apiClient(path, { method, body: payload });
    }

    return delay(upsertRow("students", payload));
  },

  async remove(id) {
    if (!USE_MOCKS) return apiClient(`/students/${id}`, { method: "DELETE" });
    deleteRow("students", id);
    return delay({ ok: true });
  },

  async uploadResume(studentId, file) {
    if (!USE_MOCKS) {
      const formData = new FormData();
      formData.append("resume", file);
      return apiClient(`/students/${studentId}/resume`, { method: "POST", body: formData });
    }

    const student = await this.get(studentId);
    return this.save({
      ...student,
      resume_name: file.name,
      resume_updated_at: new Date().toISOString().slice(0, 10)
    });
  }
};
