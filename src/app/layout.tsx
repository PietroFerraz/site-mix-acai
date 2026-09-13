import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MIX RL – Açaí na Garrafa | Cardápio",
  description:
    "Açaí na garrafa em Rio Largo – AL. Sabores Maracujá, Ninho, Morango e Amendoim em 300ml e 500ml. Bateu vontade? Pede Mix pelo WhatsApp!",
  icons: { icon: "/imagens/logo.webp", apple: "/imagens/logo.webp" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#8b1fd6",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-surface font-sans text-zinc-900 antialiased md:bg-[#e9e0f3]">
        {children}
      </body>
    </html>
  );
}
