"use client";

import { TagIcon } from "@/components/icons";
import type { PromotionDTO } from "@/lib/types";

type Props = {
  promotion: PromotionDTO;
  onView: () => void;
};

export function PromoBanner({ promotion, onView }: Props) {
  return (
    <div className="px-3 pt-3">
      <button
        type="button"
        onClick={onView}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-brand px-3 py-2 text-left text-white shadow-[0_6px_18px_rgba(139,31,214,0.3)] transition active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15">
            <TagIcon className="h-4.5 w-4.5" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate">
              <span className="text-base font-extrabold">{promotion.badge}</span>{" "}
              <span className="text-sm font-semibold">{promotion.title}</span>
            </span>
            {promotion.description ? (
              <span className="block truncate text-[11px] text-white/85">
                {promotion.description}
              </span>
            ) : null}
          </span>
        </span>
        <span className="shrink-0 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-zinc-900">
          Ver
        </span>
      </button>
    </div>
  );
}
