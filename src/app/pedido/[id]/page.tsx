import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { CheckIcon, ChevronLeftIcon, WhatsAppIcon } from "@/components/icons";
import { WhatsAppButton } from "@/components/whatsapp/whatsapp-button";
import { formatDateTime, formatMoney } from "@/lib/format";
import { getMenuData, getOrderById } from "@/lib/menu";
import { orderReceivedMessage } from "@/lib/whatsapp";
import {
  FULFILLMENT_OPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_OPTIONS,
  labelFor,
  orderItemLabel,
  type OrderStatusValue,
} from "@/lib/types";

export const dynamic = "force-dynamic";

const TIMELINE: OrderStatusValue[] = ["pending", "confirmed", "preparing", "ready", "delivered"];

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [order, menu] = await Promise.all([getOrderById(id), getMenuData()]);
  if (!order || !menu) notFound();

  const { restaurant } = menu;
  const money = (value: number) => formatMoney(value, restaurant.currency, restaurant.locale);
  const cancelled = order.status === "cancelled";
  const currentIndex = TIMELINE.indexOf(order.status);

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-surface pb-10">
      <AutoRefresh />
      <header className="flex items-center gap-2 px-3 pt-4">
        <Link
          href="/"
          aria-label="Voltar ao cardápio"
          className="grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-lg font-extrabold">Pedido #{order.id}</h1>
          <p className="text-xs text-zinc-500">
            {restaurant.name} • {formatDateTime(order.createdAt, restaurant.locale)}
          </p>
        </div>
        <span
          className={`ml-auto rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_STYLES[order.status]}`}
        >
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </header>

      <section className="mx-3 mt-4 rounded-2xl bg-white p-4 shadow-sm">
        {cancelled ? (
          <p className="text-sm font-semibold text-red-700">
            Este pedido foi cancelado. Se tiver dúvidas, fale com o restaurante.
          </p>
        ) : (
          <ol className="space-y-3">
            {TIMELINE.map((status, index) => {
              const done = index <= currentIndex;
              const current = index === currentIndex;
              return (
                <li key={status} className="flex items-center gap-3">
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                      done ? "bg-brand text-white" : "bg-zinc-100 text-zinc-400"
                    } ${current ? "ring-4 ring-brand/20" : ""}`}
                  >
                    {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                  </span>
                  <span
                    className={`text-sm ${done ? "font-bold text-zinc-900" : "text-zinc-400"}`}
                  >
                    {status === "delivered" && order.fulfillment === "pickup"
                      ? "Retirado"
                      : ORDER_STATUS_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        <p className="mt-4 text-[11px] text-zinc-400">
          Esta página atualiza automaticamente a cada 15 segundos.
        </p>
      </section>

      <section className="mx-3 mt-3 rounded-2xl bg-white p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-zinc-900">Itens</h2>
        <ul className="mt-2 divide-y divide-zinc-100 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="py-2">
              <div className="flex justify-between">
                <span className="text-zinc-700">
                  {item.quantity}x {orderItemLabel(item)}
                </span>
                <span className="font-semibold">{money(item.unitPrice * item.quantity)}</span>
              </div>
              {item.notes ? <p className="text-[11px] text-zinc-500">Obs: {item.notes}</p> : null}
            </li>
          ))}
        </ul>
        <div className="mt-2 space-y-1 border-t border-zinc-100 pt-2 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>Subtotal</span>
            <span>{money(order.subtotal)}</span>
          </div>
          {order.deliveryFee > 0 ? (
            <div className="flex justify-between text-zinc-500">
              <span>Taxa de entrega</span>
              <span>{money(order.deliveryFee)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-base font-extrabold">
            <span>Total</span>
            <span className="text-brand">{money(order.total)}</span>
          </div>
        </div>
      </section>

      <section className="mx-3 mt-3 rounded-2xl bg-white p-4 text-sm shadow-sm">
        <h2 className="text-sm font-extrabold text-zinc-900">Detalhes</h2>
        <dl className="mt-2 space-y-1 text-zinc-600">
          <div className="flex justify-between gap-4">
            <dt>Cliente</dt>
            <dd className="text-right font-semibold text-zinc-900">{order.customerName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Telefone</dt>
            <dd className="text-right font-semibold text-zinc-900">{order.customerPhone}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Recebimento</dt>
            <dd className="text-right font-semibold text-zinc-900">
              {labelFor(FULFILLMENT_OPTIONS, order.fulfillment)}
              {order.address ? ` – ${order.address}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Pagamento</dt>
            <dd className="text-right font-semibold text-zinc-900">
              {labelFor(PAYMENT_OPTIONS, order.paymentMethod)}
            </dd>
          </div>
          {order.notes ? (
            <div className="flex justify-between gap-4">
              <dt>Observações</dt>
              <dd className="text-right font-semibold text-zinc-900">{order.notes}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <div className="mx-3 mt-4 space-y-2">
        {restaurant.whatsapp ? (
          <WhatsAppButton
            phone={restaurant.whatsapp}
            message={orderReceivedMessage(restaurant, order.id)}
          />
        ) : null}
        <Link
          href="/"
          className="flex h-12 items-center justify-center rounded-xl bg-brand text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(139,31,214,0.35)]"
        >
          Voltar ao cardápio
        </Link>
      </div>
    </div>
  );
}
