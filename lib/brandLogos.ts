/* ------------------------------------------------------------------ *
 *  ORO&CO — Mappa dei loghi ufficiali verificati dei 18 marchi.
 *  Tutti i file sono ospitati su Cloudflare R2 (/brands-official/).
 * ------------------------------------------------------------------ */

const R2_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

/** Percorsi dei loghi brand ufficiali indicizzati per slug. */
export const brandLogoPaths: Record<string, string> = {
  "davite-delucchi": `${R2_BASE}/brands-official/davite-delucchi.webp`,
  stroili: `${R2_BASE}/brands-official/stroili.svg`,
  nihama: `${R2_BASE}/brands-official/nihama.svg`,
  golay: `${R2_BASE}/brands-official/golay.svg`,
  "dana-oro-9-kt": `${R2_BASE}/brands-official/dana-oro-9-kt.webp`,
  "cammeo-italiano": `${R2_BASE}/brands-official/cammeo-italiano.webp`,
  gerba: `${R2_BASE}/brands-official/gerba.webp`,
  guess: `${R2_BASE}/brands-official/guess.svg`,
  bulova: `${R2_BASE}/brands-official/bulova.svg`,
  locman: `${R2_BASE}/brands-official/locman.svg`,
  "paul-picot": `${R2_BASE}/brands-official/paul-picot.webp`,
  "villeroy-boch": `${R2_BASE}/brands-official/villeroy-boch.svg`,
  lladro: `${R2_BASE}/brands-official/lladro.svg`,
  cuorematto: `${R2_BASE}/brands-official/cuorematto.svg`,
  unoaerre: `${R2_BASE}/brands-official/unoaerre.svg`,
  "gli-alberelli": `${R2_BASE}/brands-official/gli-alberelli.webp`,
  ducati: `${R2_BASE}/brands-official/ducati.svg`,
  amen: `${R2_BASE}/brands-official/amen.webp`,
};

/** Restituisce il percorso del logo ufficiale per slug. */
export function getBrandLogoPath(slug: string): string {
  return brandLogoPaths[slug] ?? `${R2_BASE}/brands-official/${slug}.svg`;
}

/**
 * Classi di armonizzazione ottica (Optical Area Balancing) calcolate sull'aspect ratio
 * reale di ciascun logo, per garantire identico peso visivo tra wordmark larghi e stemmi verticali.
 */
export const brandLogoOpticalClass: Record<string, string> = {
  guess: "h-[24px] sm:h-[30px]",
  bulova: "h-[25px] sm:h-[31px]",
  lladro: "h-[28px] sm:h-[34px]",
  unoaerre: "h-[30px] sm:h-[36px]",
  locman: "h-[30px] sm:h-[36px]",
  nihama: "h-[32px] sm:h-[39px]",
  golay: "h-[32px] sm:h-[39px]",
  amen: "h-[34px] sm:h-[41px]",
  stroili: "h-[35px] sm:h-[43px]",
  "paul-picot": "h-[38px] sm:h-[46px]",
  "gli-alberelli": "h-[40px] sm:h-[49px]",
  "dana-oro-9-kt": "h-[40px] sm:h-[48px]",
  gerba: "h-[44px] sm:h-[54px]",
  "villeroy-boch": "h-[44px] sm:h-[54px]",
  cuorematto: "h-[48px] sm:h-[58px]",
  "davite-delucchi": "h-[48px] sm:h-[58px]",
  ducati: "h-[48px] sm:h-[60px]",
  "cammeo-italiano": "h-[54px] sm:h-[66px]",
};

export function getBrandLogoOpticalClass(slug: string): string {
  return brandLogoOpticalClass[slug] ?? "h-[36px] sm:h-[44px]";
}
