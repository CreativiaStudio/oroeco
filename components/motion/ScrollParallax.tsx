"use client";

import { ReactNode, useEffect, useRef } from "react";

/**
 * Parallasse continua bidirezionale 60fps legata allo scroll (andata e ritorno).
 * Muove dolcemente il contenuto fotografico all'interno della sua cornice overflow-hidden
 * dando profondità ottica continua sia scendendo sia risalendo la pagina.
 */
export function ScrollParallax({
  children,
  className = "",
  speed = 26,
  scale = 1.08,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
  scale?: number;
}) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    let rafId = 0;
    let currentY = 0;

    const tick = () => {
      const rect = outer.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Solo se vicino o dentro il viewport
      if (rect.bottom >= -120 && rect.top <= vh + 120) {
        // progress da -1 (appena entra dal basso) a +1 (sta uscendo in alto)
        const center = rect.top + rect.height / 2;
        const normalized = Math.max(-1, Math.min(1, (vh / 2 - center) / (vh / 2 + rect.height / 2)));
        const targetY = normalized * speed;
        // Smorzamento fluido (lerp) così il cambio di direzione andata->ritorno è setoso
        currentY += (targetY - currentY) * 0.14;
        inner.style.transform = `translate3d(0, ${currentY.toFixed(2)}px, 0) scale(${scale})`;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [speed, scale]);

  return (
    <div ref={outerRef} className={`overflow-hidden ${className}`}>
      <div
        ref={innerRef}
        className="h-full w-full will-change-transform"
        style={{ transform: `translate3d(0, 0, 0) scale(${scale})` }}
      >
        {children}
      </div>
    </div>
  );
}
