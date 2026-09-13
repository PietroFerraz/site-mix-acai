import { CopyField } from "@/components/whatsapp/copy-field";
import { getMenuData } from "@/lib/menu";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fale com a gente no WhatsApp",
  robots: { index: false, follow: false },
};

export default async function WhatsAppPage() {
  const menu = await getMenuData().catch(() => null);
  const restaurant = menu?.restaurant;

  if (!restaurant?.whatsapp) {
    return (
      <main className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-4xl">💬</p>
          <h1 className="mt-3 text-lg font-bold">Contato indisponível</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Fale com a gente pelo WhatsApp (82) 98745-3666.
          </p>
          <a
            href="https://wa.me/5582987453666"
            className="mt-4 inline-flex rounded-xl bg-[#25D366] px-5 py-3 text-sm font-extrabold text-white"
          >
            Abrir WhatsApp
          </a>
        </div>
      </main>
    );
  }

  const number = restaurant.whatsapp;
  const display = number.replace(/^55/, "").replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  const link = `https://wa.me/${number}`;

  return (
    <main className="mx-auto min-h-screen w-full max-w-md px-4 py-8">
      <div className="rounded-3xl bg-white p-6 text-center shadow-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#25D366] text-white">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
            <path d="M12 2.2a9.8 9.8 0 0 0-8.4 14.8L2.3 21.8l4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.5-6c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.5 1.1 2.7.1.2 1.9 2.9 4.6 4 1.7.7 2.3.8 3.2.7.5-.1 1.5-.6 1.8-1.3.2-.6.2-1.2.1-1.3-.1-.1-.2-.2-.5-.3Z" />
          </svg>
        </div>

        <h1 className="mt-4 text-xl font-black text-zinc-900">{restaurant.name}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Fale com a gente no WhatsApp {display}
        </p>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-[15px] font-extrabold text-white shadow-[0_10px_26px_rgba(37,211,102,0.38)]"
        >
          Abrir conversa no WhatsApp
        </a>

        <div className="mt-5 space-y-2 text-left">
          <CopyField value={display} label="Número" />
          <CopyField value={link} label="Link" />
        </div>

        <p className="mt-4 text-[11px] leading-snug text-zinc-400">
          Se o botão não abrir, é porque esta página está sendo vista dentro de outro site que
          bloqueia o WhatsApp. Abra o cardápio em uma aba própria ou use o celular — aí funciona com
          um toque.
        </p>
      </div>
    </main>
  );
}
