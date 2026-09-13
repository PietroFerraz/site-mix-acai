"use client";

import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

type Props = {
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function BottomSheet({ onClose, title, children, footer }: Props) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 animate-fade-in bg-black/50"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : "Painel"}
        className="relative flex max-h-[92dvh] w-full max-w-md animate-sheet-up flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl"
      >
        {title !== undefined ? (
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
            <h2 className="text-base font-extrabold text-zinc-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="grid h-8 w-8 place-items-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
        {footer ? (
          <div className="border-t border-zinc-100 bg-white px-3 pt-3 pb-[max(env(safe-area-inset-bottom),12px)]">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
