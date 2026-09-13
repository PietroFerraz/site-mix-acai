import { count, sql } from "drizzle-orm";
import { db } from "@/db";
import { ensureSchema } from "@/db/bootstrap";
import {
  categories,
  menuItemVariants,
  menuItems,
  promotions,
  restaurants,
} from "@/db/schema";

const SEED_LOCK_KEY = 72610001;

let inflight: Promise<void> | null = null;

/**
 * Guarantees the database has the MIX RL restaurant, categories and items.
 * Idempotent and safe to call concurrently: uses an advisory lock and only
 * inserts when the restaurants table is empty.
 */
export function ensureSeeded(): Promise<void> {
  if (!inflight) {
    inflight = runSeed().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

const SIZES = [
  { name: "300ml", price: "15.00" },
  { name: "500ml", price: "18.00" },
];

const FLAVORS = [
  {
    name: "Açaí Maracujá",
    description:
      "Açaí cremoso batido na hora com maracujá, direto na garrafa. Geladinho e pronto pra beber.",
    imageUrl: "/images/acai-maracuja.webp",
  },
  {
    name: "Açaí Ninho",
    description: "Açaí cremoso com leite Ninho: doce na medida certa e super cremoso.",
    imageUrl: "/images/acai-ninho.webp",
  },
  {
    name: "Açaí Morango",
    description: "Açaí cremoso batido com morango fresquinho. Clássico que nunca falha.",
    imageUrl: "/images/acai-morango.webp",
  },
  {
    name: "Açaí Amendoim",
    description: "Açaí cremoso com amendoim crocante. O favorito de quem gosta de textura.",
    imageUrl: "/images/acai-amendoim.webp",
  },
];

async function runSeed() {
  // A fresh database creates its own tables before the seed runs.
  await ensureSchema();

  await db.transaction(async (tx) => {
    await tx.execute(sql.raw(`select pg_advisory_xact_lock(${SEED_LOCK_KEY})`));

    const [row] = await tx.select({ value: count() }).from(restaurants);
    if (Number(row?.value ?? 0) > 0) return;

    const [restaurant] = await tx
      .insert(restaurants)
      .values({
        name: "MIX RL",
        slug: "mix-rl",
        tagline: "Açaí na garrafa 🍇 Bateu vontade? Pede Mix!",
        coverImage: "/images/capa.webp",
        logoImage: "/images/logo.webp",
        facebookUrl: null,
        instagramUrl: null,
        whatsapp: "5582987453666",
        address: "Rio Largo – AL",
        openingHours: null,
        currency: "BRL",
        locale: "pt-BR",
        isOpen: true,
        deliveryFee: "0.00",
      })
      .returning();

    await tx.insert(promotions).values({
      restaurantId: restaurant.id,
      badge: "MIX",
      title: "Bateu vontade? Pede Mix!",
      description: "Açaí na garrafa geladinho, 300ml ou 500ml, com entrega em Rio Largo.",
      isActive: false,
      sortOrder: 0,
    });

    const [category] = await tx
      .insert(categories)
      .values({
        restaurantId: restaurant.id,
        name: "Açaí na Garrafa Tradicional",
        slug: "acai-na-garrafa-tradicional",
        sortOrder: 0,
      })
      .returning();

    for (const [index, flavor] of FLAVORS.entries()) {
      const [item] = await tx
        .insert(menuItems)
        .values({
          categoryId: category.id,
          name: flavor.name,
          description: flavor.description,
          price: SIZES[0].price,
          originalPrice: null,
          imageUrl: flavor.imageUrl,
          isAvailable: true,
          isFeatured: index === 0,
          sortOrder: index,
        })
        .returning();

      await tx.insert(menuItemVariants).values(
        SIZES.map((size, sizeIndex) => ({
          itemId: item.id,
          name: size.name,
          price: size.price,
          sortOrder: sizeIndex,
        })),
      );
    }
  });
}
