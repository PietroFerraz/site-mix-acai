"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CategoriesPanel } from "@/components/admin/categories-panel";
import { ItemsPanel } from "@/components/admin/items-panel";
import { OrdersPanel } from "@/components/admin/orders-panel";
import { SettingsPanel } from "@/components/admin/settings-panel";
import type { MenuData, OrderDTO } from "@/lib/types";

type Tab = "orders" | "items" | "categories" | "settings";

const TABS: { value: Tab; label: string }[] = [
  { value: "orders", label: "Pedidos" },
  { value: "items", label: "Itens" },
  { value: "categories", label: "Categorias" },
  { value: "settings", label: "Configurações" },
];

type Notice = { type: "success" | "error"; text: string };

export function AdminShell({
  initialMenu,
  initialOrders,
}: {
  initialMenu: MenuData;
  initialOrders: OrderDTO[];
}) {
  const [tab, setTab] = useState<Tab>("orders");
  const [menu, setMenu] = useState<MenuData>(initialMenu);
  const [orders, setOrders] = useState<OrderDTO[]>(initialOrders);
  const [notice, setNotice] = useState<Notice | null>(null);

  const reloadMenu = useCallback(async () => {
    try {
      const response = await fetch("/api/menu?all=1", { cache: "no-store" });
      if (response.ok) setMenu((await response.json()) as MenuData);
    } catch {
      // keep current data
    }
  }, []);

  const reloadOrders = useCallback(async () => {
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { orders: OrderDTO[] };
        setOrders(data.orders);
      }
    } catch {
      // keep current data
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(reloadOrders, 15000);
    return () => window.clearInterval(id);
  }, [reloadOrders]);

  const notify = useCallback((type: Notice["type"], text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 2600);
  }, []);

  const pendingCount = orders.filter((order) => order.status === "pending").length;

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
              {menu.restaurant.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={menu.restaurant.logoImage}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-zinc-900">
                {menu.restaurant.name}
              </p>
              <p className="text-[11px] text-zinc-500">Painel do restaurante</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`hidden rounded-full px-2.5 py-1 text-[11px] font-bold sm:inline ${
                menu.restaurant.isOpen
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {menu.restaurant.isOpen ? "Aberto" : "Fechado"}
            </span>
            <Link
              href="/"
              className="rounded-lg bg-brand px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-dark"
            >
              Ver cardápio
            </Link>
          </div>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
          {TABS.map((item) => {
            const active = tab === item.value;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "border-brand text-brand"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {item.label}
                {item.value === "orders" && pendingCount > 0 ? (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
                    {pendingCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-5">
        {tab === "orders" ? (
          <OrdersPanel
            orders={orders}
            restaurant={menu.restaurant}
            onChanged={reloadOrders}
            notify={notify}
          />
        ) : null}
        {tab === "items" ? <ItemsPanel menu={menu} onChanged={reloadMenu} notify={notify} /> : null}
        {tab === "categories" ? (
          <CategoriesPanel menu={menu} onChanged={reloadMenu} notify={notify} />
        ) : null}
        {tab === "settings" ? (
          <SettingsPanel menu={menu} onChanged={reloadMenu} notify={notify} />
        ) : null}
      </main>

      {notice ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[60] flex justify-center px-4">
          <div
            className={`animate-toast-in rounded-full px-4 py-2.5 text-sm font-semibold text-white shadow-lg ${
              notice.type === "success" ? "bg-zinc-900" : "bg-red-600"
            }`}
          >
            {notice.text}
          </div>
        </div>
      ) : null}
    </div>
  );
}
