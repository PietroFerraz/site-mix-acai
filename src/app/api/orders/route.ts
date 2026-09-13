import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { menuItems, orderItems, orders } from "@/db/schema";
import { jsonError, parseBody } from "@/lib/api";
import { onlyDigits, toMoneyString, toNumber } from "@/lib/format";
import { getOrderById, getOrders, getRestaurant } from "@/lib/menu";
import { PAYMENT_OPTIONS, type CreateOrderPayload } from "@/lib/types";
import { getVariantsForItems } from "@/lib/variants";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getOrders();
    return Response.json({ orders: list });
  } catch (error) {
    console.error("GET /api/orders failed", error);
    return jsonError("Erro ao carregar pedidos", 500);
  }
}

export async function POST(request: Request) {
  const body = await parseBody<Partial<CreateOrderPayload>>(request);
  if (!body) return jsonError("Dados inválidos");

  const customerName = String(body.customerName ?? "").trim().slice(0, 120);
  const customerPhone = String(body.customerPhone ?? "").trim().slice(0, 40);
  const fulfillment = body.fulfillment === "delivery" ? "delivery" : "pickup";
  const paymentMethod = PAYMENT_OPTIONS.some((option) => option.value === body.paymentMethod)
    ? (body.paymentMethod as string)
    : "pix";
  const address = String(body.address ?? "").trim().slice(0, 300);
  const notes = String(body.notes ?? "").trim().slice(0, 500);

  if (customerName.length < 2) return jsonError("Informe seu nome.");
  if (onlyDigits(customerPhone).length < 8) return jsonError("Informe um telefone válido.");
  if (fulfillment === "delivery" && address.length < 5) {
    return jsonError("Informe o endereço de entrega.");
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const lines = rawItems
    .map((line) => {
      const rawVariant = line?.variantId;
      const variantId =
        rawVariant === null || rawVariant === undefined || (rawVariant as unknown) === ""
          ? null
          : Number(rawVariant);
      return {
        itemId: Number(line?.itemId),
        variantId: variantId !== null && Number.isInteger(variantId) && variantId > 0 ? variantId : null,
        quantity: Math.floor(Number(line?.quantity ?? 1)),
        notes: String(line?.notes ?? "").trim().slice(0, 200),
      };
    })
    .filter(
      (line) =>
        Number.isInteger(line.itemId) &&
        line.itemId > 0 &&
        Number.isFinite(line.quantity) &&
        line.quantity > 0,
    )
    .map((line) => ({ ...line, quantity: Math.min(line.quantity, 99) }));

  if (lines.length === 0) return jsonError("Sua sacola está vazia.");

  try {
    const restaurant = await getRestaurant();
    if (!restaurant) return jsonError("Restaurante não encontrado", 404);
    if (!restaurant.isOpen) {
      return jsonError("O restaurante está fechado no momento.", 409);
    }

    const ids = [...new Set(lines.map((line) => line.itemId))];
    const rows = await db.select().from(menuItems).where(inArray(menuItems.id, ids));
    const byId = new Map(rows.map((row) => [row.id, row]));
    const variantRows = await getVariantsForItems(ids);

    const resolved: {
      itemId: number;
      name: string;
      variantId: number | null;
      variantName: string | null;
      unitPrice: string;
      quantity: number;
      notes: string;
    }[] = [];

    for (const line of lines) {
      const item = byId.get(line.itemId);
      if (!item) return jsonError("Um dos itens não existe mais no cardápio.", 409);
      if (!item.isAvailable) return jsonError(`"${item.name}" está esgotado.`, 409);

      const itemVariants = variantRows.filter((variant) => variant.itemId === item.id);
      if (itemVariants.length > 0) {
        const variant = itemVariants.find((candidate) => candidate.id === line.variantId);
        if (!variant) return jsonError(`Escolha o tamanho de "${item.name}".`, 409);
        resolved.push({
          itemId: item.id,
          name: item.name,
          variantId: variant.id,
          variantName: variant.name,
          unitPrice: variant.price,
          quantity: line.quantity,
          notes: line.notes,
        });
      } else {
        resolved.push({
          itemId: item.id,
          name: item.name,
          variantId: null,
          variantName: null,
          unitPrice: item.price,
          quantity: line.quantity,
          notes: line.notes,
        });
      }
    }

    const subtotal = resolved.reduce(
      (sum, line) => sum + toNumber(line.unitPrice) * line.quantity,
      0,
    );
    const deliveryFee = fulfillment === "delivery" ? toNumber(restaurant.deliveryFee) : 0;
    const total = subtotal + deliveryFee;

    const created = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          restaurantId: restaurant.id,
          customerName,
          customerPhone,
          fulfillment,
          address: fulfillment === "delivery" ? address : null,
          paymentMethod,
          notes: notes.length ? notes : null,
          subtotal: toMoneyString(subtotal),
          deliveryFee: toMoneyString(deliveryFee),
          total: toMoneyString(total),
          status: "pending",
        })
        .returning();

      await tx.insert(orderItems).values(
        resolved.map((line) => ({
          orderId: order.id,
          menuItemId: line.itemId,
          variantId: line.variantId,
          variantName: line.variantName,
          name: line.name,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          notes: line.notes.length ? line.notes : null,
        })),
      );

      return order;
    });

    const order = await getOrderById(created.id);
    return Response.json({ order }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders failed", error);
    return jsonError("Não foi possível registrar o pedido. Tente novamente.", 500);
  }
}
