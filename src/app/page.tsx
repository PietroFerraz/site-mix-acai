import type { Metadata } from "next";
import { MenuPage } from "@/components/menu/menu-page";
import { getMenuData } from "@/lib/menu";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const data = await getMenuData();
    if (!data) return {};
    return {
      title: `${data.restaurant.name} – Cardápio`,
      description:
        data.restaurant.tagline ??
        `Confira o cardápio do ${data.restaurant.name} e faça seu pedido online.`,
    };
  } catch {
    return {};
  }
}

export default async function HomePage() {
  const data = await getMenuData().catch(() => null);

  if (!data) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">🍇</p>
          <h1 className="mt-3 text-lg font-bold">Cardápio indisponível</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Não conseguimos carregar o cardápio agora. Tente novamente em instantes.
          </p>
          <a
            href="https://wa.me/5582987453666"
            className="mt-5 inline-flex rounded-xl bg-[#25D366] px-5 py-3 text-sm font-extrabold text-white"
          >
            Falar no WhatsApp
          </a>
        </div>
      </main>
    );
  }

  return <MenuPage data={data} />;
}
