"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine, MenuItemDTO, VariantDTO } from "@/lib/types";

const STORAGE_KEY = "mixrl-cart-v2";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (
    item: MenuItemDTO,
    variant: VariantDTO | null,
    quantity?: number,
    notes?: string,
  ) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeLine: (key: string) => void;
  clear: () => void;
  quantityOf: (itemId: number) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

function lineKey(itemId: number, variantId: number | null, notes: string) {
  return `${itemId}:${variantId ?? 0}::${notes.trim().toLowerCase()}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CartLine[];
        if (Array.isArray(parsed)) {
          // Hydrating from localStorage requires a synchronous state update here.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setLines(
            parsed
              .filter(
                (line) =>
                  line &&
                  typeof line.itemId === "number" &&
                  typeof line.price === "number" &&
                  typeof line.quantity === "number" &&
                  line.quantity > 0,
              )
              .map((line) => ({
                ...line,
                variantId: typeof line.variantId === "number" ? line.variantId : null,
                variantName: typeof line.variantName === "string" ? line.variantName : null,
                notes: typeof line.notes === "string" ? line.notes : "",
              })),
          );
        }
      }
    } catch {
      // ignore corrupted storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // storage may be unavailable (private mode) – ignore
    }
  }, [lines, hydrated]);

  const addItem = useCallback(
    (item: MenuItemDTO, variant: VariantDTO | null, quantity = 1, notes = "") => {
      const key = lineKey(item.id, variant?.id ?? null, notes);
      setLines((current) => {
        const existing = current.find((line) => line.key === key);
        if (existing) {
          return current.map((line) =>
            line.key === key
              ? { ...line, quantity: Math.min(99, line.quantity + quantity) }
              : line,
          );
        }
        const newLine: CartLine = {
          key,
          itemId: item.id,
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          name: item.name,
          price: variant ? variant.price : item.price,
          imageUrl: item.imageUrl,
          quantity: Math.min(99, quantity),
          notes: notes.trim(),
        };
        return [...current, newLine];
      });
    },
    [],
  );

  const updateQuantity = useCallback((key: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((line) => line.key !== key)
        : current.map((line) =>
            line.key === key ? { ...line, quantity: Math.min(99, quantity) } : line,
          ),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((current) => current.filter((line) => line.key !== key));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const quantityOf = useCallback(
    (itemId: number) =>
      lines.reduce((sum, line) => (line.itemId === itemId ? sum + line.quantity : sum), 0),
    [lines],
  );

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    return {
      lines,
      count,
      subtotal,
      hydrated,
      addItem,
      updateQuantity,
      removeLine,
      clear,
      quantityOf,
    };
  }, [lines, hydrated, addItem, updateQuantity, removeLine, clear, quantityOf]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return context;
}
