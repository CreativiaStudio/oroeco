import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { SectionHeading } from "@/components/ui/SectionHeading";

const R2_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const categories = [
  {
    label: "Gioielli",
    href: "/gioielli",
    description: "Oro, diamanti e pietre certificate",
    image: `${R2_BASE}/client-media/categories/cat-gioielli.webp`,
    imageClassName:
      "object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]",
    span: "lg:col-span-2",
  },
  {
    label: "Orologi",
    href: "/orologi",
    description: "Alta orologeria uomo e donna",
    image: `${R2_BASE}/client-media/categories/cat-orologi.webp`,
    imageClassName:
      "object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]",
    span: "",
  },
  {
    label: "Casa & Arredo",
    href: "/casa",
    description: "Cristalli, porcellane e profumatori",
    image: `${R2_BASE}/client-media/categories/cat-casa.webp`,
    imageClassName:
      "object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-[1.05]",
    span: "",
  },
  {
    label: "Regali di Natale",
    href: "/natale",
    description: "La selezione speciale delle feste",
    image: `${R2_BASE}/natale/natale-2.jpg`,
    imageClassName:
      "object-cover object-[50%_46%] scale-[1.04] transition-transform duration-[1200ms] ease-out group-hover:scale-[1.09]",
    span: "lg:col-span-2",
  },
];

/** Griglia delle macro-aree dello storefront. */
export function CategoryGrid() {
  return (
    <section className="border-t border-[#dedede] bg-white py-20 sm:py-28">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Le Collezioni"
          title="Esplora il Mondo ORO&CO"
          description="Quattro mondi, un'unica idea di eleganza: dai gioielli più preziosi agli oggetti che rendono speciale ogni casa."
          align="left"
          className="mb-12"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className={`group relative isolate block h-[360px] overflow-hidden rounded-[2px] border border-[#dedede] sm:h-[380px] lg:h-[420px] xl:h-[450px] ${category.span}`}
            >
              <SmartImage
                src={category.image}
                alt={category.label}
                className="h-full w-full"
                imageClassName={category.imageClassName}
                sizes={
                  category.span
                    ? "(max-width: 1024px) 100vw, 66vw"
                    : "(max-width: 1024px) 100vw, 33vw"
                }
                fallbackLabel={category.label}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl uppercase tracking-[0.14em] text-white">
                    {category.label}
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/80">
                    {category.description}
                  </p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-white/80 transition-colors group-hover:text-gold"
                  strokeWidth={1.25}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
