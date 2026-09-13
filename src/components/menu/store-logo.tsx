"use client";

import { useCallback, useRef, useState } from "react";
import { AdminLoginSheet } from "@/components/admin/admin-login-sheet";
import type { RestaurantDTO } from "@/lib/types";

type Props = {
  restaurant: RestaurantDTO;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Logo circular da loja.
 *
 * Para o cliente é só a logo. Quem trabalha no restaurante descobre que um
 * toque longo (ou 5 toques rápidos) abre a tela de acesso ao painel — sem
 * nenhum botão visível no cardápio.
 */
export function StoreLogo({ restaurant }: Props) {
  const [loginOpen, setLoginOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const timer = useRef<number | null>(null);
  const taps = useRef(0);

  const openLogin = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    taps.current = 0;
    setLoginOpen(true);
  }, []);

  const startLongPress = useCallback(() => {
    timer.current = window.setTimeout(openLogin, 600);
  }, [openLogin]);

  const cancelLongPress = useCallback(() => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const handleTap = useCallback(() => {
    taps.current += 1;
    if (taps.current >= 5) {
      openLogin();
      return;
    }
    // Feedback sutil de progresso, some sozinho.
    setHint(true);
    window.setTimeout(() => setHint(false), 500);
    window.setTimeout(() => {
      taps.current = 0;
    }, 1500);
  }, [openLogin]);

  return (
    <>
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
        <button
          type="button"
          aria-label={`Logo ${restaurant.name}`}
          onPointerDown={startLongPress}
          onPointerUp={cancelLongPress}
          onPointerLeave={cancelLongPress}
          onPointerCancel={cancelLongPress}
          onContextMenu={(event) => event.preventDefault()}
          onClick={handleTap}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") openLogin();
          }}
          className={`relative grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-full border-[3px] border-white bg-[#120621] shadow-[0_6px_22px_rgba(139,31,214,0.45)] outline-none transition focus-visible:ring-2 focus-visible:ring-brand active:scale-[0.97] ${
            hint ? "ring-2 ring-brand/40" : ""
          }`}
        >
          {restaurant.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.logoImage}
              alt=""
              draggable={false}
              className="h-full w-full select-none object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center bg-brand text-xl font-black text-white">
              {initials(restaurant.name)}
            </span>
          )}
        </button>
      </div>

      {loginOpen ? (
        <AdminLoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
      ) : null}
    </>
  );
}
