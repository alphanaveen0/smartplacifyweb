import { AppError } from "./AppError.js";

export function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
  if (missing.length) {
    throw new AppError(`Missing required fields: ${missing.join(", ")}`, 400);
  }
}

export function pick(body, fields) {
  return fields.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = body[field];
    return payload;
  }, {});
}

export function toBoolean(value) {
  return value === true || value === "true" || value === 1 || value === "1";
}
