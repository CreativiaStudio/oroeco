import Image from "next/image";
import Link from "next/link";

const R2_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

/**
 * Hero full-bleed della homepage con regia fotografica doppia:
 * - Desktop (lg+): fotografia editoriale 16:9 luminosa con modella, bocca e rubino a destra
 *   e sfondo avorio-champagne pulito a sinistra, animata da un respiro continuo ultra-fluido.
 * - Mobile (<lg): taglio verticale 9:16 dedicato con modella protagonista in alto/centro e copy luminoso in basso.
 */
export function HeroSection() {
  return (
    <section className="relative isolate flex h-[92svh] min-h-[640px] max-h-[960px] w-full items-end overflow-hidden bg-[#1b0812] lg:items-center lg:bg-[#f5efe6]">
      {/* Versione Desktop 16:9 — Luminosa, zero patina sulla modella, bocca pienamente visibile */}
      <Image
        src={`${R2_BASE}/hero/hero-modella-desktop-v2.webp`}
        alt="Modella ORO&CO con anello rubino marquise in oro giallo e abito magenta"
        fill
        priority
        sizes="100vw"
        className="animate-hero-kenburns hidden object-cover object-[72%_top] lg:block xl:object-[62%_top] 2xl:object-top"
      />

      {/* Versione Mobile 9:16 — Modella e anello protagonisti nella fascia alta/centrale */}
      <Image
        src={`${R2_BASE}/hero/hero-modella-mobile-v2.webp`}
        alt="Modella ORO&CO con anello rubino marquise in oro giallo e abito magenta"
        fill
        priority
        sizes="100vw"
        className="animate-hero-kenburns object-cover object-[50%_18%] lg:hidden"
      />

      {/* Sfumatura superiore discreta e snella solo per la leggibilità della navbar trasparente */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#17110d]/42 via-[#17110d]/14 to-transparent lg:h-28" />

      {/* Mobile: velluto borgogna/ebano solo nella fascia bassa per copy bianco + oro ad alto contrasto */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#16060e]/88 via-[#230916]/35 to-transparent lg:hidden" />

      <div className="container-luxe relative z-10 pb-12 pt-28 sm:pb-16 lg:pb-0 lg:pt-16">
        <div className="max-w-[330px] sm:max-w-[390px] xl:max-w-[445px]">
          <p
            className="animate-fade-up font-serif text-[0.72rem] uppercase tracking-[0.3em] text-[#e7d9b8] lg:text-[#4e423e]"
            style={{ animationDelay: "100ms" }}
          >
            MAISON DI GIOIELLERIA · DAL 1992
          </p>

          <h1
            className="animate-fade-up mt-3.5 font-serif text-3xl uppercase leading-[1.06] tracking-[0.06em] text-white sm:text-4xl lg:mt-4 lg:text-[#020202] xl:text-[3.35rem]"
            style={{ animationDelay: "220ms" }}
          >
            L&apos;Arte dell&apos;Oro
            <span className="mt-1 block italic normal-case tracking-[0.02em] text-[#e7d9b8] lg:text-[#8c6a2b]">
              e del tempo
            </span>
          </h1>

          <p
            className="animate-fade-up mt-3.5 font-serif text-base leading-relaxed text-white/85 lg:mt-4 lg:text-[#4e423e]"
            style={{ animationDelay: "340ms" }}
          >
            Oro 18 kt, diamanti certificati
            <br />
            e alta orologeria a San Marzano.
          </p>

          <div
            className="animate-fade-up mt-7 flex flex-wrap items-center gap-4 lg:mt-8"
            style={{ animationDelay: "450ms" }}
          >
            <Link
              href="/gioielli"
              className="inline-flex h-12 items-center justify-center rounded-[2px] border border-white bg-white px-8 font-serif text-[0.74rem] uppercase tracking-[0.24em] text-[#020202] transition-all duration-300 hover:bg-transparent hover:text-white lg:border-[#020202] lg:bg-[#020202] lg:text-white lg:hover:bg-transparent lg:hover:text-[#020202]"
            >
              SCOPRI LE COLLEZIONI
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
