"use client";

import { CheckIcon } from "@/components/icons";

export function Toast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      <div className="flex max-w-sm animate-toast-in items-center gap-2 rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500">
          <CheckIcon className="h-3 w-3" />
        </span>
        <span className="truncate">{message}</span>
      </div>
    </div>
  );
}
