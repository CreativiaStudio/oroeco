import Link from "next/link";
import { brands } from "@/lib/catalog";

/** Rassegna dei marchi trattati in gioielleria: due righe fluide in senso opposto (~3 firme visibili per riga). */
export function BrandBar() {
  const half = Math.ceil(brands.length / 2);
  const topBrands = brands.slice(0, half);
  const bottomBrands = brands.slice(half);

  const rowTop = [...topBrands, ...topBrands];
  const rowBottom = [...bottomBrands, ...bottomBrands];

  return (
    <section className="border-y border-[#dedede] bg-white py-16 sm:py-20">
      <div className="container-luxe mb-10 text-center">
        <span className="eyebrow">I Marchi della Gioielleria</span>
        <h2 className="mt-3 font-serif text-2xl uppercase tracking-[0.12em] text-[#020202] sm:text-3xl">
          Diciotto firme, un&apos;unica selezione
        </h2>
      </div>

      <div className="relative space-y-5 overflow-hidden py-2">
        {/* Riga 1 — scorrimento fluido verso sinistra */}
        <div className="group relative overflow-hidden">
          <div className="flex w-max animate-marquee items-center will-change-transform group-hover:[animation-play-state:paused]">
            {rowTop.map((brand, index) => (
              <div
                key={`top-${brand.slug}-${index}`}
                className="flex w-[65vw] shrink-0 items-center justify-center sm:w-[44vw] lg:w-[33.333vw]"
              >
                <Link
                  href={`/brand?marca=${brand.slug}`}
                  className="whitespace-nowrap font-serif text-xl uppercase tracking-[0.24em] text-[#4e423e] transition-colors duration-300 hover:text-[#020202] sm:text-2xl"
                >
                  {brand.name}
                </Link>
                <span
                  aria-hidden="true"
                  className="ml-auto h-1 w-1 rotate-45 bg-gold/60"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Riga 2 — scorrimento fluido in senso opposto (verso destra) */}
        <div className="group relative overflow-hidden">
          <div className="flex w-max animate-marquee-reverse items-center will-change-transform group-hover:[animation-play-state:paused]">
            {rowBottom.map((brand, index) => (
              <div
                key={`bottom-${brand.slug}-${index}`}
                className="flex w-[65vw] shrink-0 items-center justify-center sm:w-[44vw] lg:w-[33.333vw]"
              >
                <Link
                  href={`/brand?marca=${brand.slug}`}
                  className="whitespace-nowrap font-serif text-xl uppercase tracking-[0.24em] text-[#4e423e] transition-colors duration-300 hover:text-[#020202] sm:text-2xl"
                >
                  {brand.name}
                </Link>
                <span
                  aria-hidden="true"
                  className="ml-auto h-1 w-1 rotate-45 bg-gold/60"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sfumature laterali morbide */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white via-white/80 to-transparent sm:w-32" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white via-white/80 to-transparent sm:w-32" />
      </div>

      <div className="container-luxe mt-10 text-center">
        <Link
          href="/brand"
          className="inline-block border-b border-[#020202] pb-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#020202] transition-opacity hover:opacity-70"
        >
          Scopri tutti i marchi
        </Link>
      </div>
    </section>
  );
}
