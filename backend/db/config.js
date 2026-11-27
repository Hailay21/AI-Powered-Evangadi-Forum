import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const backendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(backendRoot, '.env'), override: true });

// Database connection pool
export const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'evangadi_forum',
  port: Number(process.env.DB_PORT) || 3306,
});

const ensureParams = params => {
  if (params === undefined || params === null) {
    throw new Error('SQL parameters are required');
  }
  const isArray = Array.isArray(params);
  const isObject = !isArray && typeof params === 'object';
  if (!isArray && !isObject) {
    throw new Error('SQL parameters must be an array or object');
  }
};

export const safeExecute = async (sql, params) => {
  if (typeof sql !== 'string' || sql.trim().length === 0) {
    throw new Error('SQL query must be a non-empty string');
  }
  ensureParams(params);
  const [result] = await db.execute(sql, params);
  return result;
};
