import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { jsonError, optionalBoolean, parseBody, requiredString } from "@/lib/api";
import { slugify } from "@/lib/format";
import { getRestaurant, toCategoryDTO } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await parseBody<{ name?: string; isActive?: boolean }>(request);
  if (!body) return jsonError("Dados inválidos");

  const name = requiredString(body.name, 80);
  if (name.length < 2) return jsonError("Informe o nome da categoria.");

  try {
    const restaurant = await getRestaurant();
    if (!restaurant) return jsonError("Restaurante não encontrado", 404);

    const baseSlug = slugify(name) || "categoria";
    let slug = baseSlug;
    let attempt = 2;
    while (true) {
      const [conflict] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.restaurantId, restaurant.id), eq(categories.slug, slug)))
        .limit(1);
      if (!conflict) break;
      slug = `${baseSlug}-${attempt++}`;
    }

    const [{ value: maxOrder }] = await db
      .select({ value: max(categories.sortOrder) })
      .from(categories)
      .where(eq(categories.restaurantId, restaurant.id));

    const [created] = await db
      .insert(categories)
      .values({
        restaurantId: restaurant.id,
        name,
        slug,
        sortOrder: (maxOrder ?? -1) + 1,
        isActive: optionalBoolean(body.isActive) ?? true,
      })
      .returning();

    return Response.json({ category: toCategoryDTO(created, []) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/categories failed", error);
    return jsonError("Erro ao criar categoria", 500);
  }
}
