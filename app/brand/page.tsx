import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHero } from "@/components/catalog/PageHero";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";
import { getBrandLogoCardOpticalClass, getBrandLogoPath } from "@/lib/brandLogos";
import { getAllBrands } from "@/lib/catalog";
import { getLiveAllApprovedProducts } from "@/lib/liveCatalog";

export const metadata: Metadata = {
  title: "Brand — I 18 Marchi della Gioielleria",
  description:
    "I marchi trattati da ORO&CO: Golay, Unoaerre, Davite & Delucchi, Nihama, Stroili, Bulova, Locman, Paul Picot, Guess, Villeroy & Boch, Lladró e molti altri.",
};

export default async function BrandPage({
  searchParams,
}: {
  searchParams: Promise<{ marca?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialFilter = Array.isArray(params.marca)
    ? params.marca[0]
    : params.marca;
  const brandList = getAllBrands();
  if (initialFilter && brandList.some((brand) => brand.slug === initialFilter)) {
    redirect("/brand/" + initialFilter);
  }
  const products = await getLiveAllApprovedProducts();
  const countsMap = new Map<string, number>();
  for (const p of products) {
    countsMap.set(p.brandSlug, (countsMap.get(p.brandSlug) ?? 0) + 1);
  }

  return (
    <>
      <PageHero
        eyebrow="Le Firme della Gioielleria"
        title="Brand"
        description="Diciotto marchi selezionati tra alta gioielleria, orologeria e arte della tavola: le firme che da sempre accompagnano la storia di ORO&CO."
        image="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/paul-picot/paul_picot_yachtman_01.jpg"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Brand" }]}
      />

      <section className="bg-[#f7f3ec]/60 border-b border-[#dedede]">
        <div className="container-luxe grid grid-cols-1 items-stretch gap-6 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 sm:py-20">
          {brandList.map((brand, idx) => (
            <LuxuryReveal key={brand.id} variant="up" delayMs={(idx % 4) * 70} className="h-full">
              <Link
                href={`/brand/${brand.slug}`}
                className="group flex h-full flex-col justify-between border border-[#dedede] bg-white p-7 transition-all duration-300 hover:border-gold hover:shadow-[0_14px_34px_rgba(2,2,2,0.06)] sm:p-8"
              >
                <div className="mb-6 flex h-28 items-center justify-center border-b border-[#ece6dc] px-4 pb-5 sm:h-32">
                  <img
                    src={getBrandLogoPath(brand.slug)}
                    alt={brand.name}
                    className={`${getBrandLogoCardOpticalClass(brand.slug)} w-auto max-w-[200px] object-contain transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105`}
                  />
                </div>
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-[#9A7D43]">
                  {brand.country}
                </p>
                <h2 className="mt-1 font-serif text-lg text-[#020202]">
                  {brand.name}
                </h2>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#4e423e]">
                  {brand.description}
                </p>
                <span className="mt-5 inline-flex items-center justify-between border-t border-[#f0ece4] pt-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#020202] transition-colors group-hover:text-gold">
                  <span>Scopri i prodotti</span>
                  <span>{countsMap.get(brand.slug) ?? 0} →</span>
                </span>
              </Link>
            </LuxuryReveal>
          ))}
        </div>
      </section>
    </>
  );
}
