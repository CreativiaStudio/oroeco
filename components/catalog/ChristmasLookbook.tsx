"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Gift } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { cn } from "@/lib/utils";

type LookbookTag = "regali" | "decorazioni" | "confezione";
type LookbookFilter = "tutte" | LookbookTag;

interface LookbookItem {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  alt: string;
  badge: string;
  href: string;
  cta: string;
  tags: LookbookTag[];
}

const filters: { value: LookbookFilter; label: string }[] = [
  { value: "tutte", label: "Tutte le Idee" },
  { value: "regali", label: "Regali di Natale" },
  { value: "decorazioni", label: "Decorazioni" },
  { value: "confezione", label: "Confezione Regalo" },
];

const items: LookbookItem[] = [
  {
    id: "cofanetto",
    eyebrow: "L'Arte del Dono",
    title: "Il cofanetto di Natale",
    description:
      "Cofanetto dono e nastro: ogni gioiello ORO&CO si presenta come un dono da ricordare.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-1.jpg",
    alt: "Cofanetto dono ORO&CO con nastro",
    badge: "Regali di Natale",
    href: "/natale?sub=regali",
    cta: "Componi il tuo regalo",
    tags: ["regali", "confezione"],
  },
  {
    id: "bagliori",
    eyebrow: "Alta Gioielleria",
    title: "Bagliori di Festa",
    description:
      "Oro 18 kt e diamanti selezionati con perizia gemmologica, per accendere le serate più importanti dell'anno.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-2.jpg",
    alt: "Gioielli in oro e diamanti con bagliori natalizi",
    badge: "Regali di Natale",
    href: "/gioielli",
    cta: "Esplora i gioielli",
    tags: ["regali"],
  },
  {
    id: "tavola",
    eyebrow: "Arte dell'Abitare",
    title: "La tavola delle feste",
    description:
      "Tavola, profumatori e arredi d'atmosfera per accogliere il Natale con misura e calore.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-3.jpg",
    alt: "Tavola natalizia con profumatori e arredi d'atmosfera",
    badge: "Decorazioni",
    href: "/natale?sub=decorazioni",
    cta: "Vedi le decorazioni",
    tags: ["decorazioni"],
  },
  {
    id: "confezione",
    eyebrow: "Firma ORO&CO",
    title: "La confezione inclusa",
    description:
      "Confezione luxury e nastro firmati ORO&CO: il nostro dono, incluso in ogni ordine.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-4.jpg",
    alt: "Confezione luxury firmata ORO&CO",
    badge: "Confezione Regalo",
    href: "/natale",
    cta: "Scopri la confezione",
    tags: ["confezione"],
  },
];

/**
 * Lookbook editoriale dello Speciale Natale: quattro racconti visivi
 * con filtri rapidi fra idee regalo, decorazioni e confezione inclusa.
 */
