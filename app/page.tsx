import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedTabs, type FeaturedTab } from "@/components/home/FeaturedTabs";
import { HeroSection } from "@/components/home/HeroSection";
import { BrandBar } from "@/components/home/BrandBar";
import { AtelierStory } from "@/components/home/AtelierStory";
import { TrustBadges } from "@/components/home/TrustBadges";
import { VideoShowcaseCarousel } from "@/components/home/VideoShowcaseCarousel";
import { EditorialQuadrants } from "@/components/home/EditorialQuadrants";
import { ChristmasShowcase } from "@/components/home/ChristmasShowcase";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import {
  getLiveAllApprovedProducts,
  getLiveChristmasProducts,
  getLiveFeaturedProducts,
} from "@/lib/liveCatalog";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";

export default async function HomePage() {
  const liveFeatured = await getLiveFeaturedProducts();
  const liveAll = await getLiveAllApprovedProducts();
  const liveChristmas = await getLiveChristmasProducts();

  const bestsellers = [...liveFeatured].sort(
    (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
  );
  const seed = liveAll.slice(0, 8);
  const liveDiamonds = liveAll
    .filter((p) => p.category === "gioielli" && p.price >= 250)
    .slice(0, 8);

  const tabs: FeaturedTab[] = [
    {
      id: "bestseller",
      label: "Bestseller",
      products: bestsellers.length >= 4 ? bestsellers : seed,
    },
    {
      id: "nuovi",
      label: "Nuovi Arrivi",
      products: liveAll.slice(0, 8),
    },
    {
      id: "natale",
      label: "Speciale Natale 2026",
      products: liveChristmas.slice(0, 8),
    },
    {
      id: "diamanti",
      label: "Diamanti & Oro",
      products: liveDiamonds,
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
          <LuxuryReveal variant="line" delayMs={100} className="mx-auto mt-6 h-px w-16 bg-gold/70">
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

      <section className="bg-white py-20 sm:py-24">
        <div className="container-luxe">
          <FeaturedTabs tabs={tabs} />
        </div>
      </section>

      <EditorialQuadrants />
      <ChristmasShowcase />
      <BrandBar />
      <AtelierStory />
      <CategoryGrid />
      <TrustBadges />
      <VideoShowcaseCarousel />
    </>
  );
}
