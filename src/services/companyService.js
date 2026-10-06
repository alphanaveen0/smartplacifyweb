import { apiClient, toQueryString, USE_MOCKS } from "./apiClient.js";
import { delay, deleteRow, filterRows, loadDb, paginateRows, searchRows, sortRows, upsertRow } from "./mockData.js";

const searchKeys = ["name", "email", "phone", "website", "industry", "location", "description"];

export const companyService = {
  async list(query = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/companies${toQueryString(query)}`);
    }

    const db = loadDb();
    const searched = searchRows(db.companies, query.search, searchKeys);
    const filtered = filterRows(searched, query.filters);
    const sorted = sortRows(filtered, query.sortKey, query.sortDir);
    return delay(paginateRows(sorted, query.page, query.pageSize));
  },

  async all() {
    if (!USE_MOCKS) return apiClient("/companies");
    return delay(loadDb().companies);
  },

  async get(id) {
    if (!USE_MOCKS) return apiClient(`/companies/${id}`);
    const company = loadDb().companies.find((row) => row.id === Number(id));
    if (!company) throw new Error("Company not found.");
    return delay(company);
  },

  async save(payload) {
    if (!USE_MOCKS) {
      const method = payload.id ? "PUT" : "POST";
      const path = payload.id ? `/companies/${payload.id}` : "/companies";
      return apiClient(path, { method, body: payload });
    }

    return delay(upsertRow("companies", payload));
  },

  async remove(id) {
    if (!USE_MOCKS) return apiClient(`/companies/${id}`, { method: "DELETE" });
    deleteRow("companies", id);
    return delay({ ok: true });
  },

  async verify(id, verified = true) {
    const company = await this.get(id);
    return this.save({ ...company, verified });
  }
};

