"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { copyText } from "@/lib/clipboard";

export function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => setCopied(await copyText(value))}
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 text-left"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        <span className="block truncate text-sm font-bold text-zinc-900">{value}</span>
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
          copied ? "bg-emerald-500 text-white" : "bg-white text-brand shadow-sm"
        }`}
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : null}
        {copied ? "Copiado!" : "Copiar"}
      </span>
    </button>
  );
}
