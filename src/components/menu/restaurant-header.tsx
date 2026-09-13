import { FacebookIcon, InstagramIcon, PinIcon, WhatsAppIcon } from "@/components/icons";
import { formatPhoneBR } from "@/lib/format";
import type { RestaurantDTO } from "@/lib/types";

type Props = {
  restaurant: RestaurantDTO;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function RestaurantHeader({ restaurant }: Props) {
  const whatsappHref = restaurant.whatsapp ? `https://wa.me/${restaurant.whatsapp}` : null;

  const socialLinks = [
    restaurant.facebookUrl
      ? { href: restaurant.facebookUrl, label: "Facebook", Icon: FacebookIcon }
      : null,
    restaurant.instagramUrl
      ? { href: restaurant.instagramUrl, label: "Instagram", Icon: InstagramIcon }
      : null,
    restaurant.whatsapp ? { href: whatsappHref ?? "#", label: "WhatsApp", Icon: WhatsAppIcon } : null,
  ].filter(Boolean) as { href: string; label: string; Icon: typeof FacebookIcon }[];

  return (
    <header className="px-3 pt-3">
      <div className="relative">
        <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-[#1a0b2e]">
          {restaurant.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.coverImage}
              alt={`Capa do ${restaurant.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,#a21cf0,transparent_55%),radial-gradient(circle_at_85%_80%,#ffd60a,transparent_45%),linear-gradient(135deg,#1a0b2e,#3b0764)]" />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
        </div>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
          <div className="grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-full border-[3px] border-white bg-[#120621] shadow-[0_6px_22px_rgba(139,31,214,0.45)]">
            {restaurant.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoImage}
                alt={`Logo ${restaurant.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="grid h-full w-full place-items-center bg-brand text-xl font-black text-white">
                {initials(restaurant.name)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-[1fr_auto_1fr] items-center">
        <span aria-hidden />
        <h1 className="text-center text-[20px] font-black tracking-tight text-zinc-900">
          {restaurant.name}
        </h1>
        <div className="flex items-center justify-end gap-1.5">
          {socialLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className={`grid h-8 w-8 place-items-center rounded-full text-white transition ${
                label === "WhatsApp"
                  ? "bg-[#25D366] hover:opacity-90"
                  : "bg-zinc-900 hover:bg-brand"
              }`}
            >
              <Icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      {restaurant.tagline ? (
        <p className="mt-0.5 text-center text-xs text-zinc-500">{restaurant.tagline}</p>
      ) : null}

      <div className="mt-2.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${
            restaurant.isOpen ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${restaurant.isOpen ? "bg-emerald-500" : "bg-red-500"}`}
          />
          {restaurant.isOpen ? "Aberto agora" : "Fechado no momento"}
        </span>
        {restaurant.address ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 font-semibold text-zinc-600 shadow-sm">
            <PinIcon className="h-3 w-3 text-brand" />
            {restaurant.address}
          </span>
        ) : null}
        {restaurant.whatsapp ? (
          <a
            href={`https://wa.me/${restaurant.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="inline-flex items-center gap-1 rounded-full bg-[#25D366]/15 px-2 py-0.5 font-bold text-emerald-700 transition hover:bg-[#25D366]/25"
          >
            <WhatsAppIcon className="h-3 w-3" />
            {formatPhoneBR(restaurant.whatsapp)}
          </a>
        ) : null}
      </div>

      {restaurant.openingHours ? (
        <p className="mt-1.5 text-center text-[11px] text-zinc-500">{restaurant.openingHours}</p>
      ) : null}

    </header>
  );
}
