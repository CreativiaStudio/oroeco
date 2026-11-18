/* ------------------------------------------------------------------ *
 *  ORO&CO — Mappa dei loghi ufficiali dei 18 marchi in gioielleria.
 *  Ogni slug punta al file SVG dedicato in /public/images/brands.
 * ------------------------------------------------------------------ */

/** Percorsi dei loghi brand indicizzati per slug. */
export const brandLogoPaths: Record<string, string> = {
  "davite-delucchi": "/images/brands/davite-delucchi.svg",
  stroili: "/images/brands/stroili.svg",
  nihama: "/images/brands/nihama.svg",
  golay: "/images/brands/golay.svg",
  "dana-oro-9-kt": "/images/brands/dana-oro-9-kt.svg",
  "cammeo-italiano": "/images/brands/cammeo-italiano.svg",
  gerba: "/images/brands/gerba.svg",
  guess: "/images/brands/guess.svg",
  bulova: "/images/brands/bulova.svg",
  locman: "/images/brands/locman.svg",
  "paul-picot": "/images/brands/paul-picot.svg",
  "villeroy-boch": "/images/brands/villeroy-boch.svg",
  lladro: "/images/brands/lladro.svg",
  cuorematto: "/images/brands/cuorematto.svg",
  unoaerre: "/images/brands/unoaerre.svg",
  "gli-alberelli": "/images/brands/gli-alberelli.svg",
  ducati: "/images/brands/ducati.svg",
  amen: "/images/brands/amen.svg",
};

/** Restituisce il percorso del logo per slug, con fallback convenzionale. */
export function getBrandLogoPath(slug: string): string {
  return brandLogoPaths[slug] ?? `/images/brands/${slug}.svg`;
}
