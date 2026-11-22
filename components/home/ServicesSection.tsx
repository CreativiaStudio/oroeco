import Link from "next/link";
import { ArrowUpRight, Gem, Gift, Watch } from "lucide-react";
import { LuxuryReveal } from "@/components/ui/LuxuryReveal";

const services = [
  {
    icon: Watch,
    title: "Riparazione Orologi",
    text: "Revisione meccanica, sostituzione pile, regolazione e cambio cinturini, controllo impermeabilità e ripristino di orologi classici e moderni.",
    cta: "Prenota assistenza",
    href: "/appuntamento?servizio=riparazione-orologi",
  },
  {
    icon: Gem,
    title: "Realizzazione Gioielli su Misura",
    text: "Creazione artigianale di anelli, solitari, fedi e gioielli personalizzati su disegno, messa a misura e rigenerazione dei tuoi preziosi di famiglia.",
    cta: "Prenota una consulenza",
    href: "/appuntamento?servizio=gioielli-su-misura",
  },
  {
    icon: Gift,
    title: "Preparazione Bomboniere",
    text: "Allestimento completo su misura per matrimoni, battesimi, comunioni e ricorrenze con oggettistica d'autore, confezionamento sartoriale e confetti selezionati.",
    cta: "Prenota appuntamento",
    href: "/appuntamento?servizio=bomboniere",
  },
] as const;

/** Tre servizi artigianali della gioielleria con prenotazione diretta a slot. */
export function ServicesSection() {
  return (
    <section className="border-y border-[#dedede] bg-[#f7f3ec] py-16 sm:py-24">
      <div className="container-luxe">
        <LuxuryReveal variant="up">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="eyebrow">I Servizi della Gioielleria</span>
            <h2 className="mt-3 font-serif text-3xl uppercase tracking-[0.1em] text-[#020202] sm:text-4xl">
              Cura artigianale, oltre il gioiello
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#4e423e] sm:text-base">
              Dal 1992 accompagniamo ogni scelta con il nostro laboratorio e
              l&apos;assistenza diretta al banco a San Marzano sul Sarno.
            </p>
          </div>
        </LuxuryReveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {services.map((service, idx) => (
            <LuxuryReveal
              key={service.title}
              variant="up"
              delayMs={idx * 90}
              className="h-full"
            >
              <article className="flex h-full flex-col justify-between rounded-[2px] border border-[#dedede] bg-white p-8 transition-colors duration-300 hover:border-gold">
                <div>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gold/40 bg-[#f7f3ec] text-gold">
                    <service.icon className="h-5 w-5" strokeWidth={1.4} />
                  </span>
                  <h3 className="mt-5 font-serif text-xl uppercase tracking-[0.08em] text-[#020202]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#4e423e]">
                    {service.text}
                  </p>
                </div>

                <div className="mt-7 border-t border-[#f0ece4] pt-4">
                  <Link
                    href={service.href}
                    className="group inline-flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#020202] transition-colors hover:text-gold"
                  >
                    <span>{service.cta}</span>
                    <ArrowUpRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      strokeWidth={1.6}
                    />
                  </Link>
                </div>
              </article>
            </LuxuryReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
