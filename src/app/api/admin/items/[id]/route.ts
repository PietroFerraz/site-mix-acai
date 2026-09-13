import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, menuItems } from "@/db/schema";
import {
  jsonError,
  optionalBoolean,
  optionalNumber,
  optionalString,
  parseBody,
  parseId,
  requiredString,
} from "@/lib/api";
import { toMoneyString, toNumber } from "@/lib/format";
import { toMenuItemDTO } from "@/lib/menu";
import {
  getVariantsForItems,
  parseVariants,
  syncVariants,
  type VariantInput,
} from "@/lib/variants";
import type { ItemPayload } from "../route";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return jsonError("Item inválido");

  const body = await parseBody<ItemPayload>(request);
  if (!body) return jsonError("Dados inválidos");

  try {
    const [existing] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    if (!existing) return jsonError("Item não encontrado", 404);

    const updates: Partial<typeof menuItems.$inferInsert> = {};

    if (body.name !== undefined) {
      const name = requiredString(body.name, 120);
      if (name.length < 2) return jsonError("Informe o nome do item.");
      updates.name = name;
    }
    if (body.description !== undefined) updates.description = optionalString(body.description, 600);
    if (body.imageUrl !== undefined) updates.imageUrl = optionalString(body.imageUrl, 2_500_000);

    if (body.categoryId !== undefined) {
      const categoryId = Number(body.categoryId);
      if (!Number.isInteger(categoryId) || categoryId <= 0) return jsonError("Categoria inválida.");
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, categoryId))
        .limit(1);
      if (!category) return jsonError("Categoria não encontrada.", 404);
      updates.categoryId = categoryId;
    }

    let variants: VariantInput[] | null = null;
    if (body.variants !== undefined) {
      const parsed = parseVariants(body.variants);
      if (!parsed.ok) return jsonError(parsed.error);
      variants = parsed.variants;
    }

    let nextPrice: number | null;
    if (variants && variants.length) {
      nextPrice = Math.min(...variants.map((variant) => variant.price));
    } else if (body.price !== undefined) {
      nextPrice = optionalNumber(body.price);
    } else {
      nextPrice = toNumber(existing.price);
    }
    if (nextPrice === null || nextPrice < 0) return jsonError("Informe um preço válido.");
    updates.price = toMoneyString(nextPrice);

    if (variants && variants.length) {
      updates.originalPrice = null;
    } else if (body.originalPrice !== undefined) {
      const originalPrice = optionalNumber(body.originalPrice);
      updates.originalPrice =
        originalPrice !== null && originalPrice > nextPrice ? toMoneyString(originalPrice) : null;
    } else if (existing.originalPrice && toNumber(existing.originalPrice) <= nextPrice) {
      updates.originalPrice = null;
    }

    const isAvailable = optionalBoolean(body.isAvailable);
    if (isAvailable !== null) updates.isAvailable = isAvailable;
    const isFeatured = optionalBoolean(body.isFeatured);
    if (isFeatured !== null) updates.isFeatured = isFeatured;
    if (body.sortOrder !== undefined && Number.isFinite(Number(body.sortOrder))) {
      updates.sortOrder = Number(body.sortOrder);
    }

    const [updated] = await db
      .update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, id))
      .returning();

    if (variants) await syncVariants(id, variants);
    const variantRows = await getVariantsForItems([id]);

    return Response.json({ item: toMenuItemDTO(updated, variantRows) });
  } catch (error) {
    console.error("PUT /api/admin/items/[id] failed", error);
    return jsonError("Erro ao atualizar item", 500);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return jsonError("Item inválido");

  try {
    const deleted = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    if (deleted.length === 0) return jsonError("Item não encontrado", 404);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/items/[id] failed", error);
    return jsonError("Erro ao excluir item", 500);
  }
}
