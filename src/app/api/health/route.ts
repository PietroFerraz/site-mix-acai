import { sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint: tells exactly what is missing on a fresh deployment.
 * Returns `ok: true` only when the database is reachable and the tables exist.
 */
export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        ok: false,
        step: "env",
        message:
          "DATABASE_URL não está configurada. Adicione a variável em Netlify → Site configuration → Environment variables e faça o deploy novamente.",
      },
      { status: 500 },
    );
  }

  try {
    await db.execute(sql`select 1`);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        step: "connection",
        message: "Não foi possível conectar ao banco de dados. Verifique a connection string.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }

  try {
    await ensureSchema();
  } catch (error) {
    return Response.json(
      {
        ok: false,
        step: "schema",
        message: "Conectou ao banco, mas não foi possível criar as tabelas.",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }

  return Response.json({ ok: true });
}
