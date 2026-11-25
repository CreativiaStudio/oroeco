import Link from "next/link";
import { brands } from "@/lib/catalog";
import { getBrandLogoOpticalClass, getBrandLogoPath } from "@/lib/brandLogos";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";

const ROW_TOP_SLUGS = [
  "davite-delucchi",
  "stroili",
  "villeroy-boch",
  "nihama",
  "cammeo-italiano",
  "bulova",
  "paul-picot",
  "golay",
];

const ROW_BOTTOM_SLUGS = [
  "unoaerre",
  "gerba",
  "locman",
  "cuorematto",
  "guess",
  "dana-oro-9-kt",
  "lladro",
  "gli-alberelli",
];

/**
 * Rassegna dei marchi ufficiali in gioielleria:
 * due righe asincrone in senso opposto con armonizzazione ottica delle proporzioni,
 * monocromatiche in grafite a riposo e nel colore originale della maison in hover.
 */
export function BrandBar() {
  const bySlug = new Map(brands.map((b) => [b.slug, b]));

  const topBrands = ROW_TOP_SLUGS.map((s) => bySlug.get(s)).filter(
    (b): b is NonNullable<typeof b> => Boolean(b),
  );
  const bottomBrands = ROW_BOTTOM_SLUGS.map((s) => bySlug.get(s)).filter(
    (b): b is NonNullable<typeof b> => Boolean(b),
  );

  const rowTop = [...topBrands, ...topBrands];
  const rowBottom = [...bottomBrands, ...bottomBrands];

  return (
    <section className="border-y border-[#dedede] bg-white py-16 sm:py-20">
      <div className="container-luxe mb-10 text-center">
        <LuxuryReveal variant="up">
          <span className="eyebrow">I Marchi della Gioielleria</span>
          <h2 className="mt-3 font-serif text-2xl uppercase tracking-[0.12em] text-[#020202] sm:text-3xl">
            Le nostre firme, un&apos;unica selezione
          </h2>
        </LuxuryReveal>
      </div>

      <div className="relative space-y-6 overflow-hidden py-3">
        {/* Riga 1 — scorrimento fluido verso sinistra (42s) */}
        <div className="group/row relative overflow-hidden">
          <div className="flex w-max animate-marquee items-center will-change-transform group-hover/row:[animation-play-state:paused]">
            {rowTop.map((brand, index) => (
              <div
                key={`top-${brand.slug}-${index}`}
                className="flex h-20 w-[56vw] shrink-0 items-center justify-center sm:h-24 sm:w-[38vw] lg:w-[26vw] xl:w-[22vw]"
              >
                <Link
                  href={`/brand/${brand.slug}`}
                  aria-label={brand.name}
                  title={brand.name}
                  className="group/logo flex h-full w-full items-center justify-center px-6"
                >
                  <img
                    src={getBrandLogoPath(brand.slug)}
                    alt={brand.name}
                    loading="lazy"
                    className={`${getBrandLogoOpticalClass(brand.slug)} w-auto max-w-[180px] object-contain opacity-60 grayscale brightness-[0.82] contrast-[1.08] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/logo:scale-[1.08] group-hover/logo:opacity-100 group-hover/logo:grayscale-0 group-hover/logo:brightness-100 group-hover/logo:contrast-100`}
                  />
                </Link>
                <span
                  aria-hidden="true"
                  className="h-1 w-1 shrink-0 rotate-45 bg-gold/45"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Riga 2 — scorrimento fluido asincrono in senso opposto (52s) */}
        <div className="group/row relative overflow-hidden">
          <div className="flex w-max animate-marquee-reverse items-center will-change-transform group-hover/row:[animation-play-state:paused]">
            {rowBottom.map((brand, index) => (
              <div
                key={`bottom-${brand.slug}-${index}`}
                className="flex h-20 w-[56vw] shrink-0 items-center justify-center sm:h-24 sm:w-[38vw] lg:w-[26vw] xl:w-[22vw]"
              >
                <Link
                  href={`/brand/${brand.slug}`}
                  aria-label={brand.name}
                  title={brand.name}
                  className="group/logo flex h-full w-full items-center justify-center px-6"
                >
                  <img
                    src={getBrandLogoPath(brand.slug)}
                    alt={brand.name}
                    loading="lazy"
                    className={`${getBrandLogoOpticalClass(brand.slug)} w-auto max-w-[180px] object-contain opacity-60 grayscale brightness-[0.82] contrast-[1.08] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/logo:scale-[1.08] group-hover/logo:opacity-100 group-hover/logo:grayscale-0 group-hover/logo:brightness-100 group-hover/logo:contrast-100`}
                  />
                </Link>
                <span
                  aria-hidden="true"
                  className="h-1 w-1 shrink-0 rotate-45 bg-gold/45"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Sfumature laterali morbide */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-white via-white/85 to-transparent sm:w-36" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-white via-white/85 to-transparent sm:w-36" />
      </div>

      <div className="container-luxe mt-10 text-center">
        <LuxuryReveal variant="up" delayMs={100}>
          <Link
            href="/brand"
            className="inline-block border-b border-[#020202] pb-1 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#020202] transition-opacity hover:opacity-70"
          >
            Scopri tutti i marchi
          </Link>
        </LuxuryReveal>
      </div>
    </section>
  );
}
