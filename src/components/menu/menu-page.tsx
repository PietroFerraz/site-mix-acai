"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CartBar } from "@/components/cart/cart-bar";
import { CartProvider, useCart } from "@/components/cart/cart-context";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { PinIcon } from "@/components/icons";
import { CategoryTabs } from "@/components/menu/category-tabs";
import { ItemSheet } from "@/components/menu/item-sheet";
import { MenuItemCard } from "@/components/menu/menu-item-card";
import { PromoBanner } from "@/components/menu/promo-banner";
import { PromoSheet } from "@/components/menu/promo-sheet";
import { RestaurantHeader } from "@/components/menu/restaurant-header";
import { Toast } from "@/components/ui/toast";
import type { MenuData, MenuItemDTO, VariantDTO } from "@/lib/types";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function MenuPage({ data }: { data: MenuData }) {
  return (
    <CartProvider>
      <MenuScreen data={data} />
    </CartProvider>
  );
}

function MenuScreen({ data }: { data: MenuData }) {
  const { restaurant, promotions, categories } = data;
  const cart = useCart();

  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(categories[0]?.id ?? null);
  const [selectedItem, setSelectedItem] = useState<MenuItemDTO | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [promoOpen, setPromoOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const toastTimer = useRef<number | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const programmaticScroll = useRef(false);

  const promotion = promotions[0] ?? null;
  const canOrder = restaurant.isOpen;
  const normalizedQuery = normalize(query.trim());

  const visibleCategories = useMemo(() => {
    if (!normalizedQuery) return categories.filter((category) => category.items.length > 0);
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            normalize(item.name).includes(normalizedQuery) ||
            normalize(item.description ?? "").includes(normalizedQuery),
        ),
      }))
      .filter((category) => category.items.length > 0);
  }, [categories, normalizedQuery]);

  const discountedItems = useMemo(
    () =>
      categories
        .flatMap((category) => category.items)
        .filter((item) => item.originalPrice !== null && item.originalPrice > item.price),
    [categories],
  );

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const handleAdd = useCallback(
    (item: MenuItemDTO, variant: VariantDTO | null, quantity = 1, notes = "") => {
      if (!canOrder) {
        showToast("Estamos fechados no momento");
        return;
      }
      if (!item.isAvailable) {
        showToast("Este item está esgotado");
        return;
      }
      cart.addItem(item, variant, quantity, notes);
      const label = variant ? `${item.name} ${variant.name}` : item.name;
      showToast(quantity > 1 ? `${quantity}x ${label} na sacola` : `${label} adicionado`);
    },
    [canOrder, cart, showToast],
  );

  // "+" button: items with sizes open the sheet so the customer can choose one.
  const handleQuickAdd = useCallback(
    (item: MenuItemDTO) => {
      if (item.variants.length > 0 && canOrder && item.isAvailable) {
        setSelectedItem(item);
        return;
      }
      handleAdd(item, null, 1, "");
    },
    [canOrder, handleAdd],
  );

  // Scroll spy: highlight the category currently in view.
  useEffect(() => {
    if (normalizedQuery) return;
    let frame = 0;
    const onScroll = () => {
      if (programmaticScroll.current) return;
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const offset = (tabsRef.current?.getBoundingClientRect().bottom ?? 60) + 12;
        let current = visibleCategories[0]?.id ?? null;
        for (const category of visibleCategories) {
          const element = document.getElementById(`cat-${category.id}`);
          if (!element) continue;
          if (element.getBoundingClientRect().top - offset <= 0) current = category.id;
        }
        const atBottom =
          window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
        if (atBottom && visibleCategories.length) {
          current = visibleCategories[visibleCategories.length - 1].id;
        }
        setActiveId(current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [visibleCategories, normalizedQuery]);

  const selectCategory = useCallback((id: number) => {
    setActiveId(id);
    const element = document.getElementById(`cat-${id}`);
    if (!element) return;
    const headerHeight = tabsRef.current?.offsetHeight ?? 52;
    const top = element.getBoundingClientRect().top + window.scrollY - headerHeight - 4;
    programmaticScroll.current = true;
    window.scrollTo({ top, behavior: "smooth" });
    window.setTimeout(() => {
      programmaticScroll.current = false;
    }, 700);
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchOpen((open) => {
      if (open) setQuery("");
      return !open;
    });
  }, []);

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-md bg-surface pb-32 sm:shadow-[0_0_60px_rgba(0,0,0,0.08)]">
      {promotion ? (
        <PromoBanner promotion={promotion} onView={() => setPromoOpen(true)} />
      ) : null}

      <RestaurantHeader restaurant={restaurant} />

      <div className="mt-3">
        <CategoryTabs
          ref={tabsRef}
          categories={categories.filter((category) => category.items.length > 0)}
          activeId={activeId}
          onSelect={selectCategory}
          searchOpen={searchOpen}
          query={query}
          onQueryChange={setQuery}
          onToggleSearch={toggleSearch}
        />
      </div>

      <main className="px-3">
        {visibleCategories.length === 0 ? (
          <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-4xl">🔎</p>
            <p className="mt-3 text-sm font-bold text-zinc-800">
              {normalizedQuery
                ? `Nenhum item encontrado para “${query.trim()}”`
                : "O cardápio ainda está vazio"}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {normalizedQuery
                ? "Tente buscar por outro nome ou ingrediente."
                : "Volte em breve para conferir as novidades."}
            </p>
          </div>
        ) : (
          visibleCategories.map((category) => (
            <section key={category.id} id={`cat-${category.id}`} className="pb-3">
              <h2 className="mb-2 pt-2 text-[15px] font-extrabold text-brand">
                {category.name}
              </h2>
              <div className="space-y-2.5">
                {category.items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    currency={restaurant.currency}
                    locale={restaurant.locale}
                    canOrder={canOrder}
                    quantityInCart={cart.quantityOf(item.id)}
                    onOpen={setSelectedItem}
                    onAdd={handleQuickAdd}
                  />
                ))}
              </div>
            </section>
          ))
        )}

        <footer className="mt-6 space-y-1.5 pb-4 text-center text-[11px] text-zinc-400">
          {restaurant.address ? (
            <p className="inline-flex items-center gap-1">
              <PinIcon className="h-3 w-3" />
              {restaurant.address}
            </p>
          ) : null}
          <p>{restaurant.name} • Cardápio digital</p>
        </footer>
      </main>

      <CartBar
        currency={restaurant.currency}
        locale={restaurant.locale}
        onOpen={() => setCartOpen(true)}
      />

      {selectedItem ? (
        <ItemSheet
          item={selectedItem}
          currency={restaurant.currency}
          locale={restaurant.locale}
          canOrder={canOrder}
          onClose={() => setSelectedItem(null)}
          onAdd={(item, variant, quantity, notes) => {
            handleAdd(item, variant, quantity, notes);
            setSelectedItem(null);
          }}
        />
      ) : null}

      {cartOpen ? <CartDrawer restaurant={restaurant} onClose={() => setCartOpen(false)} /> : null}

      {promoOpen && promotion ? (
        <PromoSheet
          promotion={promotion}
          items={discountedItems}
          currency={restaurant.currency}
          locale={restaurant.locale}
          canOrder={canOrder}
          quantityOf={cart.quantityOf}
          onClose={() => setPromoOpen(false)}
          onOpen={(item) => {
            setPromoOpen(false);
            setSelectedItem(item);
          }}
          onAdd={(item) => {
            if (item.variants.length > 0) setPromoOpen(false);
            handleQuickAdd(item);
          }}
        />
      ) : null}

      <Toast message={toast} />
    </div>
  );
}
