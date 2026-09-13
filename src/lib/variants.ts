import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { menuItemVariants, type MenuItemVariant } from "@/db/schema";
import { optionalNumber } from "@/lib/api";
import { toMoneyString } from "@/lib/format";

export type VariantInput = { id: number | null; name: string; price: number };

export async function getVariantsForItems(itemIds: number[]): Promise<MenuItemVariant[]> {
  if (itemIds.length === 0) return [];
  return db
    .select()
    .from(menuItemVariants)
    .where(inArray(menuItemVariants.itemId, itemIds))
    .orderBy(asc(menuItemVariants.sortOrder), asc(menuItemVariants.id));
}

export function parseVariants(
  raw: unknown,
): { ok: true; variants: VariantInput[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, variants: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "Tamanhos inválidos." };
  if (raw.length > 10) return { ok: false, error: "Máximo de 10 tamanhos por item." };

  const variants: VariantInput[] = [];
  for (const entry of raw as { id?: unknown; name?: unknown; price?: unknown }[]) {
    const name = String(entry?.name ?? "")
      .trim()
      .slice(0, 40);
    const price = optionalNumber(entry?.price);
    if (!name) return { ok: false, error: "Informe o nome de cada tamanho (ex.: 300ml)." };
    if (price === null || price < 0) {
      return { ok: false, error: `Informe um preço válido para "${name}".` };
    }
    const id = Number(entry?.id);
    variants.push({ id: Number.isInteger(id) && id > 0 ? id : null, name, price });
  }
  return { ok: true, variants };
}

/** Upserts the given variants for an item and removes the ones not present. */
export async function syncVariants(itemId: number, incoming: VariantInput[]): Promise<void> {
  const existing = await db
    .select()
    .from(menuItemVariants)
    .where(eq(menuItemVariants.itemId, itemId));

  const keep = new Set<number>();
  for (const [index, variant] of incoming.entries()) {
    const match = variant.id ? existing.find((row) => row.id === variant.id) : undefined;
    if (match) {
      await db
        .update(menuItemVariants)
        .set({ name: variant.name, price: toMoneyString(variant.price), sortOrder: index })
        .where(eq(menuItemVariants.id, match.id));
      keep.add(match.id);
    } else {
      const [created] = await db
        .insert(menuItemVariants)
        .values({
          itemId,
          name: variant.name,
          price: toMoneyString(variant.price),
          sortOrder: index,
        })
        .returning();
      keep.add(created.id);
    }
  }

  const toDelete = existing.filter((row) => !keep.has(row.id)).map((row) => row.id);
  if (toDelete.length) {
    await db.delete(menuItemVariants).where(inArray(menuItemVariants.id, toDelete));
  }
}
