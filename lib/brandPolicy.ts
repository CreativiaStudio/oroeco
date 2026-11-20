/**
 * Policy ufficiale canali vendita & orari della Gioielleria ORO&CO.
 * - Brand di alta gioielleria (oro prezioso, diamanti, perle coltivate):
 *   gestiti esclusivamente in gioielleria tramite appuntamento.
 * - Stroili (inclusi oro e perle), Guess (incluso eventuale oro) e tutti gli orologi:
 *   vendibili regolarmente online.
 * - AMEN: rimosso dal catalogo.
 * - Paul Picot: attivo online (futura sostituzione con Tissot in fase successiva).
 */

export const IN_STORE_ONLY_BRAND_SLUGS = new Set<string>([
  "davite-delucchi",
  "nihama",
  "golay",
  "dana-oro-9-kt",
  "cammeo-italiano",
]);

export const REMOVED_BRAND_SLUGS = new Set<string>(["amen"]);

export function isInStoreOnlyBrand(slug: string): boolean {
  return IN_STORE_ONLY_BRAND_SLUGS.has(slug.toLowerCase());
}

export function isRemovedBrand(slug: string): boolean {
  return REMOVED_BRAND_SLUGS.has(slug.toLowerCase());
}

export const OFFICIAL_STORE_HOURS = {
  monday: "Lunedì: chiuso mattina · 16:30–20:00",
  tueSat: "Mar–Sab: 09:00–13:00 · 16:30–20:00",
  december: "Dicembre: aperto anche la domenica",
  compact:
    "Lun 16:30–20:00 (mattina chiuso) · Mar–Sab 09:00–13:00 / 16:30–20:00 · Dicembre aperto anche la domenica",
} as const;

export const STORE_CONTACT = {
  address: "Via Filippo Turati, n. 30 — 84010 San Marzano sul Sarno (SA)",
  phoneDisplay: "081 518 6476",
  phoneHref: "tel:+390815186476",
  whatsappDisplay: "351 877 8689",
  whatsappHref: "https://wa.me/393518778689",
} as const;
