import { WhatsAppIcon } from "@/components/icons";

type Props = {
  phone: string;
  message?: string;
  label?: string;
  className?: string;
};

/**
 * Big, always-visible WhatsApp button.
 *
 * It renders a plain anchor to https://wa.me/<number> with no JavaScript
 * intercepting the click, which is the most reliable way to open the app on
 * mobile and WhatsApp Web on desktop.
 */
export function WhatsAppCta({
  phone,
  message,
  label = "Fale com a gente no WhatsApp",
  className = "",
}: Props) {
  if (!phone) return null;
  const href = message
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${phone}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] text-[15px] font-extrabold text-white shadow-[0_10px_26px_rgba(37,211,102,0.38)] transition active:scale-[0.98] ${className}`}
    >
      <WhatsAppIcon className="h-6 w-6" />
      {label}
    </a>
  );
}
