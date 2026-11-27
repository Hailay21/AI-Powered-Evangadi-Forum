import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.join(__dirname, "..");
dotenv.config({ path: path.join(backendRoot, ".env"), override: true });
const schemaPath = path.join(backendRoot, "db", "schema.sql");

const config = {
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || process.env.DB_PASSWORD || "",
  port: Number(process.env.DB_PORT) || 3306,
};

const database = process.env.DB_NAME || "evangadi_forum";

async function main() {
  const connection = await mysql.createConnection(config);
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.changeUser({ database });

  const sql = fs.readFileSync(schemaPath, "utf8");
  const statements = sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await connection.query(statement);
  }

  await connection.end();
  console.log(`Database "${database}" is ready.`);
}

main().catch((error) => {
  console.error("Failed to set up the database:", error.message);
  console.error(
    "Update DB_USER / DB_PASS / DB_HOST / DB_NAME in backend/.env and run: npm run setup-db",
  );
  process.exit(1);
});
