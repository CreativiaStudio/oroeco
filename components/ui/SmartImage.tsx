"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { cn, initialsFromName } from "@/lib/utils";
import { mediaUrl } from "@/lib/media";

interface SmartImageProps {
  src?: string;
  alt: string;
  /** Classi applicate al contenitore (es. aspect ratio, altezza). */
  className?: string;
  /** Classi extra applicate all'immagine (es. transizioni hover). */
  imageClassName?: string;
  /** Attributo sizes di next/image. */
  sizes?: string;
  priority?: boolean;
  /** Etichetta mostrata nel fallback elegante. */
  fallbackLabel?: string;
}

/**
 * Immagine con caricamento sicuro: usa `next/image` e, in caso di errore,
 * mostra un placeholder luxury con monogramma dorato invece di un'icona rotta.
 * Il contenitore è sempre `relative`, quindi l'immagine usa `fill`.
 */
export function SmartImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw",
  priority = false,
  fallbackLabel,
}: SmartImageProps) {
  const resolvedSrc = mediaUrl(src);
  const [failed, setFailed] = useState(!resolvedSrc);

  useEffect(() => {
    setFailed(!resolvedSrc);
  }, [resolvedSrc]);

  return (
    <div className={cn("relative overflow-hidden bg-pearl", className)}>
      {failed || !resolvedSrc ? (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-[#f7f4ed] via-[#efe9dc] to-[#e3d8c1]">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/50 font-serif text-sm text-gold">
              {initialsFromName(fallbackLabel ?? alt)}
            </span>
            <span className="max-w-[80%] font-serif text-[0.7rem] uppercase tracking-[0.25em] text-graphite-soft">
              ORO&amp;CO
            </span>
          </div>
        </div>
      ) : (
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailed(true)}
          className={cn("object-cover", imageClassName)}
        />
      )}
    </div>
  );
}
