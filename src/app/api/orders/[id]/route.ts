import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { jsonError, parseBody, parseId } from "@/lib/api";
import { getOrderById } from "@/lib/menu";
import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return jsonError("Pedido inválido", 400);

  try {
    const order = await getOrderById(id);
    if (!order) return jsonError("Pedido não encontrado", 404);
    return Response.json({ order });
  } catch (error) {
    console.error("GET /api/orders/[id] failed", error);
    return jsonError("Erro ao carregar pedido", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (!id) return jsonError("Pedido inválido", 400);

  const body = await parseBody<{ status?: string }>(request);
  const status = body?.status;
  if (!status || !ORDER_STATUSES.includes(status as OrderStatusValue)) {
    return jsonError("Status inválido");
  }

  try {
    const [updated] = await db
      .update(orders)
      .set({ status: status as OrderStatusValue })
      .where(eq(orders.id, id))
      .returning();
    if (!updated) return jsonError("Pedido não encontrado", 404);
    const order = await getOrderById(id);
    return Response.json({ order });
  } catch (error) {
    console.error("PATCH /api/orders/[id] failed", error);
    return jsonError("Erro ao atualizar pedido", 500);
  }
}
