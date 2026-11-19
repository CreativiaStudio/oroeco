import Link from "next/link";
import { ArrowRight, BadgeCheck, Gem, Users } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";

const pillars = [
  {
    icon: Gem,
    title: "Selezione delle pietre",
    text: "Diamanti e gemme scelti uno a uno, con analisi di purezza, colore e taglio.",
  },
  {
    icon: BadgeCheck,
    title: "Perizia gemmologica",
    text: "Ogni prezioso è accompagnato da certificato ufficiale di autenticità.",
  },
  {
    icon: Users,
    title: "Al banco dal 1992",
    text: "Renato, mamma e zia vi accolgono in gioielleria con consulenza personale.",
  },
];

/** Storytelling immersivo dell'atelier. */
export function AtelierStory() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="container-luxe">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <SmartImage
            src="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/client-media/foto/oroeco-foto-41.webp"
            alt="Renato, mamma e zia nella gioielleria ORO&CO a San Marzano sul Sarno"
            className="aspect-square w-full overflow-hidden rounded-[2px] border border-[#dedede]"
            imageClassName="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
            fallbackLabel="Atelier Oro&Co"
          />

          <div className="space-y-7">
            <span className="eyebrow">La Nostra Storia</span>
            <h2 className="font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.6rem]">
              L&apos;arte orafa di famiglia,
              <br />
              <span className="inline-block italic text-gold tracking-[-0.02em] text-[1.55rem] sm:text-[1.95rem] lg:text-[1.95rem] xl:text-[2.25rem] sm:whitespace-nowrap">
                dal 1992 a San Marzano sul Sarno
              </span>
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-graphite sm:text-base">
              Tutto è iniziato nel 1992, quando Speranza e la famiglia Calabrese hanno aperto le porte della loro
              gioielleria con un&apos;idea semplice e ambiziosa: offrire ai propri
              clienti gioielli autentici, selezionati con occhio esperto e
              accompagnati da un consiglio sincero.
            </p>
            <p className="text-pretty text-sm leading-relaxed text-graphite sm:text-base">
              Oggi ORO&amp;CO è un punto di riferimento per l&apos;alta gioielleria
              e l&apos;orologeria: diciotto marchi prestigiosi, periti gemmologi e
              la costante presenza della famiglia al banco, per un rapporto di
              fiducia che dura da oltre trent&apos;anni.
            </p>

            <ul className="divide-y divide-[#dedede] border-y border-t border-[#dedede]">
              {pillars.map((pillar) => (
                <li key={pillar.title} className="flex gap-5 py-5">
                  <pillar.icon
                    className="mt-0.5 h-6 w-6 shrink-0 text-[#020202]"
                    strokeWidth={1.25}
                  />
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg uppercase tracking-[0.08em] text-[#020202]">
                      {pillar.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#4e423e]">
                      {pillar.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href="/storia"
              className="group inline-flex items-center gap-2 rounded-[3px] border border-[#020202] px-6 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#020202] transition-colors duration-300 hover:bg-[#020202] hover:text-white"
            >
              Leggi la nostra storia completa
              <ArrowRight
                className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                strokeWidth={1.8}
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
