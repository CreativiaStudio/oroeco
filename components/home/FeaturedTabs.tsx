"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

export interface FeaturedTab {
  id: string;
  label: string;
  products: Product[];
}

interface FeaturedTabsProps {
  tabs: FeaturedTab[];
}

/** Tab interattive delle selezioni prodotto in homepage. */
export function FeaturedTabs({ tabs }: FeaturedTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  if (!current) return null;

  return (
    <section className="border-y border-[#DEDEDE] bg-[#F7F3EC] py-10 sm:py-12 lg:py-14">
      <div className="container-luxe">
        {/* Testata editoriale allineata a sinistra, stile Baggio */}
        <div className="mb-7 sm:mb-8">
          <p className="font-serif text-base italic text-graphite-soft sm:text-lg">
            Nel nostro atelier e online.
          </p>

          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            {/* Tab orizzontali minimali */}
            <div className="-mb-px flex flex-wrap items-center gap-x-7 gap-y-2 border-b border-[#dedede] sm:gap-x-9">
              {tabs.map((tab) => {
                const isActive = active === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActive(tab.id)}
                    aria-pressed={isActive}
                    className={cn(
                      "relative pb-3.5 font-serif text-lg uppercase tracking-[0.18em] transition-colors duration-300 sm:text-xl",
                      isActive
                        ? "text-ink"
                        : "text-graphite-soft hover:text-ink",
                    )}
                  >
                    {tab.label}
                    <span
                      className={cn(
                        "absolute inset-x-0 bottom-0 h-[1.5px] origin-left bg-[#020202] transition-transform duration-500",
                        isActive ? "scale-x-100" : "scale-x-0",
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Link alla collezione completa */}
            <Link
              href="/gioielli"
              className="shrink-0 self-start pb-3.5 font-serif text-[0.72rem] uppercase tracking-[0.22em] text-[#4e423e] transition-colors duration-300 hover:text-[#020202] sm:self-auto"
            >
              Tutte le creazioni <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Griglia con stagger bidirezionale */}
        <div
          key={current.id}
          className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4"
        >
          {current.products.slice(0, 8).map((product, idx) => (
            <LuxuryReveal key={product.id} variant="up" delayMs={(idx % 4) * 75}>
              <ProductCard product={product} />
            </LuxuryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
