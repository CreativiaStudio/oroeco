/* ------------------------------------------------------------------ *
 *  ORO&CO — Mappa dei loghi ufficiali dei 18 marchi in gioielleria.
 *  Ogni slug punta al file SVG dedicato in /public/images/brands.
 * ------------------------------------------------------------------ */

/** Percorsi dei loghi brand indicizzati per slug. */
export const brandLogoPaths: Record<string, string> = {
  "davite-delucchi": "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/davite-delucchi.svg",
  stroili: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/stroili.svg",
  nihama: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/nihama.svg",
  golay: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/golay.svg",
  "dana-oro-9-kt": "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/dana-oro-9-kt.svg",
  "cammeo-italiano": "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/cammeo-italiano.svg",
  gerba: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/gerba.svg",
  guess: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/guess.svg",
  bulova: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/bulova.svg",
  locman: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/locman.svg",
  "paul-picot": "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/paul-picot.svg",
  "villeroy-boch": "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/villeroy-boch.svg",
  lladro: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/lladro.svg",
  cuorematto: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/cuorematto.svg",
  unoaerre: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/unoaerre.svg",
  "gli-alberelli": "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/gli-alberelli.svg",
  ducati: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/ducati.svg",
  amen: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/amen.svg",
};

/** Restituisce il percorso del logo per slug, con fallback convenzionale. */
export function getBrandLogoPath(slug: string): string {
  return brandLogoPaths[slug] ?? `https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/brands/${slug}.svg`;
}
