import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { query } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) throw new AppError("Authentication required.", 401);

    const decoded = jwt.verify(token, env.jwtSecret);
    const rows = await query(
      `SELECT id, name, email, role, student_id, company_id, is_active
       FROM users WHERE id = :id LIMIT 1`,
      { id: decoded.id }
    );
    const user = rows[0];
    if (!user || !user.is_active) throw new AppError("Invalid or expired session.", 401);
    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new AppError("Invalid or expired session.", 401));
  }
}

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError("Authentication required.", 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
}
