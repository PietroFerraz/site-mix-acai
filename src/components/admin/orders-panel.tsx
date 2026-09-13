"use client";

import { useMemo, useState } from "react";
import { RefreshIcon, WhatsAppIcon } from "@/components/icons";
import { Button, apiRequest } from "@/components/admin/ui";
import { WhatsAppContact } from "@/components/whatsapp/whatsapp-contact";
import { formatDateTime, formatMoney } from "@/lib/format";
import {
  FULFILLMENT_OPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STYLES,
  PAYMENT_OPTIONS,
  labelFor,
  type OrderDTO,
  type OrderStatusValue,
  type RestaurantDTO,
} from "@/lib/types";

type Props = {
  orders: OrderDTO[];
  restaurant: RestaurantDTO;
  onChanged: () => Promise<void>;
  notify: (type: "success" | "error", text: string) => void;
};

const NEXT_STATUS: Partial<Record<OrderStatusValue, { status: OrderStatusValue; label: string }>> = {
  pending: { status: "confirmed", label: "Confirmar" },
  confirmed: { status: "preparing", label: "Iniciar preparo" },
  preparing: { status: "ready", label: "Marcar pronto" },
  ready: { status: "delivered", label: "Concluir" },
};

type Filter = "all" | "open" | "done";

export function OrdersPanel({ orders, restaurant, onChanged, notify }: Props) {
  const [filter, setFilter] = useState<Filter>("open");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const money = (value: number) => formatMoney(value, restaurant.currency, restaurant.locale);

  const filtered = useMemo(() => {
    if (filter === "open") {
      return orders.filter((order) => !["delivered", "cancelled"].includes(order.status));
    }
    if (filter === "done") {
      return orders.filter((order) => ["delivered", "cancelled"].includes(order.status));
    }
    return orders;
  }, [orders, filter]);

  const openCount = orders.filter((order) => !["delivered", "cancelled"].includes(order.status)).length;

  async function changeStatus(order: OrderDTO, status: OrderStatusValue) {
    if (status === "cancelled" && !window.confirm(`Cancelar o pedido #${order.id}?`)) return;
    setBusyId(order.id);
    const result = await apiRequest<{ order: OrderDTO }>(`/api/orders/${order.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (!result.ok) {
      notify("error", result.error);
      return;
    }
    notify("success", `Pedido #${order.id}: ${ORDER_STATUS_LABELS[status]}`);
    await onChanged();
  }

  async function refresh() {
    setRefreshing(true);
    await onChanged();
    setRefreshing(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {(
            [
              { value: "open", label: `Em aberto (${openCount})` },
              { value: "done", label: "Concluídos" },
              { value: "all", label: "Todos" },
            ] as { value: Filter; label: string }[]
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                filter === option.value ? "bg-brand text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" onClick={refresh} disabled={refreshing}>
          <RefreshIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-4xl">🧾</p>
          <p className="mt-3 text-sm font-bold text-zinc-800">Nenhum pedido por aqui</p>
          <p className="mt-1 text-xs text-zinc-500">
            Os pedidos feitos pelo cardápio aparecem automaticamente nesta tela.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.map((order) => {
            const next = NEXT_STATUS[order.status];
            const finished = order.status === "delivered" || order.status === "cancelled";
            const whatsappHref = order.customerPhone;
            return (
              <article key={order.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold">Pedido #{order.id}</h3>
                    <p className="text-xs text-zinc-500">
                      {formatDateTime(order.createdAt, restaurant.locale)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${ORDER_STATUS_STYLES[order.status]}`}
                  >
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-zinc-900">{order.customerName}</span>
                  <a href={`tel:${order.customerPhone}`} className="text-zinc-600 underline-offset-2 hover:underline">
                    {order.customerPhone}
                  </a>
                  {whatsappHref ? (
                    <WhatsAppContact
                      phone={order.customerPhone}
                      message={`Olá ${order.customerName.split(" ")[0]}! Sobre o seu pedido *#${order.id}* na *${restaurant.name}*...`}
                      sheetTitle={`Cliente do pedido #${order.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" /> WhatsApp
                    </WhatsAppContact>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                    {order.fulfillment === "delivery" ? "🛵" : "🏪"}{" "}
                    {labelFor(FULFILLMENT_OPTIONS, order.fulfillment)}
                  </span>
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-700">
                    💳 {labelFor(PAYMENT_OPTIONS, order.paymentMethod)}
                  </span>
                </div>
                {order.address ? (
                  <p className="mt-1.5 text-xs text-zinc-600">📍 {order.address}</p>
                ) : null}

                <ul className="mt-3 divide-y divide-zinc-100 rounded-xl bg-zinc-50 px-3 text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="py-2">
                      <div className="flex justify-between gap-3">
                        <span className="text-zinc-800">
                          <span className="font-bold">{item.quantity}x</span> {item.name}
                          {item.variantName ? (
                            <span className="ml-1 rounded bg-brand-light px-1.5 py-0.5 text-[11px] font-bold text-brand">
                              {item.variantName}
                            </span>
                          ) : null}
                        </span>
                        <span className="font-semibold">{money(item.unitPrice * item.quantity)}</span>
                      </div>
                      {item.notes ? (
                        <p className="text-[11px] text-amber-700">Obs: {item.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {order.notes ? (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    📝 {order.notes}
                  </p>
                ) : null}

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">
                    {order.deliveryFee > 0 ? `Entrega ${money(order.deliveryFee)} • ` : ""}
                    Total
                  </span>
                  <span className="text-lg font-extrabold text-brand">{money(order.total)}</span>
                </div>

                {!finished ? (
                  <div className="mt-3 flex gap-2">
                    {next ? (
                      <Button
                        className="flex-1"
                        disabled={busyId === order.id}
                        onClick={() => changeStatus(order, next.status)}
                      >
                        {next.label}
                      </Button>
                    ) : null}
                    <Button
                      variant="danger"
                      disabled={busyId === order.id}
                      onClick={() => changeStatus(order, "cancelled")}
                    >
                      Cancelar
                    </Button>
                  </div>
                ) : (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="ghost"
                      disabled={busyId === order.id}
                      onClick={() => changeStatus(order, "pending")}
                    >
                      Reabrir pedido
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
