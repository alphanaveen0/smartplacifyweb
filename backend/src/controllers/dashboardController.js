import { AppError } from "../utils/AppError.js";
import { buildDashboard } from "../services/dashboardBuilder.js";

export async function getDashboard(req, res) {
  if (req.params.role !== req.user.role) throw new AppError("Forbidden.", 403);
  res.json(await buildDashboard(req.user));
}
