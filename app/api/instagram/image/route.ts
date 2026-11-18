import { NextResponse } from "next/server";

const ALLOWED_HOST_SUFFIXES = [
  ".cdninstagram.com",
  ".fbcdn.net",
  ".instagram.com",
];

function isAllowedImageUrl(value: string): boolean {
  if (!value.startsWith("https://")) return false;

  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname === "instagram.com" ||
      hostname.endsWith(".instagram.com") ||
      ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
    );
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");

  if (!url || !isAllowedImageUrl(url)) {
    return new NextResponse("URL immagine non valido", { status: 400 });
  }

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return new NextResponse("Immagine non disponibile", {
        status: 502,
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType =
      response.headers.get("content-type") ?? "application/octet-stream";

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Impossibile recuperare l'immagine", {
      status: 502,
    });
  }
}
