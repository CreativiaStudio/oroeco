export const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

/**
 * Converte un path relativo (es. "/images/hero/hero-main.jpg" o "hero/hero-main.jpg")
 * nell'URL pubblico su Cloudflare R2. Mantiene intatti gli URL esterni già assoluti.
 */
export function mediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  const trimmed = pathOrUrl.trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const cleanKey = trimmed
    .replace(/^\/+/, "")
    .replace(/^images\//, "");

  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

export const MEDIA_FOLDERS = [
  { id: "", label: "Tutti i file" },
  { id: "products/", label: "Prodotti" },
  { id: "hero/", label: "Hero & Banner" },
  { id: "editorial/", label: "Editoriali" },
  { id: "natale/", label: "Natale" },
  { id: "brands/", label: "Loghi Brand" },
  { id: "instagram/", label: "Instagram" },
  { id: "videos/", label: "Video" },
  { id: "uploads/", label: "Caricamenti Admin" },
] as const;
