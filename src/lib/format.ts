export function formatMoney(
  value: number,
  currency: string = "BRL",
  locale: string = "pt-BR",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function toMoneyString(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatDateTime(
  value: Date | string,
  locale: string = "pt-BR",
): string {
  const date = typeof value === "string" ? new Date(value) : value;
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

export function discountPercent(price: number, originalPrice: number | null): number | null {
  if (!originalPrice || originalPrice <= price) return null;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Normalizes a WhatsApp number so it can be used in a wa.me link:
 * strips non-digits and leading zeros, and adds the country code (default 55)
 * when the value looks like a local Brazilian number (10 or 11 digits).
 * Returns null when the value cannot be turned into a valid number.
 */
export function normalizeWhatsapp(value: string | null | undefined, ddi = "55"): string | null {
  if (!value) return null;
  let digits = onlyDigits(value);
  if (!digits) return null;
  digits = digits.replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) return `${ddi}${digits}`;
  if (digits.length >= 12 && digits.length <= 14) return digits;
  return null;
}

/** Formats a Brazilian phone (with or without the 55 country code) for display. */
export function formatPhoneBR(value: string): string {
  const digits = onlyDigits(value);
  const local = digits.startsWith("55") && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  }
  if (local.length === 10) {
    return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  }
  return value;
}
