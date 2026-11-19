"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Provider di Smooth Scroll inerziale luxury (Lenis) + barra di progressione filo d'oro 60fps.
 * Traccia inoltre la direzione di scroll (andata / ritorno) su documentElement.dataset.scrollDir.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateProgress = (scrollY: number) => {
      const bar = progressRef.current;
      if (!bar) return;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
      bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    };

    if (prefersReduced) {
      const onScroll = () => updateProgress(window.scrollY);
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => window.removeEventListener("scroll", onScroll);
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.92,
      touchMultiplier: 1.2,
    });

    let lastY = window.scrollY;
    document.documentElement.dataset.scrollDir = "down";

    lenis.on("scroll", ({ scroll }: { scroll: number }) => {
      if (scroll > lastY + 1) {
        document.documentElement.dataset.scrollDir = "down";
      } else if (scroll < lastY - 1) {
        document.documentElement.dataset.scrollDir = "up";
      }
      lastY = scroll;
      updateProgress(scroll);
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    updateProgress(window.scrollY);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {/* Filo d'oro di progressione lettura (andata e ritorno, GPU scaleX) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[2px] bg-transparent"
      >
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-gradient-to-r from-[#8c6a2b] via-[#c5a059] to-[#e7d9b8] will-change-transform"
          style={{ transform: "scaleX(0)" }}
        />
      </div>
      {children}
    </>
  );
}
