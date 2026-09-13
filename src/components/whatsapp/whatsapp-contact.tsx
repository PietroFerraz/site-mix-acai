"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CheckIcon, CloseIcon, WhatsAppIcon } from "@/components/icons";
import { copyText } from "@/lib/clipboard";
import { formatPhoneBR } from "@/lib/format";
import { useDeviceKind, type DeviceKind } from "@/lib/use-device";
import { buildWhatsAppTargets } from "@/lib/whatsapp";

type Props = {
  phone: string;
  message?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
  sheetTitle?: string;
  disabled?: boolean;
};

function CopyChip({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        const ok = await copyText(value);
        setCopied(ok);
      }}
      className={`inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
        copied ? "bg-emerald-500 text-white" : "bg-white text-brand shadow-sm"
      }`}
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5" /> : null}
      {copied ? "Copiado!" : `Copiar ${label}`}
    </button>
  );
}

type PrimaryHref = { href: string; label: string; kind: "app" | "web" };

/**
 * Chooses the best WhatsApp entry point for the current device.
 *
 * On desktop, wa.me redirects to api.whatsapp.com, which several browsers block
 * (ERR_BLOCKED_BY_RESPONSE). WhatsApp Web does not suffer that redirect, so it
 * becomes the primary option on desktop. On mobile wa.me opens the installed
 * app directly, so it stays primary there.
 */
function pickPrimary(device: DeviceKind, targets: ReturnType<typeof buildWhatsAppTargets>): PrimaryHref {
  return device === "desktop"
    ? { href: targets.web, label: "Abrir no WhatsApp Web", kind: "web" }
    : { href: targets.app, label: "Abrir WhatsApp", kind: "app" };
}

/**
 * Opens the WhatsApp contact sheet with the right option highlighted for the
 * device, and always offers the number + message ready to copy as a guaranteed
 * fallback when every domain is blocked by the browser.
 */
export function WhatsAppContact({
  phone,
  message,
  className,
  children,
  ariaLabel,
  sheetTitle = "Falar no WhatsApp",
  disabled = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const device = useDeviceKind();

  function openUrl(event: MouseEvent<HTMLAnchorElement>, url: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      // Pop-up blocked: navigate in the same tab so the click still works.
      window.location.assign(url);
    }
  }

  const targets = buildWhatsAppTargets({ phone, message });
  const primary = pickPrimary(device, targets);
  const secondary: PrimaryHref =
    primary.kind === "app"
      ? { href: targets.web, label: "Ou use o WhatsApp Web", kind: "web" }
      : { href: targets.app, label: "Ou abra no aplicativo", kind: "app" };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label={ariaLabel}
        className={className}
      >
        {children}
      </button>

      {open ? (
        <BottomSheet
          onClose={() => setOpen(false)}
          title={sheetTitle}
          footer={
            <div className="space-y-2">
              <a
                href={primary.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => openUrl(event, primary.href)}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(37,211,102,0.35)]"
              >
                <WhatsAppIcon className="h-5 w-5" />
                {primary.label}
              </a>
              <a
                href={secondary.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => openUrl(event, secondary.href)}
                className="flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 text-sm font-bold text-zinc-800"
              >
                {secondary.label}
              </a>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-full place-items-center rounded-full text-sm font-semibold text-zinc-400"
              >
                Fechar
              </button>
            </div>
          }
        >
          <div className="px-4 pb-4 pt-4">
            <p className="mb-3 text-center text-[11px] text-zinc-400">
              {device === "desktop"
                ? "Você está no computador — o WhatsApp Web é a melhor opção."
                : "Você está no celular — o aplicativo abre direto."}
            </p>

            <div className="rounded-2xl bg-[#25D366]/10 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                Número da loja
              </p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-lg font-extrabold text-zinc-900">
                  {formatPhoneBR(targets.number)}
                </span>
                <CopyChip value={targets.number} label="número" />
              </div>
            </div>

            {message ? (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                    Mensagem
                  </p>
                  <CopyChip value={message} label="mensagem" />
                </div>
                <pre className="mt-1.5 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-2xl bg-zinc-50 p-3 font-sans text-sm leading-relaxed text-zinc-700">
                  {message}
                </pre>
              </div>
            ) : null}

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] leading-snug text-amber-900">
              <CloseIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Se o botão não abrir nada, copie o número e a mensagem acima e cole no chat — o
                pedido chega do mesmo jeito.
              </span>
            </div>
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}
