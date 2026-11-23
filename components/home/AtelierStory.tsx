import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SmartImage } from "@/components/ui/SmartImage";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";
import { ScrollParallax } from "@/components/motion/ScrollParallax";

/** Storytelling immersivo dell'atelier con coreografia bidirezionale sinistra/destra e parallasse. */
export function AtelierStory() {
  return (
    <section className="overflow-hidden bg-white py-20 sm:py-28">
      <div className="container-luxe">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <LuxuryReveal variant="curtain">
            <ScrollParallax
              className="aspect-square w-full rounded-[2px] border border-[#dedede]"
              speed={20}
              scale={1.07}
            >
              <SmartImage
                src="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/client-media/foto/oroeco-foto-41.webp"
                alt="Renato, mamma e zia nella gioielleria ORO&CO a San Marzano sul Sarno"
                className="aspect-square w-full"
                imageClassName="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
                fallbackLabel="Atelier Oro&Co"
              />
            </ScrollParallax>
          </LuxuryReveal>

          <div className="space-y-7">
            <LuxuryReveal variant="right">
              <span className="eyebrow">La Nostra Storia</span>
              <h2 className="mt-3 font-serif text-3xl leading-tight text-ink sm:text-4xl lg:text-[2.6rem]">
                L&apos;arte orafa di famiglia,
                <br />
                <span className="inline-block italic text-gold tracking-[-0.02em] text-[1.55rem] sm:text-[1.95rem] lg:text-[1.95rem] xl:text-[2.25rem] sm:whitespace-nowrap">
                  dal 1992 a San Marzano sul Sarno
                </span>
              </h2>
            </LuxuryReveal>

            <LuxuryReveal variant="up" delayMs={100}>
              <div className="space-y-4">
                <p className="text-pretty text-sm leading-relaxed text-graphite sm:text-base">
                  Nel 1992 le sorelle{" "}
                  <strong className="font-semibold italic text-ink">
                    Speranza e Chiara Calabrese
                  </strong>{" "}
                  danno vita al loro sogno inaugurando la &ldquo;Gioielleria Oro e...&rdquo;, la prima boutique di accessori di lusso nel centro storico di San Marzano sul Sarno. Da allora, grazie alla professionalità e all&apos;amore per il proprio lavoro, sono diventate un punto di riferimento imprescindibile nella zona. Da due generazioni familiari offre esclusive e lussuose collezioni di gioielleria e di orologeria.
                </p>
                <blockquote className="border-l-2 border-gold pl-4 font-serif text-base font-semibold italic leading-snug text-ink sm:text-lg">
                  &ldquo;La nostra vera essenza, il cuore pulsante della nostra attività&rdquo;
                </blockquote>
                <p className="text-pretty text-sm leading-relaxed text-graphite sm:text-base">
                  L&apos;attenzione per ogni cliente ha spinto ad ampliare la gamma di servizi offerti. Qui puoi ricevere il supporto anche per la tua lista nozze, o per realizzare gioielli personalizzati così da sentirti unico e speciale.
                </p>
                <p className="text-pretty text-sm leading-relaxed text-graphite sm:text-base">
                  Un&apos;attività che si proietta al futuro, non dimenticando però le proprie radici e puntando a una crescita e a un aggiornamento costante nel solco intrapreso da una famiglia di gioiellieri amanti del proprio lavoro.
                </p>
                <p className="text-pretty text-sm leading-relaxed text-ink sm:text-base">
                  <strong className="font-semibold">ORO &amp; Co</strong> il{" "}
                  <em className="italic">
                    posto giusto dove trovare il dettaglio prezioso che racconti la tua identità
                  </em>
                </p>
              </div>
            </LuxuryReveal>

            <LuxuryReveal variant="up" delayMs={180}>
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
            </LuxuryReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
