import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required");
}

/**
 * Connection string Neon memuat `sslmode=require`, yang oleh `pg` diperlakukan
 * setara `verify-full` (verifikasi sertifikat terhadap CA sistem). Karena itu
 * kita cukup meneruskan URL apa adanya — tidak perlu menonaktifkan
 * `rejectUnauthorized`.
 */
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
  globalForDb.__arenaNextJsPostgresqlPool ??
  new Pool({
    connectionString: databaseUrl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);
