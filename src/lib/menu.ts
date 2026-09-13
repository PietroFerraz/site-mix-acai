import { asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  menuItems,
  orderItems,
  orders,
  promotions,
  restaurants,
  type Category,
  type MenuItem,
  type MenuItemVariant,
  type Order,
  type OrderItem,
  type Promotion,
  type Restaurant,
} from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { toNumber } from "@/lib/format";
import type {
  CategoryDTO,
  MenuData,
  MenuItemDTO,
  OrderDTO,
  OrderItemDTO,
  PromotionDTO,
  RestaurantDTO,
  VariantDTO,
} from "@/lib/types";
import { getVariantsForItems } from "@/lib/variants";

export function toRestaurantDTO(row: Restaurant): RestaurantDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    coverImage: row.coverImage,
    logoImage: row.logoImage,
    facebookUrl: row.facebookUrl,
    instagramUrl: row.instagramUrl,
    whatsapp: row.whatsapp,
    address: row.address,
    openingHours: row.openingHours,
    currency: row.currency,
    locale: row.locale,
    isOpen: row.isOpen,
    deliveryFee: toNumber(row.deliveryFee),
  };
}

export function toPromotionDTO(row: Promotion): PromotionDTO {
  return {
    id: row.id,
    badge: row.badge,
    title: row.title,
    description: row.description,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
  };
}

export function toVariantDTO(row: MenuItemVariant): VariantDTO {
  return {
    id: row.id,
    name: row.name,
    price: toNumber(row.price),
    sortOrder: row.sortOrder,
  };
}

export function toMenuItemDTO(row: MenuItem, variants: MenuItemVariant[] = []): MenuItemDTO {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    description: row.description,
    price: toNumber(row.price),
    originalPrice: row.originalPrice ? toNumber(row.originalPrice) : null,
    imageUrl: row.imageUrl,
    isAvailable: row.isAvailable,
    isFeatured: row.isFeatured,
    sortOrder: row.sortOrder,
    variants: variants.map(toVariantDTO),
  };
}

export function toCategoryDTO(
  row: Category,
  items: MenuItem[],
  variants: MenuItemVariant[] = [],
): CategoryDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    items: items.map((item) =>
      toMenuItemDTO(
        item,
        variants.filter((variant) => variant.itemId === item.id),
      ),
    ),
  };
}

export async function getRestaurant(): Promise<Restaurant | null> {
  await ensureSeeded();
  const [restaurant] = await db
    .select()
    .from(restaurants)
    .orderBy(asc(restaurants.id))
    .limit(1);
  return restaurant ?? null;
}

export async function getMenuData(options?: {
  includeInactive?: boolean;
}): Promise<MenuData | null> {
  const includeInactive = options?.includeInactive ?? false;
  const restaurant = await getRestaurant();
  if (!restaurant) return null;

  const promotionRows = await db
    .select()
    .from(promotions)
    .where(eq(promotions.restaurantId, restaurant.id))
    .orderBy(asc(promotions.sortOrder), asc(promotions.id));

  const categoryRows = await db
    .select()
    .from(categories)
    .where(eq(categories.restaurantId, restaurant.id))
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  const categoryIds = categoryRows.map((category) => category.id);
  const itemRows = categoryIds.length
    ? await db
        .select()
        .from(menuItems)
        .where(inArray(menuItems.categoryId, categoryIds))
        .orderBy(asc(menuItems.sortOrder), asc(menuItems.id))
    : [];

  const variantRows = await getVariantsForItems(itemRows.map((item) => item.id));

  const visibleCategories = includeInactive
    ? categoryRows
    : categoryRows.filter((category) => category.isActive);

  return {
    restaurant: toRestaurantDTO(restaurant),
    promotions: includeInactive
      ? promotionRows.map(toPromotionDTO)
      : promotionRows.filter((promotion) => promotion.isActive).map(toPromotionDTO),
    categories: visibleCategories.map((category) =>
      toCategoryDTO(
        category,
        itemRows.filter((item) => item.categoryId === category.id),
        variantRows,
      ),
    ),
  };
}

function toOrderItemDTO(row: OrderItem): OrderItemDTO {
  return {
    id: row.id,
    menuItemId: row.menuItemId,
    variantId: row.variantId,
    variantName: row.variantName,
    name: row.name,
    quantity: row.quantity,
    unitPrice: toNumber(row.unitPrice),
    notes: row.notes,
  };
}

export function toOrderDTO(row: Order, items: OrderItem[]): OrderDTO {
  return {
    id: row.id,
    customerName: row.customerName,
    customerPhone: row.customerPhone,
    fulfillment: row.fulfillment,
    address: row.address,
    paymentMethod: row.paymentMethod,
    notes: row.notes,
    subtotal: toNumber(row.subtotal),
    deliveryFee: toNumber(row.deliveryFee),
    total: toNumber(row.total),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    items: items.map(toOrderItemDTO),
  };
}

export async function getOrders(limit = 100): Promise<OrderDTO[]> {
  await ensureSeeded();
  const orderRows = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .limit(limit);

  if (orderRows.length === 0) return [];

  const itemRows = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        orderRows.map((order) => order.id),
      ),
    )
    .orderBy(asc(orderItems.id));

  return orderRows.map((order) =>
    toOrderDTO(
      order,
      itemRows.filter((item) => item.orderId === order.id),
    ),
  );
}

export async function getOrderById(id: number): Promise<OrderDTO | null> {
  await ensureSeeded();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id));
  return toOrderDTO(order, items);
}
