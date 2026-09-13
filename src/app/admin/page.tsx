import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/admin-shell";
import { getAdminSecret, isUsingHashedSecret } from "@/lib/auth";
import { getMenuData, getOrders } from "@/lib/menu";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Área do restaurante",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const [menu, orders] = await Promise.all([
    getMenuData({ includeInactive: true }).catch(() => null),
    getOrders().catch(() => []),
  ]);

  const secretConfigured = Boolean(getAdminSecret());

  if (!menu) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">⚙️</p>
          <h1 className="mt-3 text-lg font-bold text-zinc-900">Painel indisponível</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {secretConfigured
              ? "Verifique a conexão com o banco de dados (DATABASE_URL)."
              : "Defina a senha do painel em ADMIN_PASSWORD ou ADMIN_PASSWORD_HASH."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      {!secretConfigured || !isUsingHashedSecret() ? (
        <div className="bg-amber-100 px-4 py-2 text-center text-[11px] font-semibold text-amber-900">
          Sem ADMIN_PASSWORD_HASH configurado a senha fica em texto puro. Gere o hash com{" "}
          <code className="rounded bg-amber-200/70 px-1">node scripts/hash-senha.js</code> e salve
          na hospedagem.
        </div>
      ) : null}
      <AdminShell initialMenu={menu} initialOrders={orders} />
    </>
  );
}
