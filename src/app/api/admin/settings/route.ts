import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { promotions, restaurants } from "@/db/schema";
import {
  jsonError,
  optionalBoolean,
  optionalNumber,
  optionalString,
  parseBody,
  requiredString,
} from "@/lib/api";
import { normalizeWhatsapp, toMoneyString } from "@/lib/format";
import { getRestaurant, toPromotionDTO, toRestaurantDTO } from "@/lib/menu";

export const dynamic = "force-dynamic";

type SettingsPayload = {
  restaurant?: {
    name?: string;
    tagline?: string | null;
    coverImage?: string | null;
    logoImage?: string | null;
    facebookUrl?: string | null;
    instagramUrl?: string | null;
    whatsapp?: string | null;
    address?: string | null;
    openingHours?: string | null;
    currency?: string;
    locale?: string;
    isOpen?: boolean;
    deliveryFee?: number | string;
  };
  promotion?: {
    badge?: string;
    title?: string;
    description?: string | null;
    isActive?: boolean;
  };
};

export async function PUT(request: Request) {
  const body = await parseBody<SettingsPayload>(request);
  if (!body) return jsonError("Dados inválidos");

  try {
    const restaurant = await getRestaurant();
    if (!restaurant) return jsonError("Restaurante não encontrado", 404);

    if (body.restaurant) {
      const input = body.restaurant;
      const updates: Partial<typeof restaurants.$inferInsert> = {};

      if (input.name !== undefined) {
        const name = requiredString(input.name, 80);
        if (name.length < 2) return jsonError("Informe o nome do restaurante.");
        updates.name = name;
      }
      if (input.tagline !== undefined) updates.tagline = optionalString(input.tagline, 160);
      if (input.coverImage !== undefined) updates.coverImage = optionalString(input.coverImage, 2_500_000);
      if (input.logoImage !== undefined) updates.logoImage = optionalString(input.logoImage, 2_500_000);
      if (input.facebookUrl !== undefined) updates.facebookUrl = optionalString(input.facebookUrl, 300);
      if (input.instagramUrl !== undefined) updates.instagramUrl = optionalString(input.instagramUrl, 300);
      if (input.whatsapp !== undefined) {
        const raw = String(input.whatsapp ?? "");
        if (!raw.trim()) {
          updates.whatsapp = null;
        } else {
          // Always store the full international number so wa.me links keep working.
          const normalized = normalizeWhatsapp(raw);
          if (!normalized) {
            return jsonError(
              "WhatsApp inválido. Use DDD + número, ex.: 82 98745-3666 (o 55 é adicionado automaticamente).",
            );
          }
          updates.whatsapp = normalized;
        }
      }
      if (input.address !== undefined) updates.address = optionalString(input.address, 300);
      if (input.openingHours !== undefined) updates.openingHours = optionalString(input.openingHours, 160);
      if (input.currency !== undefined) {
        const currency = requiredString(input.currency, 3).toUpperCase();
        if (currency.length !== 3) return jsonError("Moeda inválida (use o código ISO, ex.: BRL).");
        updates.currency = currency;
      }
      if (input.locale !== undefined) {
        const locale = requiredString(input.locale, 10);
        if (locale.length < 2) return jsonError("Locale inválido (ex.: pt-BR).");
        updates.locale = locale;
      }
      const isOpen = optionalBoolean(input.isOpen);
      if (isOpen !== null) updates.isOpen = isOpen;
      if (input.deliveryFee !== undefined) {
        const fee = optionalNumber(input.deliveryFee) ?? 0;
        if (fee < 0) return jsonError("Taxa de entrega inválida.");
        updates.deliveryFee = toMoneyString(fee);
      }

      if (Object.keys(updates).length) {
        await db.update(restaurants).set(updates).where(eq(restaurants.id, restaurant.id));
      }
    }

    if (body.promotion) {
      const input = body.promotion;
      const [existing] = await db
        .select()
        .from(promotions)
        .where(eq(promotions.restaurantId, restaurant.id))
        .orderBy(asc(promotions.sortOrder), asc(promotions.id))
        .limit(1);

      const badge = input.badge !== undefined ? requiredString(input.badge, 20) : existing?.badge ?? "";
      const title = input.title !== undefined ? requiredString(input.title, 80) : existing?.title ?? "";
      const description =
        input.description !== undefined
          ? optionalString(input.description, 200)
          : (existing?.description ?? null);
      const isActive = optionalBoolean(input.isActive) ?? existing?.isActive ?? true;

      if (existing) {
        await db
          .update(promotions)
          .set({ badge, title, description, isActive })
          .where(eq(promotions.id, existing.id));
      } else if (badge.length && title.length) {
        await db.insert(promotions).values({
          restaurantId: restaurant.id,
          badge,
          title,
          description,
          isActive,
          sortOrder: 0,
        });
      }
    }

    const [fresh] = await db.select().from(restaurants).where(eq(restaurants.id, restaurant.id)).limit(1);
    const promotionRows = await db
      .select()
      .from(promotions)
      .where(eq(promotions.restaurantId, restaurant.id))
      .orderBy(asc(promotions.sortOrder), asc(promotions.id));

    return Response.json({
      restaurant: toRestaurantDTO(fresh),
      promotions: promotionRows.map(toPromotionDTO),
    });
  } catch (error) {
    console.error("PUT /api/admin/settings failed", error);
    return jsonError("Erro ao salvar configurações", 500);
  }
}
