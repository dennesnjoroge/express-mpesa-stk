import mysql from "mysql2/promise";

export function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const pool = mysql.createPool({
  host: requireEnv("DB_HOST"),
  port: Number(process.env.DB_PORT ?? 3306),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  database: requireEnv("DB_NAME"),

  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60_000,

  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  timezone: "+00:00",

  ssl: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});
