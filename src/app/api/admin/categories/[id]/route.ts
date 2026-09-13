import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { jsonError, optionalBoolean, parseBody, parseId, requiredString } from "@/lib/api";
import { toCategoryDTO } from "@/lib/menu";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return jsonError("Categoria inválida");

  const body = await parseBody<{ name?: string; isActive?: boolean; sortOrder?: number }>(request);
  if (!body) return jsonError("Dados inválidos");

  const updates: Partial<typeof categories.$inferInsert> = {};
  if (body.name !== undefined) {
    const name = requiredString(body.name, 80);
    if (name.length < 2) return jsonError("Informe o nome da categoria.");
    updates.name = name;
  }
  const isActive = optionalBoolean(body.isActive);
  if (isActive !== null) updates.isActive = isActive;
  if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
    updates.sortOrder = Number(body.sortOrder);
  }

  try {
    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    if (!updated) return jsonError("Categoria não encontrada", 404);
    return Response.json({ category: toCategoryDTO(updated, []) });
  } catch (error) {
    console.error("PUT /api/admin/categories/[id] failed", error);
    return jsonError("Erro ao atualizar categoria", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return jsonError("Categoria inválida");

  try {
    const deleted = await db.delete(categories).where(eq(categories.id, id)).returning();
    if (deleted.length === 0) return jsonError("Categoria não encontrada", 404);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/categories/[id] failed", error);
    return jsonError("Erro ao excluir categoria", 500);
  }
}
