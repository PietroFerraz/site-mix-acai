"use client";

import { useState } from "react";
import { CheckIcon, CloseIcon } from "@/components/icons";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FoodImage } from "@/components/ui/food-image";
import { discountPercent, formatMoney } from "@/lib/format";
import type { MenuItemDTO, VariantDTO } from "@/lib/types";

type Props = {
  item: MenuItemDTO;
  currency: string;
  locale: string;
  canOrder: boolean;
  onClose: () => void;
  onAdd: (item: MenuItemDTO, variant: VariantDTO | null, quantity: number, notes: string) => void;
};

export function ItemSheet({ item, currency, locale, canOrder, onClose, onAdd }: Props) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [variant, setVariant] = useState<VariantDTO | null>(item.variants[0] ?? null);

  const hasVariants = item.variants.length > 0;
  const unitPrice = variant ? variant.price : item.price;
  const discount = hasVariants ? null : discountPercent(item.price, item.originalPrice);
  const disabled = !canOrder || !item.isAvailable || (hasVariants && !variant);

  return (
    <BottomSheet
      onClose={onClose}
      footer={
        <div className="flex items-stretch gap-2">
          <div className="flex items-center">
            <QuantityStepper value={quantity} onChange={setQuantity} />
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onAdd(item, variant, quantity, notes)}
            className="flex h-14 flex-1 items-center justify-between rounded-2xl bg-brand px-4 text-[15px] font-extrabold text-white shadow-[0_8px_20px_rgba(139,31,214,0.35)] transition active:scale-[0.98] disabled:bg-zinc-300 disabled:shadow-none"
          >
            <span>
              {!item.isAvailable ? "Esgotado" : !canOrder ? "Fechado" : "Adicionar"}
            </span>
            <span>{formatMoney(unitPrice * quantity, currency, locale)}</span>
          </button>
        </div>
      }
    >
      <div className="relative h-60 w-full bg-zinc-100">
        <FoodImage
          src={item.imageUrl}
          alt={item.name}
          fallbackEmoji="🥤"
          className="h-full w-full object-cover"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-zinc-700 shadow-md"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
        {discount ? (
          <span className="absolute left-3 top-3 rounded-lg bg-brand px-2 py-1 text-xs font-extrabold text-white shadow">
            -{discount}% OFF
          </span>
        ) : null}
      </div>

      <div className="px-4 pb-4 pt-4">
        <h2 className="text-lg font-extrabold leading-tight text-zinc-900">{item.name}</h2>
        {item.description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{item.description}</p>
        ) : null}

        <div className="mt-3 flex items-baseline gap-2">
          {hasVariants ? (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
              {variant ? variant.name : "a partir de"}
            </span>
          ) : null}
          <span className="text-xl font-extrabold text-brand">
            {formatMoney(unitPrice, currency, locale)}
          </span>
          {!hasVariants && item.originalPrice ? (
            <span className="text-sm text-zinc-400 line-through">
              {formatMoney(item.originalPrice, currency, locale)}
            </span>
          ) : null}
        </div>

        {hasVariants ? (
          <fieldset className="mt-5">
            <legend className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
              Escolha o tamanho
            </legend>
            <div className="mt-2 space-y-2">
              {item.variants.map((option) => {
                const selected = variant?.id === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setVariant(option)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-3.5 py-3.5 text-sm transition active:scale-[0.99] ${
                      selected
                        ? "border-brand bg-brand-light shadow-[0_0_0_1.5px_rgba(139,31,214,0.45)]"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full border-2 ${
                          selected ? "border-brand bg-brand text-white" : "border-zinc-300"
                        }`}
                      >
                        {selected ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className="font-bold text-zinc-900">{option.name}</span>
                    </span>
                    <span className="font-extrabold text-brand">
                      {formatMoney(option.price, currency, locale)}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        <label className="mt-5 block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            Alguma observação?
          </span>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={200}
            rows={3}
            placeholder="Ex.: sem leite condensado, bem gelado, com mais granola..."
            className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none transition focus:border-brand focus:bg-white"
          />
          <span className="block text-right text-[11px] text-zinc-400">{notes.length}/200</span>
        </label>
      </div>
    </BottomSheet>
  );
}
