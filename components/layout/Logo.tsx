"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { OfficialLogoSvg } from "@/components/layout/OfficialLogoSvg";

type LogoVariant = "wordmark" | "image" | "auto";

interface LogoProps {
  /**
   * `wordmark`  → marchio ufficiale vettoriale (OfficialLogoSvg).
   * `image`     → logo ufficiale /images/logo-oroeco.jpeg (per sfondi scuri), fallback su OfficialLogoSvg.
   * `auto`      → marchio ufficiale vettoriale (OfficialLogoSvg).
   */
  variant?: LogoVariant;
  className?: string;
  href?: string;
  /** Nasconde il payoff "since 1992". */
  compact?: boolean;
  /**
   * `"dark"`  → wordmark su sfondo bianco solido (crest e dettagli oro).
   * `"light"` → header trasparente sopra l'Hero: wordmark bianco con dettagli avorio.
   */
  tone?: "dark" | "light";
}

/**
 * Emblema vettoriale: semicerchio filigranato dorato con arco interno di 11 perle,
 * come il crest del logo ufficiale ORO&co.
 */
export function OrnamentCrest({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 40"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Arco esterno filigranato: semicerchio a 'C' aperto verso destra */}
      <path
        d="M23.5 5.5C12.5 5.5 5 11.8 5 20s7.5 14.5 18.5 14.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      {/* Eco interno dell'arco, più sottile */}
      <path
        d="M22.5 8.8C13.8 8.8 8.2 13.7 8.2 20s5.6 11.2 14.3 11.2"
        stroke="currentColor"
        strokeWidth="0.85"
        strokeLinecap="round"
        opacity="0.68"
      />
      {/* Voluta superiore della filigrana */}
      <path
        d="M10.2 9.3c-3.2-.9-4.4-3.6-2.6-5.4 1.3-1.3 3.3-.6 3.2 1.1-.1 1.2-1.4 1.7-2.2 1"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Voluta inferiore della filigrana */}
      <path
        d="M10.2 30.7c-3.2.9-4.4 3.6-2.6 5.4 1.3 1.3 3.3.6 3.2-1.1-.1-1.2-1.4-1.7-2.2-1"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Arco interno di 11 perle lungo la curva interna della 'C' */}
      <g fill="currentColor">
        <circle cx="11.6" cy="17.2" r="0.85" />
        <circle cx="12.8" cy="14.9" r="0.85" />
        <circle cx="14.8" cy="13.3" r="0.85" />
        <circle cx="17.4" cy="12.4" r="0.85" />
        <circle cx="20.3" cy="12.0" r="0.85" />
        <circle cx="11.0" cy="20" r="1" />
        <circle cx="11.6" cy="22.8" r="0.85" />
        <circle cx="12.8" cy="25.1" r="0.85" />
        <circle cx="14.8" cy="26.7" r="0.85" />
        <circle cx="17.4" cy="27.6" r="0.85" />
        <circle cx="20.3" cy="28.0" r="0.85" />
      </g>
      {/* Terminali dell'arco */}
      <circle cx="23.5" cy="5.5" r="1.1" fill="currentColor" />
      <circle cx="23.5" cy="34.5" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  variant = "auto",
  className,
  href = "/",
  compact = false,
  tone = "dark",
}: LogoProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (variant === "image" && !imageFailed) {
    return (
      <Link
        href={href}
        aria-label="ORO&CO — Gioielleria e Alta Orologeria dal 1992"
        className={cn(
          // Il logo ufficiale è quadrato con abbondante fondo blu: il riquadro
          // ha il rapporto reale del contenuto (~3.6:1) e ritaglia il resto.
          "relative block h-11 aspect-[3.6] shrink-0 overflow-hidden rounded-sm bg-[#012236]",
          className,
        )}
      >
        <Image
          src="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/logo-oroeco.jpeg"
          alt="ORO&CO — Gioielleria since 1992"
          fill
          sizes="180px"
          priority
          className="object-cover object-[50%_35%]"
          onError={() => setImageFailed(true)}
        />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-label="ORO&co — since 1992 — Gioielleria e Alta Orologeria"
      className={cn(
        "group inline-flex items-center transition-opacity duration-300 hover:opacity-85",
        className,
      )}
    >
      <OfficialLogoSvg
        tone={tone}
        className={compact ? "h-9 sm:h-11 w-auto" : "h-11 sm:h-12 w-auto"}
      />
    </Link>
  );
}
