"use client";

import { useState, type MouseEvent } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CheckIcon, CloseIcon, WhatsAppIcon } from "@/components/icons";
import { WhatsAppCta } from "@/components/whatsapp/whatsapp-cta";
import { useIsEmbedded } from "@/lib/use-embedded";
import { copyText } from "@/lib/clipboard";
import { formatPhoneBR } from "@/lib/format";

type Props = {
  phone: string;
  message?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  size?: "md" | "lg";
};

function CopyRow({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => setCopied(await copyText(value))}
      className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-left shadow-sm"
    >
      <span className="min-w-0">
        <span className="block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          {label}
        </span>
        <span className="block truncate text-sm font-bold text-zinc-900">{value}</span>
      </span>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
          copied ? "bg-emerald-500 text-white" : "bg-brand-light text-brand"
        }`}
      >
        {copied ? <CheckIcon className="h-3.5 w-3.5" /> : null}
        {copied ? "Copiado!" : "Copiar"}
      </span>
    </button>
  );
}

/**
 * The main WhatsApp button of the cardápio.
 *
 * The href is always the plain https://wa.me link, so on a real browser or on a
 * phone it opens WhatsApp directly with no JavaScript in the way. When the page
 * is running inside a sandboxed iframe (embedded previews), that navigation is
 * blocked by the browser, so we intercept the click and show the number and the
 * message ready to copy instead of letting the visitor hit an error page.
 */
export function WhatsAppButton({
  phone,
  message,
  label,
  className,
  disabled = false,
  size = "lg",
}: Props) {
  const embedded = useIsEmbedded();
  const [open, setOpen] = useState(false);

  if (!phone) return null;

  const fullUrl = message
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${phone}`;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (!embedded) return;
    event.preventDefault();
    setOpen(true);
  }

  return (
    <>
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          if (disabled) {
            event.preventDefault();
            return;
          }
          handleClick(event);
        }}
        aria-disabled={disabled || undefined}
        title={fullUrl}
        className={`flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] font-extrabold text-white shadow-[0_10px_26px_rgba(37,211,102,0.38)] transition ${
          size === "lg" ? "h-14 text-[15px]" : "h-12 text-sm"
        } ${
          disabled
            ? "pointer-events-none bg-zinc-300 shadow-none"
            : "active:scale-[0.98]"
        } ${className ?? ""}`}
      >
        <WhatsAppIcon className={size === "lg" ? "h-6 w-6" : "h-5 w-5"} />
        {label ?? "Fale com a gente no WhatsApp"}
      </a>

      {open ? (
        <BottomSheet
          onClose={() => setOpen(false)}
          title="Falar no WhatsApp"
          footer={
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="grid h-10 w-full place-items-center rounded-full text-sm font-semibold text-zinc-400"
            >
              Fechar
            </button>
          }
        >
          <div className="space-y-3 px-4 pb-4 pt-4">
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] leading-snug text-amber-900">
              <CloseIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Esta tela está sendo exibida dentro de outra página, e esse ambiente bloqueia a
                abertura do WhatsApp. Abra o site em uma aba própria (ou no celular) para o botão
                funcionar com um toque — ou copie os dados abaixo e cole no chat.
              </span>
            </div>

            <CopyRow value={formatPhoneBR(phone)} label="Número da loja" />
            <CopyRow value={fullUrl} label="Link do WhatsApp" />
            {message ? <CopyRow value={message} label="Mensagem pronta" /> : null}

            <div className="pt-1">
              <WhatsAppCta
                phone={phone}
                message={message}
                label="Tentar abrir o WhatsApp mesmo assim"
              />
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
