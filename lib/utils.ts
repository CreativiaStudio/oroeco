import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Unisce classi condizionali risolvendo i conflitti Tailwind. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatta un importo in euro secondo le convenzioni italiane. */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Percentuale di sconto rispetto al prezzo pieno (intero, 0 se assente). */
export function discountPercent(
  price: number,
  compareAtPrice?: number,
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/** Iniziali eleganti per i fallback immagine. */
export function initialsFromName(name: string): string {
  const cleaned = name.replace(/[^a-zA-ZÀ-ÿ0-9 ]/g, " ").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "O&";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Ritarda l'esecuzione (utility per feedback UI). */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
