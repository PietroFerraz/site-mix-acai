"use client";

import { BagIcon } from "@/components/icons";
import { useCart } from "@/components/cart/cart-context";
import { formatMoney } from "@/lib/format";

type Props = {
  currency: string;
  locale: string;
  onOpen: () => void;
};

export function CartBar({ currency, locale, onOpen }: Props) {
  const { count, subtotal, hydrated } = useCart();
  if (!hydrated || count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl bg-brand px-4 py-4 text-white shadow-[0_10px_30px_rgba(139,31,214,0.45)] transition active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/20">
            <BagIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-extrabold">Ver sacola</span>
            <span className="block text-[11px] text-white/80">
              {count} {count === 1 ? "item" : "itens"}
            </span>
          </span>
        </span>
        <span className="shrink-0 text-base font-extrabold">
          {formatMoney(subtotal, currency, locale)}
        </span>
      </button>
    </div>
  );
}
