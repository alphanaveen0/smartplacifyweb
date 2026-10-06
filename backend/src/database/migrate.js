import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "url";
import { env } from "../config/env.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const { database, ...serverConfig } = env.db;
  const server = await mysql.createConnection(serverConfig);
  await server.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await server.end();

  const connection = await mysql.createConnection(env.db);
  const sql = await fs.readFile(path.join(__dirname, "schema.sql"), "utf8");
  for (const statement of sql.split(/;\s*$/m).map((item) => item.trim()).filter(Boolean)) {
    await connection.query(statement);
  }
  const [rollNoColumn] = await connection.query("SHOW COLUMNS FROM students LIKE 'college_roll_no'");
  if (!rollNoColumn.length) {
    await connection.query("ALTER TABLE students ADD COLUMN college_roll_no VARCHAR(80) UNIQUE AFTER email");
    await connection.query("CREATE INDEX idx_students_roll_no ON students (college_roll_no)");
  }
  await connection.end();
  console.log("Database migration completed.");
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
