import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";

interface ChristmasBox {
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  alt: string;
  fallbackLabel: string;
  href: string;
}

const boxes: ChristmasBox[] = [
  {
    eyebrow: "Regalo",
    title: "Il Cofanetto ORO&CO",
    copy: "La confezione firmata che custodisce ogni prezioso.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-1.jpg",
    alt: "Cofanetto e packaging regalo ORO&CO per il Natale",
    fallbackLabel: "Cofanetto",
    href: "/natale",
  },
  {
    eyebrow: "Gioielli",
    title: "Gioielli sotto l'albero",
    copy: "Oro e pietre luminose per le feste più care.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-2.jpg",
    alt: "Gioielli natalizi ed eleganza delle feste ORO&CO",
    fallbackLabel: "Gioielli di Natale",
    href: "/natale",
  },
  {
    eyebrow: "Casa & Tavola",
    title: "La casa in festa",
    copy: "Atmosfera, arredo e tavola per accogliere il Natale.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-3.jpg",
    alt: "Atmosfera, arredo casa e tavola festiva ORO&CO",
    fallbackLabel: "Casa in festa",
    href: "/natale",
  },
  {
    eyebrow: "Packaging",
    title: "Nastro e sigillo d'oro",
    copy: "L'ultimo dettaglio, quello che si ricorda per sempre.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/natale/natale-4.jpg",
    alt: "Packaging luxury ORO&CO con nastro e sigillo dorato",
    fallbackLabel: "Packaging",
    href: "/natale",
  },
];

const whatsappHref = "https://wa.me/393518778689";

/** Vetrina dedicata alla linea Natale, con CTA per le confezioni su misura. */
export function ChristmasShowcase() {
  return (
    <section className="border-y border-[#dedede] bg-[#f7f3ec] py-20 sm:py-28">
      <div className="container-luxe">
        <LuxuryReveal variant="up">
          <SectionHeading
            eyebrow="L'Incanto delle Feste"
            title="La Magia del Natale ORO&CO"
            description="Regali preziosi custoditi nel nostro packaging iconico."
            tone="light"
            className="mb-12"
          />
        </LuxuryReveal>

        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {boxes.map((box, idx) => (
            <LuxuryReveal key={box.title} variant="up" delayMs={idx * 90} className="h-full">
              <Link
                href={box.href}
                className="group flex h-full flex-col overflow-hidden rounded-[2px] border border-[#dedede] bg-white transition-colors duration-300 hover:border-gold/60"
              >
                <SmartImage
                  src={box.image}
                  alt={box.alt}
                  className="aspect-[4/5] w-full"
                  imageClassName="object-cover object-[50%_15%] scale-[1.09] transition-transform duration-[1400ms] ease-out group-hover:scale-[1.13]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  fallbackLabel={box.fallbackLabel}
                />
                <div className="flex flex-1 flex-col justify-between gap-4 p-6">
                  <div className="space-y-2">
                    <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-gold">
                      {box.eyebrow}
                    </p>
                    <h3 className="font-serif text-xl uppercase leading-snug tracking-[0.08em] text-[#020202]">
                      {box.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#4e423e]">
                      {box.copy}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-gold">
                    Scopri la linea
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                      strokeWidth={1.8}
                    />
                  </span>
                </div>
              </Link>
            </LuxuryReveal>
          ))}

          <div className="flex flex-col justify-center gap-5 rounded-[2px] border border-[#dedede] bg-white p-8 sm:col-span-2 lg:col-span-4 lg:flex-row lg:items-center lg:justify-between lg:p-10">
            <div className="max-w-xl space-y-3">
              <span className="eyebrow text-gold">
                Confezioni su misura
              </span>
              <h3 className="font-serif text-2xl leading-tight text-[#020202] sm:text-3xl">
                Rendi unico ogni dono
              </h3>
              <p className="text-pretty text-sm leading-relaxed text-[#4e423e] sm:text-base">
                Prenota la tua confezione personalizzata in gioielleria, a San
                Marzano sul Sarno: nastro, sigillo e biglietto scritto a mano
                dalla famiglia Calabrese.
              </p>
            </div>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-3 rounded-[2px] border border-[#020202] bg-[#020202] px-7 py-4 font-serif text-[0.72rem] uppercase tracking-[0.22em] text-white transition-colors hover:bg-transparent hover:text-[#020202]"
            >
              <MessageCircle className="h-5 w-5" strokeWidth={1.8} />
              <span className="flex flex-col items-start leading-tight">
                <span>Prenota su WhatsApp</span>
                <span className="text-[0.66rem] font-medium normal-case tracking-normal opacity-80">
                  351 877 8689
                </span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
