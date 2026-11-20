"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
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

/** Carosello Bestseller essenziale (e tab opzionali se presenti più collezioni). */
export function FeaturedTabs({ tabs }: FeaturedTabsProps) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  if (!current) return null;

  const isSingle = tabs.length === 1;

  const scrollByCard = (direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const firstCard = el.querySelector<HTMLElement>("[data-bestseller-card]");
    const step = firstCard ? firstCard.offsetWidth + 20 : 300;
    el.scrollBy({ left: direction * step * 2, behavior: "smooth" });
  };

  return (
    <section className="border-y border-[#DEDEDE] bg-[#F7F3EC] py-14 sm:py-16 lg:py-20">
      <div className="container-luxe">
        {/* Testata editoriale */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-serif text-base italic text-graphite-soft sm:text-lg">
              Nel nostro atelier e online.
            </p>
            {isSingle ? (
              <h2 className="mt-2 font-serif text-2xl uppercase tracking-[0.16em] text-ink sm:text-3xl">
                {current.label}
              </h2>
            ) : (
              <div className="-mb-px mt-5 flex flex-wrap items-center gap-x-7 gap-y-2 border-b border-[#dedede] sm:gap-x-9">
                {tabs.map((tab) => {
                  const isActive = active === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActive(tab.id);
                        scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
                      }}
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
            )}
          </div>

          <div className="flex items-center gap-4 self-start sm:self-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollByCard(-1)}
                aria-label="Scorri prodotti a sinistra"
                className="flex h-10 w-10 items-center justify-center border border-[#dedede] bg-white text-[#020202] transition-colors hover:border-gold hover:text-gold"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                onClick={() => scrollByCard(1)}
                aria-label="Scorri prodotti a destra"
                className="flex h-10 w-10 items-center justify-center border border-[#dedede] bg-white text-[#020202] transition-colors hover:border-gold hover:text-gold"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>

            <Link
              href="/gioielli"
              className="shrink-0 font-serif text-[0.72rem] uppercase tracking-[0.22em] text-[#4e423e] transition-colors duration-300 hover:text-[#020202]"
            >
              Tutte le creazioni <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* Carosello orizzontale scorrevole */}
        <div
          key={current.id}
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {current.products.slice(0, 12).map((product) => (
            <div
              key={product.id}
              data-bestseller-card
              className="w-[72vw] shrink-0 snap-start sm:w-[calc((100%-20px)/2)] lg:w-[calc((100%-60px)/4)]"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
