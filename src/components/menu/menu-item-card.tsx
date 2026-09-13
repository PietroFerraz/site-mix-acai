"use client";

import { PlusIcon } from "@/components/icons";
import { FoodImage } from "@/components/ui/food-image";
import { discountPercent, formatMoney } from "@/lib/format";
import type { MenuItemDTO } from "@/lib/types";

type Props = {
  item: MenuItemDTO;
  currency: string;
  locale: string;
  quantityInCart?: number;
  canOrder: boolean;
  onOpen: (item: MenuItemDTO) => void;
  onAdd: (item: MenuItemDTO) => void;
  highlight?: boolean;
};

export function MenuItemCard({
  item,
  currency,
  locale,
  quantityInCart = 0,
  canOrder,
  onOpen,
  onAdd,
  highlight = false,
}: Props) {
  const hasVariants = item.variants.length > 0;
  const discount = hasVariants ? null : discountPercent(item.price, item.originalPrice);
  const available = item.isAvailable;

  return (
    <article
      id={`item-${item.id}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(item);
        }
      }}
      className={`relative flex cursor-pointer gap-3 rounded-2xl bg-white p-2.5 shadow-[0_2px_10px_rgba(0,0,0,0.05)] outline-none transition focus-visible:ring-2 focus-visible:ring-brand/50 active:scale-[0.99] ${
        highlight ? "animate-flash-ring" : ""
      }`}
    >
      <div className="relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-zinc-100">
        <FoodImage
          src={item.imageUrl}
          alt={item.name}
          className={`h-full w-full object-cover ${available ? "" : "opacity-60 grayscale"}`}
        />
        {discount ? (
          <span className="absolute left-1 top-1 rounded-md bg-brand px-1.5 py-0.5 text-[10px] font-extrabold text-white shadow">
            -{discount}%
          </span>
        ) : null}
        {quantityInCart > 0 ? (
          <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-zinc-900 px-1 text-[10px] font-bold text-white shadow">
            {quantityInCart}
          </span>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-zinc-900">
          {item.name}
        </h3>
        {item.description ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-zinc-500">
            {item.description}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          {hasVariants ? (
            <div className="flex flex-wrap gap-1">
              {item.variants.map((variant) => (
                <span
                  key={variant.id}
                  className="inline-flex items-baseline gap-1 rounded-md bg-brand-light px-1.5 py-0.5 text-[11px] font-semibold text-brand-dark"
                >
                  {variant.name}
                  <span className="font-extrabold text-brand">
                    {formatMoney(variant.price, currency, locale)}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[13px] font-extrabold text-brand">
                {formatMoney(item.price, currency, locale)}
              </span>
              {item.originalPrice ? (
                <span className="text-[11px] text-zinc-400 line-through">
                  {formatMoney(item.originalPrice, currency, locale)}
                </span>
              ) : null}
            </div>
          )}

          {available ? (
            <button
              type="button"
              disabled={!canOrder}
              onClick={(event) => {
                event.stopPropagation();
                onAdd(item);
              }}
              aria-label={
                hasVariants ? `Escolher tamanho de ${item.name}` : `Adicionar ${item.name}`
              }
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_3px_10px_rgba(139,31,214,0.4)] transition active:scale-90 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          ) : (
            <span className="shrink-0 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
              Esgotado
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
