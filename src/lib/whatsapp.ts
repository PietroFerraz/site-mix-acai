import { formatMoney, normalizeWhatsapp, onlyDigits } from "@/lib/format";
import {
  FULFILLMENT_OPTIONS,
  PAYMENT_OPTIONS,
  labelFor,
  orderItemLabel,
  type OrderDTO,
  type RestaurantDTO,
} from "@/lib/types";

export function buildOrderMessage(
  restaurant: RestaurantDTO,
  order: OrderDTO,
  trackingUrl?: string,
): string {
  const money = (value: number) => formatMoney(value, restaurant.currency, restaurant.locale);
  const lines: string[] = [];

  lines.push(`*Novo pedido #${order.id} – ${restaurant.name}*`);
  lines.push("");
  lines.push(`👤 ${order.customerName}`);
  lines.push(`📞 ${order.customerPhone}`);
  lines.push(
    `${order.fulfillment === "delivery" ? "🛵" : "🏪"} ${labelFor(FULFILLMENT_OPTIONS, order.fulfillment)}${
      order.fulfillment === "delivery" && order.address ? `: ${order.address}` : ""
    }`,
  );
  lines.push(`💳 ${labelFor(PAYMENT_OPTIONS, order.paymentMethod)}`);
  lines.push("");
  lines.push("*Itens:*");
  for (const item of order.items) {
    lines.push(
      `• ${item.quantity}x ${orderItemLabel(item)} — ${money(item.unitPrice * item.quantity)}`,
    );
    if (item.notes) lines.push(`   _Obs: ${item.notes}_`);
  }
  lines.push("");
  lines.push(`Subtotal: ${money(order.subtotal)}`);
  if (order.deliveryFee > 0) lines.push(`Taxa de entrega: ${money(order.deliveryFee)}`);
  lines.push(`*Total: ${money(order.total)}*`);
  if (order.notes) {
    lines.push("");
    lines.push(`📝 ${order.notes}`);
  }
  if (trackingUrl) {
    lines.push("");
    lines.push(`Acompanhe: ${trackingUrl}`);
  }
  return lines.join("\n");
}

export function greetingMessage(restaurant: RestaurantDTO): string {
  return `Olá! Vi o cardápio da *${restaurant.name}* e quero fazer um pedido 🙂`;
}

export type CartMessageInfo = {
  customerName?: string;
  customerPhone?: string;
  fulfillment?: string;
  address?: string;
  paymentMethod?: string;
  notes?: string;
  deliveryFee?: number;
};

/**
 * Turns the current cart into a readable order text for WhatsApp, listing every
 * chosen product with its size, quantity and subtotal.
 */
export function buildCartMessage(
  restaurant: RestaurantDTO,
  lines: { name: string; variantName: string | null; quantity: number; price: number; notes?: string }[],
  info: CartMessageInfo = {},
): string {
  const money = (value: number) => formatMoney(value, restaurant.currency, restaurant.locale);
  const out: string[] = [];

  out.push(`*🛒 Meu pedido – ${restaurant.name}*`);
  out.push("");

  lines.forEach((line, index) => {
    const label = line.variantName ? `${line.name} (${line.variantName})` : line.name;
    out.push(`*${index + 1}.* ${line.quantity}x ${label}`);
    out.push(`     ${money(line.price * line.quantity)}`);
    if (line.notes) out.push(`     _Obs: ${line.notes}_`);
  });

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const fee = info.deliveryFee ?? 0;

  out.push("");
  out.push("------------------------------");
  out.push(`Subtotal: ${money(subtotal)}`);
  if (fee > 0) out.push(`Taxa de entrega: ${money(fee)}`);
  out.push(`*Total: ${money(subtotal + fee)}*`);

  if (info.customerName) {
    out.push("");
    out.push(`👤 ${info.customerName}`);
  }
  if (info.customerPhone) out.push(`📞 ${info.customerPhone}`);
  if (info.fulfillment) {
    out.push(
      `${info.fulfillment === "delivery" ? "🛵 Entrega" : "🏪 Retirada"}${
        info.address ? `: ${info.address}` : ""
      }`,
    );
  }
  if (info.paymentMethod) out.push(`💳 ${info.paymentMethod}`);
  if (info.notes) {
    out.push("");
    out.push(`📝 ${info.notes}`);
  }

  out.push("");
  out.push("Pode confirmar meu pedido? 🙂");
  return out.join("\n");
}

export function orderReceivedMessage(restaurant: RestaurantDTO, orderId: number): string {
  return `Olá! Acabei de fazer o pedido *#${orderId}* no *${restaurant.name}*. Pode confirmar? 🙂`;
}

/**
 * Builds a valid deep link to WhatsApp.
 * The phone is normalized (adds the 55 country code when it is missing) so a
 * number typed as "(82) 98745-3666" still produces a working wa.me URL.
 */
export function buildWhatsAppUrl(phone: string, message?: string): string {
  const number = normalizeWhatsapp(phone) ?? onlyDigits(phone);
  const base = `https://wa.me/${number}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Same chat, opened through api.whatsapp.com (used as an alternate entry point). */
export function buildWhatsAppApiUrl(phone: string, message?: string): string {
  const number = normalizeWhatsapp(phone) ?? onlyDigits(phone);
  const query = new URLSearchParams({ phone: number });
  if (message) query.set("text", message);
  return `https://api.whatsapp.com/send?${query.toString()}`;
}

/** WhatsApp Web is the most reliable option on desktop browsers. */
export function buildWhatsAppWebUrl(phone: string, message?: string): string {
  const number = normalizeWhatsapp(phone) ?? onlyDigits(phone);
  const query = new URLSearchParams({ phone: number });
  if (message) query.set("text", message);
  return `https://web.whatsapp.com/send?${query.toString()}`;
}

export type WhatsAppOptions = {
  phone: string;
  message?: string;
};

export function buildWhatsAppTargets({ phone, message }: WhatsAppOptions) {
  const encoded = message ? encodeURIComponent(message) : undefined;
  const number = normalizeWhatsapp(phone) ?? onlyDigits(phone);
  return {
    number,
    app: encoded
      ? `https://wa.me/${number}?text=${encoded}`
      : `https://wa.me/${number}`,
    api: encoded
      ? `https://api.whatsapp.com/send?phone=${number}&text=${encoded}`
      : `https://api.whatsapp.com/send?phone=${number}`,
    web: encoded
      ? `https://web.whatsapp.com/send?phone=${number}&text=${encoded}`
      : `https://web.whatsapp.com/send?phone=${number}`,
  };
}
