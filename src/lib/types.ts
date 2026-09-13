export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
] as const;

export type OrderStatusValue = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatusValue, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Em preparo",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

export const ORDER_STATUS_STYLES: Record<OrderStatusValue, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-violet-100 text-violet-800",
  ready: "bg-emerald-100 text-emerald-800",
  delivered: "bg-zinc-200 text-zinc-700",
  cancelled: "bg-red-100 text-red-800",
};

export const FULFILLMENT_OPTIONS = [
  { value: "pickup", label: "Retirada" },
  { value: "delivery", label: "Entrega" },
] as const;

export type FulfillmentValue = (typeof FULFILLMENT_OPTIONS)[number]["value"];

export const PAYMENT_OPTIONS = [
  { value: "pix", label: "Pix" },
  { value: "card", label: "Cartão" },
  { value: "cash", label: "Dinheiro" },
] as const;

export type PaymentValue = (typeof PAYMENT_OPTIONS)[number]["value"];

export function labelFor<T extends readonly { value: string; label: string }[]>(
  options: T,
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export type RestaurantDTO = {
  id: number;
  name: string;
  slug: string;
  tagline: string | null;
  coverImage: string | null;
  logoImage: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  whatsapp: string | null;
  address: string | null;
  openingHours: string | null;
  currency: string;
  locale: string;
  isOpen: boolean;
  deliveryFee: number;
};

export type PromotionDTO = {
  id: number;
  badge: string;
  title: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type VariantDTO = {
  id: number;
  name: string;
  price: number;
  sortOrder: number;
};

export type MenuItemDTO = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  imageUrl: string | null;
  isAvailable: boolean;
  isFeatured: boolean;
  sortOrder: number;
  variants: VariantDTO[];
};

/** Lowest price of an item (min variant price, or the base price). */
export function itemStartingPrice(item: Pick<MenuItemDTO, "price" | "variants">): number {
  if (item.variants.length === 0) return item.price;
  return Math.min(...item.variants.map((variant) => variant.price));
}

export type CategoryDTO = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  items: MenuItemDTO[];
};

export type MenuData = {
  restaurant: RestaurantDTO;
  promotions: PromotionDTO[];
  categories: CategoryDTO[];
};

export type CartLine = {
  key: string;
  itemId: number;
  variantId: number | null;
  variantName: string | null;
  name: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  notes: string;
};

export type OrderItemDTO = {
  id: number;
  menuItemId: number | null;
  variantId: number | null;
  variantName: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
};

export function orderItemLabel(item: Pick<OrderItemDTO, "name" | "variantName">): string {
  return item.variantName ? `${item.name} (${item.variantName})` : item.name;
}

export type OrderDTO = {
  id: number;
  customerName: string;
  customerPhone: string;
  fulfillment: string;
  address: string | null;
  paymentMethod: string;
  notes: string | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatusValue;
  createdAt: string;
  items: OrderItemDTO[];
};

export type CreateOrderPayload = {
  customerName: string;
  customerPhone: string;
  fulfillment: FulfillmentValue;
  address?: string;
  paymentMethod: PaymentValue;
  notes?: string;
  items: { itemId: number; variantId?: number | null; quantity: number; notes?: string }[];
};
