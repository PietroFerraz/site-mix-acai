"use client";

import { useRef, useState } from "react";
import { TrashIcon } from "@/components/icons";

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  previewClassName?: string;
};

const MAX_BYTES = 1_500_000; // ~1.5 MB keeps the database payload reasonable

/**
 * Lets the user pick a local image file and turns it into a data URL.
 *
 * Storing the image inline (instead of writing to a folder) keeps working on
 * serverless hosts such as Netlify, where the file system is read-only.
 */
export function ImageUpload({ value, onChange, label = "Imagem", previewClassName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFile(file: File | undefined) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Escolha um arquivo de imagem (JPG ou PNG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`Imagem muito grande (${(file.size / 1_000_000).toFixed(1)} MB). Use até 1,5 MB.`);
      return;
    }
    setBusy(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(String(reader.result ?? ""));
      setBusy(false);
    };
    reader.onerror = () => {
      setError("Não foi possível ler o arquivo.");
      setBusy(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <span className="block text-xs font-semibold text-zinc-600">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          {busy ? "Carregando..." : "Enviar imagem"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <TrashIcon className="h-3.5 w-3.5" /> Remover
          </button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
      {error ? <p className="mt-1 text-[11px] font-semibold text-red-600">{error}</p> : null}
      <input
        value={value.startsWith("data:") ? "" : value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="ou cole um link https://..."
        className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs outline-none focus:border-brand"
      />
      {value ? (
        <div className={`mt-2 overflow-hidden bg-zinc-100 ${previewClassName ?? "h-24 w-full"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
    </div>
  );
}
