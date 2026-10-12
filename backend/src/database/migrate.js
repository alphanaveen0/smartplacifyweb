import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../config/db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function splitStatements(sql) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function migrate() {
  const sql = await fs.readFile(path.join(__dirname, "schema.sql"), "utf8");
  for (const statement of splitStatements(sql)) {
    await pool.query(statement);
  }

  await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS college_roll_no VARCHAR(80)");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_students_college_roll_no ON students (college_roll_no)");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(40)");
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS uq_users_phone ON users (phone)");
  await pool.end();
  console.log("Supabase Postgres migration completed.");
}

migrate().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
