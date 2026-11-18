import Link from "next/link";
import { brands } from "@/lib/catalog";

/** Rassegna dei marchi trattati in gioielleria (marquee elegante). */
export function BrandBar() {
  const loop = [...brands, ...brands];

  return (
    <section className="border-y border-[#dedede] bg-white py-16 sm:py-20">
      <div className="container-luxe mb-9 text-center">
        <span className="eyebrow">I Marchi della Gioielleria</span>
        <h2 className="mt-3 font-serif text-2xl uppercase tracking-[0.12em] text-[#020202] sm:text-3xl">
          Diciotto firme, un&apos;unica selezione
        </h2>
      </div>

      <div className="group relative overflow-hidden">
        <div className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
          {loop.map((brand, index) => (
            <Link
              key={`${brand.slug}-${index}`}
              href={`/brand?marca=${brand.slug}`}
              className="mx-7 whitespace-nowrap font-serif text-lg uppercase tracking-[0.2em] text-[#4e423e] transition-colors hover:text-[#020202] sm:mx-9 sm:text-xl"
            >
              {brand.name}
            </Link>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent" />
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
