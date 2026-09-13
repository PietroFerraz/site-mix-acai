import { eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, menuItems } from "@/db/schema";
import {
  jsonError,
  optionalBoolean,
  optionalNumber,
  optionalString,
  parseBody,
  requiredString,
} from "@/lib/api";
import { toMoneyString } from "@/lib/format";
import { toMenuItemDTO } from "@/lib/menu";
import { getVariantsForItems, parseVariants, syncVariants } from "@/lib/variants";

export const dynamic = "force-dynamic";

export type ItemPayload = {
  categoryId?: number;
  name?: string;
  description?: string | null;
  price?: number | string;
  originalPrice?: number | string | null;
  imageUrl?: string | null;
  isAvailable?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  variants?: { id?: number | null; name: string; price: number | string }[];
};

export async function POST(request: Request) {
  const body = await parseBody<ItemPayload>(request);
  if (!body) return jsonError("Dados inválidos");

  const name = requiredString(body.name, 120);
  const categoryId = Number(body.categoryId);
  const parsedVariants = parseVariants(body.variants);
  if (!parsedVariants.ok) return jsonError(parsedVariants.error);
  const variants = parsedVariants.variants;

  let price = optionalNumber(body.price);
  if (variants.length) price = Math.min(...variants.map((variant) => variant.price));
  const originalPrice = variants.length ? null : optionalNumber(body.originalPrice);

  if (name.length < 2) return jsonError("Informe o nome do item.");
  if (!Number.isInteger(categoryId) || categoryId <= 0) return jsonError("Selecione uma categoria.");
  if (price === null || price < 0) return jsonError("Informe um preço válido.");
  if (originalPrice !== null && originalPrice < 0) return jsonError("Preço original inválido.");

  try {
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);
    if (!category) return jsonError("Categoria não encontrada.", 404);

    const [created] = await db
      .insert(menuItems)
      .values({
        categoryId,
        name,
        description: optionalString(body.description, 600),
        price: toMoneyString(price),
        originalPrice:
          originalPrice !== null && originalPrice > price ? toMoneyString(originalPrice) : null,
        imageUrl: optionalString(body.imageUrl, 2_500_000),
        isAvailable: optionalBoolean(body.isAvailable) ?? true,
        isFeatured: optionalBoolean(body.isFeatured) ?? false,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
      })
      .returning();

    if (variants.length) await syncVariants(created.id, variants);
    const variantRows = await getVariantsForItems([created.id]);

    return Response.json({ item: toMenuItemDTO(created, variantRows) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/items failed", error);
    return jsonError("Erro ao criar item", 500);
  }
}
