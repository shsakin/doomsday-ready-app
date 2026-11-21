import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });
import * as schema from "./schema.js";

const databaseUrl = process.env.DATABASE_URL
  ?? "postgres://doomsday:doomsday@localhost:5432/doomsday";
const useSsl = (process.env.DATABASE_SSL ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true";

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
