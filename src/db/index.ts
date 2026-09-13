import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * The database client is created lazily.
 *
 * Importing this module must never throw, otherwise `next build` fails on hosts
 * where DATABASE_URL is not present at build time (Netlify, Vercel previews...).
 * The connection is only attempted when a query actually runs, and routes that
 * touch the database are all `force-dynamic`, so nothing connects during the
 * build itself.
 */
const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzle?: ReturnType<typeof drizzle>;
};

function createPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL não está configurada. Adicione a variável de ambiente DATABASE_URL no painel do provedor de hospedagem.",
    );
  }
  return new Pool({
    connectionString: databaseUrl,
    // Keep a small pool: serverless hosts can spawn many concurrent instances.
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = createPool();
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

/**
 * Returns the Drizzle client, creating it on first use.
 * Prefer this in code paths that want an explicit, typed handle.
 */
export function getDb(): ReturnType<typeof drizzle> {
  if (!globalForDb.__arenaNextJsDrizzle) {
    globalForDb.__arenaNextJsDrizzle = drizzle(getPool());
  }
  return globalForDb.__arenaNextJsDrizzle;
}

/**
 * Lazy proxy so `import { db } from "@/db"` keeps working everywhere without
 * connecting at module load time.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, property, receiver) {
    const client = getDb() as unknown as Record<string | symbol, unknown>;
    const value = Reflect.get(client, property, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

export { getPool as pool };
