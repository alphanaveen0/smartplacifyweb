import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";
import { shapeList } from "../utils/apiFeatures.js";
import { requireFields } from "../utils/validators.js";

const searchKeys = ["title", "message", "type", "created_at"];

function visible(user, notification) {
  return notification.role === "all" || notification.role === user.role || Number(notification.user_id) === Number(user.id);
}

export async function listNotifications(req, res) {
  let rows = await query("SELECT * FROM notifications ORDER BY created_at DESC, id DESC");
  rows = rows.filter((notification) => visible(req.user, notification));
  if (req.query.unreadOnly) rows = rows.filter((notification) => !notification.is_read);
  res.json(shapeList(rows, req.query, searchKeys));
}

export async function createNotificationController(req, res) {
  if (req.user.role !== "tpo") throw new AppError("Only TPO/Admin can send notifications.", 403);
  requireFields(req.body, ["role", "type", "title", "message"]);
  const result = await query(
    `INSERT INTO notifications (role, type, title, message, user_id)
     VALUES (:role, :type, :title, :message, :user_id)`,
    {
      role: req.body.role,
      type: req.body.type,
      title: req.body.title,
      message: req.body.message,
      user_id: req.body.user_id || null
    }
  );
  const rows = await query("SELECT * FROM notifications WHERE id = :id", { id: result.insertId });
  res.status(201).json(rows[0]);
}

export async function markRead(req, res) {
  const rows = await query("SELECT * FROM notifications WHERE id = :id", { id: req.params.id });
  if (!rows[0]) throw new AppError("Notification not found.", 404);
  if (!visible(req.user, rows[0])) throw new AppError("Forbidden.", 403);
  await query("UPDATE notifications SET is_read = TRUE WHERE id = :id", { id: req.params.id });
  res.json({ ok: true });
}

export async function markAllRead(req, res) {
  const rows = await query("SELECT * FROM notifications");
  const ids = rows.filter((notification) => visible(req.user, notification)).map((notification) => notification.id);
  if (ids.length) {
    await query(`UPDATE notifications SET is_read = TRUE WHERE id IN (${ids.map((_, index) => `:id${index}`).join(",")})`, Object.fromEntries(ids.map((id, index) => [`id${index}`, id])));
  }
  res.json({ ok: true });
}
