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
