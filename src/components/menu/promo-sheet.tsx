"use client";

import { MenuItemCard } from "@/components/menu/menu-item-card";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import type { MenuItemDTO, PromotionDTO } from "@/lib/types";

type Props = {
  promotion: PromotionDTO;
  items: MenuItemDTO[];
  currency: string;
  locale: string;
  canOrder: boolean;
  quantityOf: (itemId: number) => number;
  onClose: () => void;
  onOpen: (item: MenuItemDTO) => void;
  onAdd: (item: MenuItemDTO) => void;
};

export function PromoSheet({
  promotion,
  items,
  currency,
  locale,
  canOrder,
  quantityOf,
  onClose,
  onOpen,
  onAdd,
}: Props) {
  return (
    <BottomSheet onClose={onClose} title={`${promotion.badge} ${promotion.title}`}>
      <div className="space-y-2.5 bg-surface px-3 pb-6 pt-3">
        {promotion.description ? (
          <p className="px-1 pb-1 text-sm text-zinc-500">{promotion.description}</p>
        ) : null}
        {items.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-zinc-500">
            Nenhum item em promoção no momento. Volte em breve! 😉
          </p>
        ) : (
          items.map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              currency={currency}
              locale={locale}
              canOrder={canOrder}
              quantityInCart={quantityOf(item.id)}
              onOpen={onOpen}
              onAdd={onAdd}
            />
          ))
        )}
      </div>
    </BottomSheet>
  );
}
