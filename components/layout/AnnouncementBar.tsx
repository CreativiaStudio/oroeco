'use client';

import { useEffect, useState } from "react";
import { ShieldCheck, Truck, Gift } from "lucide-react";

const messages = [
  {
    icon: Truck,
    text: "Spedizione assicurata gratuita sopra i 150 €",
  },
  {
    icon: Gift,
    text: "Confezione regalo luxury inclusa",
  },
  {
    icon: ShieldCheck,
    text: "Consegna blindata in 24/48h",
  },
];

const ROTATION_MS = 4500;

/** Barra annunci superiore, sempre visibile in cima al sito. */
export function AnnouncementBar() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % messages.length);
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="border-y border-[#dedede] bg-[#f7f3ec] text-[#4e423e]">
      <div className="container-luxe flex h-9 items-center justify-center xl:justify-between text-[0.7rem] font-serif uppercase tracking-[0.22em] whitespace-nowrap">
        <div
          className="grid h-9 items-center overflow-hidden"
          aria-live="polite"
        >
          {messages.map(({ icon: Icon, text }, index) => {
            const isActive = index === activeIndex;
            return (
              <span
                key={text}
                aria-hidden={!isActive}
                className={`col-start-1 row-start-1 flex items-center gap-2 whitespace-nowrap transition-all duration-500 ease-out ${
                  isActive
                    ? "translate-y-0 opacity-100"
                    : "pointer-events-none translate-y-2 opacity-0"
                }`}
              >
                <Icon
                  className="h-3.5 w-3.5 shrink-0 text-gold"
                  strokeWidth={1.6}
                />
                <span className="text-[#4e423e]">{text}</span>
              </span>
            );
          })}
        </div>
        <span className="hidden xl:inline-flex items-center gap-2 text-[#6b615c] whitespace-nowrap">
          Gioielleria a San Marzano sul Sarno (SA) · dal 1992
        </span>
      </div>
    </div>
  );
}
