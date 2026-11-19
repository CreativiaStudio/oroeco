"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

export type LuxuryRevealVariant =
  | "up"
  | "scale"
  | "curtain"
  | "left"
  | "right"
  | "line";

type RevealState = "below" | "visible" | "above";

/**
 * Motore di animazione bidirezionale Direction-Aware (Andata & Ritorno).
 * - In ANDATA (scroll giù): l'elemento entra fluidamente dal basso verso l'alto ("below" -> "visible").
 * - In RITORNO (scroll su): l'elemento uscito in alto ("above") rientra morbidamente dall'alto verso il basso ("above" -> "visible").
 * Tutte le transizioni sono 100% GPU-only con curva Punch & Glide (15/85).
 */
export function LuxuryReveal({
  children,
  className = "",
  delayMs = 0,
  variant = "up",
  as = "div",
  once = false,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  variant?: LuxuryRevealVariant;
  as?: "div" | "section" | "article";
  once?: boolean;
}) {
  const [state, setState] = useState<RevealState>("below");
  const revealRef = useRef<HTMLDivElement | null>(null);
  const hasShownRef = useRef(false);

  useEffect(() => {
    const element = revealRef.current;
    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setState("visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasShownRef.current = true;
          setState("visible");
        } else if (!once || !hasShownRef.current) {
          // Distingue esattamente se l'elemento è uscito sopra (pronto per il ritorno dall'alto)
          // oppure è sotto il viewport (pronto per l'andata dal basso)
          const rect = entry.boundingClientRect;
          if (rect.top < 0) {
            setState("above");
          } else {
            setState("below");
          }
        }
      },
      {
        rootMargin: "-4% 0px -4% 0px",
        threshold: 0.06,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [once]);

  const Tag = as;
  const classes = [
    "luxury-reveal",
    `luxury-variant-${variant}`,
    state === "visible" ? "is-visible" : state === "above" ? "is-above" : "is-below",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      ref={revealRef}
      className={classes}
      style={{
        transitionDelay: state === "visible" && delayMs ? `${delayMs}ms` : "0ms",
      }}
    >
      {children}
    </Tag>
  );
}
