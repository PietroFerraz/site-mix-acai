"use client";

import { MinusIcon, PlusIcon, TrashIcon } from "@/components/icons";

type Props = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  allowRemove?: boolean;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  allowRemove = false,
}: Props) {
  // 44px+ keeps the buttons comfortable to tap on phones.
  const buttonSize = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const canDecrease = allowRemove ? value > 0 : value > min;

  return (
    <div
      className={`inline-flex items-center rounded-xl border border-zinc-200 bg-white ${
        size === "sm" ? "gap-0.5 px-0.5" : "gap-1 px-1"
      }`}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(allowRemove ? 0 : min, value - 1))}
        disabled={!canDecrease}
        aria-label={allowRemove && value === 1 ? "Remover" : "Diminuir quantidade"}
        className={`grid ${buttonSize} place-items-center rounded-lg text-brand transition hover:bg-brand-light disabled:text-zinc-300 active:scale-90`}
      >
        {allowRemove && value === 1 ? (
          <TrashIcon className={iconSize} />
        ) : (
          <MinusIcon className={iconSize} />
        )}
      </button>
      <span
        className={`min-w-7 text-center font-extrabold tabular-nums text-zinc-900 ${
          size === "sm" ? "text-[15px]" : "text-lg"
        }`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Aumentar quantidade"
        className={`grid ${buttonSize} place-items-center rounded-lg text-brand transition hover:bg-brand-light disabled:text-zinc-300 active:scale-90`}
      >
        <PlusIcon className={iconSize} />
      </button>
    </div>
  );
}
