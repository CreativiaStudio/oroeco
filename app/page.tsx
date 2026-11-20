import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedTabs, type FeaturedTab } from "@/components/home/FeaturedTabs";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { BrandBar } from "@/components/home/BrandBar";
import { AtelierStory } from "@/components/home/AtelierStory";
import { TrustBadges } from "@/components/home/TrustBadges";
import { VideoShowcaseCarousel } from "@/components/home/VideoShowcaseCarousel";
import { EditorialQuadrants } from "@/components/home/EditorialQuadrants";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { isInStoreOnlyBrand, isRemovedBrand } from "@/lib/brandPolicy";
import {
  getLiveAllApprovedProducts,
  getLiveFeaturedProducts,
} from "@/lib/liveCatalog";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [liveFeatured, liveAll] = await Promise.all([
    getLiveFeaturedProducts(),
    getLiveAllApprovedProducts(),
  ]);

  const filterOnlineSellable = <T extends { brandSlug: string }>(items: T[]) =>
    items.filter(
      (p) => !isInStoreOnlyBrand(p.brandSlug) && !isRemovedBrand(p.brandSlug),
    );

  const bestsellers = filterOnlineSellable([...liveFeatured]).sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  );
  const seed = filterOnlineSellable(liveAll).slice(0, 12);

  const tabs: FeaturedTab[] = [
    {
      id: "bestseller",
      label: "Bestseller",
      products: (bestsellers.length >= 4 ? bestsellers : seed).slice(0, 12),
    },
  ];

  return (
    <>
      <HeroSection />

      <AnnouncementBar />

      <section className="border-b border-[#eaeaea] bg-white py-20 text-center sm:py-24">
        <div className="container-luxe">
          <LuxuryReveal variant="up">
            <p className="text-[11px] uppercase tracking-[0.35em] text-[#8a8a8a]">
              CREATI PER EMOZIONARE · DAL 1992
            </p>
          </LuxuryReveal>
          <LuxuryReveal
            variant="line"
            delayMs={100}
            className="mx-auto mt-6 h-px w-16 bg-gold/70"
          >
            <span className="sr-only">Separatore</span>
          </LuxuryReveal>
          <LuxuryReveal variant="up" delayMs={160}>
            <blockquote className="mx-auto mt-7 max-w-4xl font-serif text-xl uppercase leading-[1.5] tracking-[0.08em] text-[#020202] sm:text-2xl lg:text-[1.85rem]">
              Ogni prezioso ORO&amp;CO è una promessa
              <br className="hidden md:inline" />
              di luce eterna, selezionata con perizia
              <br className="hidden md:inline" />
              gemmologica e custodita nel tempo.
            </blockquote>
          </LuxuryReveal>
          <LuxuryReveal variant="up" delayMs={260}>
            <p className="mt-8 text-xs uppercase tracking-[0.25em] text-[#8a8a8a]">
              Gioielleria ORO&amp;CO — San Marzano sul Sarno
            </p>
          </LuxuryReveal>
        </div>
      </section>

      <FeaturedTabs tabs={tabs} />

      <ServicesSection />

      <BrandBar />

      <EditorialQuadrants />

      <AtelierStory />

      <CategoryGrid />

      <TrustBadges />

      <VideoShowcaseCarousel />
    </>
  );
}
