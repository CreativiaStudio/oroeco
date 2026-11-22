/**
 * Generatore puro TypeScript di codici a barre Code 128B in SVG vettoriale nitido.
 * Pensato per etichette gioielli (codini 70x10mm e targhette vetrina 50x25mm) e pistole barcode USB/BT.
 */

const CODE128_PATTERNS: readonly string[] = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];

const START_CODE_B = 104;
const STOP_CODE = 106;

/** Normalizza qualsiasi stringa in caratteri ASCII stampabili Code 128B (32..126). */
export function sanitizeCode128BValue(raw: string): string {
  const cleaned = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, "")
    .trim();
  return cleaned || "OROECO";
}

/** Restituisce la sequenza delle ampiezze modulo [barra, spazio, ...] in formato Code 128B. */
export function encodeCode128B(rawValue: string): number[] {
  const text = sanitizeCode128BValue(rawValue);
  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i) - 32;
    codes.push(code);
    checksum += code * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP_CODE);

  const widths: number[] = [];
  for (const symbol of codes) {
    const pattern = CODE128_PATTERNS[symbol];
    for (let j = 0; j < pattern.length; j += 1) {
      widths.push(Number(pattern[j]));
    }
  }
  return widths;
}

export interface BarcodeSvgOptions {
  height?: number;
  quietModules?: number;
  className?: string;
}

/** Genera markup `<svg>` vettoriale nitido (`shape-rendering="crispEdges"`) per il barcode Code 128B. */
export function renderBarcodeSvgString(
  rawValue: string,
  options: BarcodeSvgOptions = {},
): string {
  const height = options.height ?? 34;
  const quiet = options.quietModules ?? 6;
  const widths = encodeCode128B(rawValue);
  const totalModules = widths.reduce((sum, w) => sum + w, 0) + quiet * 2;

  const rects: string[] = [];
  let x = quiet;
  for (let i = 0; i < widths.length; i += 1) {
    const w = widths[i];
    if (i % 2 === 0) {
      rects.push(`<rect x="${x}" y="0" width="${w}" height="${height}" fill="#000000"/>`);
    }
    x += w;
  }

  const classAttr = options.className ? ` class="${options.className}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalModules} ${height}" preserveAspectRatio="none" shape-rendering="crispEdges"${classAttr}><rect width="${totalModules}" height="${height}" fill="#ffffff"/>${rects.join("")}</svg>`;
}
