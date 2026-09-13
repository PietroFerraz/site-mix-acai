"use client";

import { forwardRef, useEffect, useRef } from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";
import type { CategoryDTO } from "@/lib/types";

type Props = {
  categories: Pick<CategoryDTO, "id" | "name">[];
  activeId: number | null;
  onSelect: (id: number) => void;
  searchOpen: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  onToggleSearch: () => void;
};

export const CategoryTabs = forwardRef<HTMLDivElement, Props>(function CategoryTabs(
  { categories, activeId, onSelect, searchOpen, query, onQueryChange, onToggleSearch },
  ref,
) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pillRefs = useRef(new Map<number, HTMLButtonElement>());

  useEffect(() => {
    if (activeId === null || searchOpen) return;
    const scroller = scrollerRef.current;
    const pill = pillRefs.current.get(activeId);
    if (!scroller || !pill) return;
    const target = pill.offsetLeft - scroller.clientWidth / 2 + pill.clientWidth / 2;
    scroller.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [activeId, searchOpen]);

  return (
    <div
      ref={ref}
      className="sticky top-0 z-30 bg-surface/95 px-3 py-2 backdrop-blur supports-[backdrop-filter]:bg-surface/80"
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSearch}
          aria-label={searchOpen ? "Fechar busca" : "Buscar no cardápio"}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
            searchOpen ? "bg-brand text-white" : "bg-white text-zinc-800 shadow-sm"
          }`}
        >
          <SearchIcon className="h-[18px] w-[18px]" />
        </button>

        {searchOpen ? (
          <div className="flex h-9 flex-1 items-center gap-2 rounded-full bg-white px-3 shadow-sm">
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Buscar no cardápio..."
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
            <button
              type="button"
              onClick={onToggleSearch}
              aria-label="Limpar busca"
              className="grid h-6 w-6 place-items-center rounded-full bg-zinc-100 text-zinc-500"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div ref={scrollerRef} className="no-scrollbar flex flex-1 gap-1 overflow-x-auto">
            {categories.map((category) => {
              const active = category.id === activeId;
              return (
                <button
                  key={category.id}
                  ref={(node) => {
                    if (node) pillRefs.current.set(category.id, node);
                    else pillRefs.current.delete(category.id);
                  }}
                  type="button"
                  onClick={() => onSelect(category.id)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition ${
                    active
                      ? "bg-brand text-white shadow-[0_4px_12px_rgba(139,31,214,0.35)]"
                      : "text-zinc-600 hover:bg-white"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
