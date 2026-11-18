import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { SectionHeading } from "@/components/ui/SectionHeading";

const categories = [
  {
    label: "Gioielli",
    href: "/gioielli",
    description: "Oro, diamanti e pietre certificate",
    image: "/images/editorial/modella-2.jpg",
    span: "lg:col-span-2",
  },
  {
    label: "Orologi",
    href: "/orologi",
    description: "Alta orologeria uomo e donna",
    image: "/images/editorial/category-orologi.jpg",
    span: "",
  },
  {
    label: "Casa & Arredo",
    href: "/casa",
    description: "Cristalli, porcellane e profumatori",
    image: "/images/products/lladro/lladro_cranes_dome_01.jpg",
    span: "",
  },
  {
    label: "Regali di Natale",
    href: "/natale",
    description: "La selezione speciale delle feste",
    image: "/images/natale/natale-2.jpg",
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
              className={`group relative isolate overflow-hidden rounded-[2px] border border-[#dedede] ${category.span}`}
            >
              <SmartImage
                src={category.image}
                alt={category.label}
                className="aspect-[4/5] w-full sm:aspect-[3/4] lg:aspect-[16/10]"
                imageClassName="object-cover object-[50%_16%] scale-[1.09] transition-transform duration-[1200ms] ease-out group-hover:scale-[1.14]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                fallbackLabel={category.label}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl uppercase tracking-[0.14em] text-white">
                    {category.label}
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                    {category.description}
                  </p>
                </div>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-white/75 transition-colors group-hover:text-gold"
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