export function ChristmasLookbook() {
  const [activeFilter, setActiveFilter] = useState<LookbookFilter>("tutte");

  const counts = useMemo(() => {
    const map = new Map<LookbookFilter, number>();

    for (const filter of filters) {
      if (filter.value === "tutte") {
        map.set(filter.value, items.length);
        continue;
      }

      const tag = filter.value;
      map.set(tag, items.filter((item) => item.tags.includes(tag)).length);
    }

    return map;
  }, []);

  const visible = useMemo(
    () =>
      activeFilter === "tutte"
        ? items
        : items.filter((item) => item.tags.includes(activeFilter)),
    [activeFilter],
  );

  return (
    <section
      aria-labelledby="christmas-lookbook-title"
      className="border-b border-line bg-white py-14 sm:py-16"
    >
      <div className="container-luxe">
        <div className="flex flex-col gap-8 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="eyebrow">Lookbook Natalizio</span>
            <h2
              id="christmas-lookbook-title"
              className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl"
            >
              Il Natale, firmato ORO&amp;CO
            </h2>
            <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-graphite-soft">
              Quattro racconti visivi per scegliere il dono giusto: l&apos;oro
              dell&apos;alta gioielleria, le decorazioni della casa e la cura
              della confezione che accompagna ogni acquisto.
            </p>
          </div>

          <div className="flex items-center gap-3 border border-gold/25 bg-gold-tint/60 px-4 py-3">
            <Gift className="h-4 w-4 shrink-0 text-gold" strokeWidth={1.5} />
            <p className="text-xs leading-relaxed text-graphite">
              Confezione regalo ORO&amp;CO inclusa in ogni ordine.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {filters.map((filter) => {
              const isActive = activeFilter === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition-colors",
                    isActive
                      ? "border-gold bg-gold text-white"
                      : "border-line text-graphite hover:border-gold hover:text-gold",
                  )}
                >
                  {filter.label}
                  <span className="ml-1.5 opacity-70">
                    {counts.get(filter.value) ?? 0}
                  </span>
                </button>
              );
            })}
          </div>

          <span
            aria-live="polite"
            className="text-[0.62rem] uppercase tracking-[0.2em] text-graphite-soft"
          >
            {visible.length} {visible.length === 1 ? "idea" : "idee"}
          </span>
        </div>

        <div
          key={activeFilter}
          className="mt-10 grid animate-fade-up grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12"
        >
          {visible.map((item, index) => {
            const layout = cardLayout(index, visible.length);
            return (
              <article
                key={item.id}
                className={cn(
                  "group flex h-full flex-col border border-line bg-white transition-colors duration-500 hover:border-gold/45",
                  layout.span,
                )}
              >
                <Link
                  href={item.href}
                  aria-label={`${item.cta}: ${item.title}`}
                  className="relative block overflow-hidden"
                >
                  <SmartImage
                    src={item.image}
                    alt={item.alt}
                    className={cn("w-full", layout.media)}
                    imageClassName="transition-transform duration-[900ms] ease-out group-hover:scale-[1.05]"
                    sizes={layout.sizes}
                    fallbackLabel={item.title}
                  />
                  <span className="absolute left-4 top-4 inline-flex items-center border border-gold/60 bg-gold px-3 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-white">
                    {item.badge}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                </Link>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-gold">
                      {item.eyebrow}
                    </span>
                    <span className="font-serif text-sm text-gold/40">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-3 font-serif text-2xl leading-snug text-ink transition-colors duration-300 group-hover:text-gold">
                    {item.title}
                  </h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-graphite-soft">
                    {item.description}
                  </p>

                  <Link
                    href={item.href}
                    className="mt-5 inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:text-gold"
                  >
                    {item.cta}
                    <ArrowUpRight
                      className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                      strokeWidth={1.6}
                    />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Ritmo editoriale della griglia: alterna card orizzontali e verticali
 * adattando le campate al numero di idee attualmente visibili.
 */
function cardLayout(index: number, total: number) {
  const wideMedia = "h-[20rem] sm:h-[23rem] lg:h-[24rem]";
  const portraitMedia = "h-[20rem] sm:h-[26rem] lg:h-[28rem]";

  if (total === 1) {
    return {
      span: "lg:col-span-8 lg:col-start-3",
      media: "h-[20rem] sm:h-[24rem] lg:h-[26rem]",
      sizes: "(max-width: 1024px) 100vw, 66vw",
    };
  }

  if (total === 2) {
    return {
      span: "lg:col-span-6",
      media: portraitMedia,
      sizes: "(max-width: 640px) 100vw, 50vw",
    };
  }

  if (total === 3) {
    if (index === 2) {
      return {
        span: "lg:col-span-12",
        media: wideMedia,
        sizes: "(max-width: 1024px) 100vw, 1200px",
      };
    }
    return {
      span: index === 0 ? "lg:col-span-7" : "lg:col-span-5",
      media: index === 0 ? wideMedia : portraitMedia,
      sizes: "(max-width: 1024px) 100vw, 50vw",
    };
  }

  const spans = [
    "lg:col-span-7",
    "lg:col-span-5",
    "lg:col-span-5",
    "lg:col-span-7",
  ];

  return {
    span: spans[index] ?? "lg:col-span-6",
    media: index === 1 || index === 2 ? portraitMedia : wideMedia,
    sizes:
      index === 1 || index === 2
        ? "(max-width: 1024px) 100vw, 42vw"
        : "(max-width: 1024px) 100vw, 58vw",
  };
}
