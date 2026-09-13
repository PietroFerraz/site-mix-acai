import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { getMenuData, getOrders } from "@/lib/menu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Painel do restaurante",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const [menu, orders] = await Promise.all([
    getMenuData({ includeInactive: true }).catch(() => null),
    getOrders().catch(() => []),
  ]);

  if (!menu) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">⚙️</p>
          <h1 className="mt-3 text-lg font-bold text-zinc-900">Painel indisponível</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Verifique a conexão com o banco de dados (DATABASE_URL).
          </p>
        </div>
      </main>
    );
  }

  return <AdminShell initialMenu={menu} initialOrders={orders} />;
}
