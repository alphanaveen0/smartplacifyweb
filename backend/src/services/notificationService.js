import { query } from "../config/db.js";

export async function createNotification({ role = "all", user_id = null, title, message, type = "Announcement" }) {
  await query(
    `INSERT INTO notifications (role, user_id, title, message, type)
     VALUES (:role, :user_id, :title, :message, :type)`,
    { role, user_id, title, message, type }
  );
}
