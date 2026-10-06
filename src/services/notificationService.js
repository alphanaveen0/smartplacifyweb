import { apiClient, toQueryString, USE_MOCKS } from "./apiClient.js";
import { addNotification, delay, loadDb, paginateRows, saveDb, searchRows, sortRows } from "./mockData.js";

const searchKeys = ["title", "message", "type", "created_at"];

function visibleForUser(notification, user) {
  return notification.role === "all" || notification.role === user.role || notification.user_id === user.id;
}

export const notificationService = {
  async list(user, query = {}) {
    if (!USE_MOCKS) {
      return apiClient(`/notifications${toQueryString(query)}`);
    }

    const db = loadDb();
    let rows = db.notifications.filter((notification) => visibleForUser(notification, user));

    if (query.unreadOnly) {
      rows = rows.filter((notification) => !notification.is_read);
    }

    const searched = searchRows(rows, query.search, searchKeys);
    const sorted = sortRows(searched, query.sortKey || "created_at", query.sortDir || "desc");
    return delay(paginateRows(sorted, query.page, query.pageSize));
  },

  async unreadCount(user) {
    const result = await this.list(user, { unreadOnly: true, pageSize: 100 });
    return result.total;
  },

  async markRead(id) {
    if (!USE_MOCKS) return apiClient(`/notifications/${id}/read`, { method: "PUT" });

    const db = loadDb();
    db.notifications = db.notifications.map((notification) =>
      notification.id === Number(id) ? { ...notification, is_read: true } : notification
    );
    saveDb(db);
    return delay({ ok: true });
  },

  async markAllRead(user) {
    if (!USE_MOCKS) return apiClient("/notifications/read-all", { method: "PUT" });

    const db = loadDb();
    db.notifications = db.notifications.map((notification) =>
      visibleForUser(notification, user) ? { ...notification, is_read: true } : notification
    );
    saveDb(db);
    return delay({ ok: true });
  },

  async create(payload) {
    if (!USE_MOCKS) return apiClient("/notifications", { method: "POST", body: payload });
    return delay(addNotification(payload));
  }
};

