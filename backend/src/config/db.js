import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

export const pool = new Pool(env.db);

function prepare(sql, params = {}) {
  if (!params || Array.isArray(params)) {
    return { text: sql, values: params || [] };
  }

  const names = new Map();
  const values = [];
  const text = sql.replace(/(^|[^:]):([a-zA-Z_][a-zA-Z0-9_]*)/g, (match, prefix, name) => {
    if (!names.has(name)) {
      values.push(params[name]);
      names.set(name, values.length);
    }
    return `${prefix}$${names.get(name)}`;
  });

  return { text, values };
}

function normalizeResult(result) {
  const rows = result.rows || [];
  rows.affectedRows = result.rowCount || 0;
  if (rows[0]?.id !== undefined) {
    rows.insertId = rows[0].id;
  }
  return rows;
}

export async function query(sql, params = {}) {
  const { text, values } = prepare(sql, params);
  const result = await pool.query(text, values);
  return normalizeResult(result);
}

export async function transaction(callback) {
  const client = await pool.connect();
  const connection = {
    async execute(sql, params = {}) {
      const { text, values } = prepare(sql, params);
      const result = await client.query(text, values);
      return [normalizeResult(result)];
    },
    async query(sql, params = {}) {
      const { text, values } = prepare(sql, params);
      const result = await client.query(text, values);
      return normalizeResult(result);
    }
  };

  try {
    await client.query("BEGIN");
    const result = await callback(connection);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
