import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CreditCard,
  Gem,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";
import { PageHero } from "@/components/catalog/PageHero";
import { SmartImage } from "@/components/ui/SmartImage";
import { TrustBadges } from "@/components/home/TrustBadges";

export const metadata: Metadata = {
  title: "La Nostra Storia — Gioielleria a San Marzano sul Sarno dal 1992",
  description:
    "La storia di ORO&CO: dal 1992 a San Marzano sul Sarno la tradizione orafa della famiglia Calabrese, periti gemmologi, trasparenza e cura del cliente.",
};

const values = [
  {
    icon: Gem,
    title: "Tradizione orafa",
    text: "Oltre trent'anni di esperienza nella selezione e nella cura del gioiello prezioso.",
  },
  {
    icon: BadgeCheck,
    title: "Periti gemmologi",
    text: "Competenza certificata nella valutazione di diamanti e pietre preziose.",
  },
  {
    icon: Sparkles,
    title: "Trasparenza",
    text: "Prezzi chiari, certificazioni ufficiali e informazioni complete su ogni pezzo.",
  },
  {
    icon: HeartHandshake,
    title: "Cura del cliente",
    text: "Consulenza personale e post-vendita, con la famiglia sempre presente al banco.",
  },
];

const guarantees = [
  {
    id: "garanzie",
    icon: BadgeCheck,
    title: "Garanzia e Certificati",
    text: "Ogni gioiello è accompagnato da certificato di autenticità e garanzia. Gli orologi godono della garanzia internazionale della casa produttrice.",
  },
  {
    id: "spedizioni",
    icon: Truck,
    title: "Spedizioni e Resi",
    text: "Spedizione assicurata e blindata in 24/48h, gratuita sopra i 150 €. Reso entro 14 giorni con rimborso garantito.",
  },
  {
    id: "pagamenti",
    icon: CreditCard,
    title: "Pagamenti e Finanziamenti",
    text: "Pagamenti sicuri con Klarna, PayPal, carte di credito e bonifico. Possibilità di finanziamento rateale in gioielleria.",
  },
];

export default function StoriaPage() {
  return (
    <>
      <PageHero
        eyebrow="La Maison"
        title="La Nostra Storia"
        description="Una famiglia, una bottega, una passione per i preziosi che dal 1992 accompagna i momenti più importanti dei nostri clienti."
        image="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-1.jpg"
        breadcrumb={[{ label: "Home", href: "/" }, { label: "La Nostra Storia" }]}
      />

      {/* Introduzione */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            <span className="eyebrow">Dal 1992 · San Marzano sul Sarno (SA)</span>
            <h2 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">
              Una storia di famiglia,
              <br />
              <span className="italic text-gold">scritta con l&apos;oro</span>
            </h2>
            <p className="text-pretty text-sm leading-relaxed text-graphite sm:text-base">
              Nel 1992 la famiglia Calabrese apre la gioielleria a San Marzano sul Sarno con un obiettivo
              chiaro: mettere al centro la persona, non solo il prodotto. Da
              allora la gioielleria è cresciuta, arricchendosi di nuovi marchi e
              collezioni, ma lo spirito è rimasto lo stesso.
            </p>
            <p className="text-pretty text-sm leading-relaxed text-graphite sm:text-base">
              Oggi ORO&amp;CO è un punto di riferimento per l&apos;alta
              gioielleria e l&apos;orologeria nell&apos;Agro Nocerino-Sarnese. Speranza, Renato, Carmela e Maria
              accolgono ogni cliente con la stessa cura di sempre, offrendo
              consulenza esperta, perizia gemmologica e un servizio post-vendita
              autentico.
            </p>
            <div className="grid grid-cols-3 gap-6 border-t border-line pt-7">
              {[
                { value: "30+", label: "Anni di attività" },
                { value: "18", label: "Marchi trattati" },
                { value: "1000+", label: "Clienti al banco" },
              ].map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="font-serif text-2xl text-gold sm:text-3xl">
                    {stat.value}
                  </p>
                  <p className="text-[0.6rem] uppercase tracking-[0.16em] text-graphite-soft">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <SmartImage
              src="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-4.jpg"
              alt="Gioielli in oro esposti in gioielleria ORO&CO"
              className="aspect-[3/4] w-full rounded-sm border border-line"
              imageClassName="object-cover object-[50%_16%] scale-[1.09]"
              sizes="(max-width: 1024px) 50vw, 25vw"
              fallbackLabel="Gioielleria Oro&Co"
            />
            <SmartImage
              src="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/davite-delucchi/trilogy_diamanti_01.jpg"
              alt="Dettaglio di un bracciale prezioso ORO&CO"
              className="mt-10 aspect-[3/4] w-full rounded-sm border border-line"
              sizes="(max-width: 1024px) 50vw, 25vw"
              fallbackLabel="Gioielli Oro&Co"
            />
          </div>
        </div>
      </section>

      {/* Valori */}
      <section className="border-y border-line bg-pearl/50 py-20">
        <div className="container-luxe">
          <div className="mb-12 text-center">
            <span className="eyebrow">I Nostri Valori</span>
            <h2 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">
              Ciò che rende unica la nostra gioielleria
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="flex flex-col gap-4 rounded-sm border border-line bg-white p-7"
              >
                <span className="grid h-12 w-12 place-items-center rounded-full border border-gold/40 bg-gold-tint/60 text-gold">
                  <value.icon className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <h3 className="font-serif text-lg text-ink">{value.title}</h3>
                <p className="text-sm leading-relaxed text-graphite">
                  {value.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Garanzie */}
      <section className="container-luxe py-20 sm:py-28">
        <div className="grid gap-6 lg:grid-cols-3">
          {guarantees.map((item) => (
            <div
              key={item.id}
              id={item.id}
              className="scroll-mt-28 rounded-sm border border-line p-8"
            >
              <span className="grid h-12 w-12 place-items-center rounded-full bg-ink text-gold-soft">
                <item.icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <h2 className="mt-5 font-serif text-xl text-ink">{item.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-graphite">
                {item.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-6 rounded-sm bg-navy px-8 py-14 text-center">
          <ShieldCheck className="h-8 w-8 text-gold-soft" strokeWidth={1.4} />
          <h2 className="max-w-2xl font-serif text-2xl leading-tight text-white sm:text-3xl">
            Vieni a trovarci in gioielleria: ti aspettiamo con un caffè e un consiglio autentico
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-white/65">
            Gioielleria ORO &amp; co (di Calabrese Speranza) — Via Filippo Turati, n. 30, San Marzano sul Sarno (SA). Tel: 081 518 6476 · WhatsApp: 351 877 8689.
          </p>
          <Link
            href="/gioielli"
            className="group inline-flex items-center gap-2 rounded-sm bg-gold px-7 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold-bright"
          >
            Esplora la Collezione
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              strokeWidth={1.8}
            />
          </Link>
        </div>
      </section>

      <TrustBadges />
    </>
  );
}
