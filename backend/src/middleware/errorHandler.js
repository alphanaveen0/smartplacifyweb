import { AppError } from "../utils/AppError.js";

export function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    message: statusCode === 500 ? "Internal server error." : error.message
  };

  if (error.details) payload.details = error.details;
  if (process.env.NODE_ENV !== "production" && statusCode === 500) {
    payload.error = error.message;
  }

  res.status(statusCode).json(payload);
}
