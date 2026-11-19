import Image from "next/image";
import Link from "next/link";

const R2_BASE = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

/**
 * Hero full-bleed della homepage con regia fotografica doppia:
 * - Desktop (lg+): fotografia editoriale 16:9 con modella e rubino a destra e spazio negativo caldo champagne a sinistra.
 * - Mobile (<lg): taglio verticale 9:16 dedicato con modella protagonista in alto/centro e copy luminoso sul velluto scuro in basso.
 */
export function HeroSection() {
  return (
    <section className="relative isolate flex h-[92svh] min-h-[640px] max-h-[960px] w-full items-end overflow-hidden bg-[#1b0812] lg:items-center lg:bg-[#dfd3c4]">
      {/* Versione Desktop 16:9 — Modella a destra, spazio negativo editoriale a sinistra */}
      <Image
        src={`${R2_BASE}/hero/hero-modella-desktop.webp`}
        alt="Modella ORO&CO con anello rubino marquise in oro giallo e abito magenta"
        fill
        priority
        sizes="100vw"
        className="animate-hero-kenburns hidden object-cover object-[74%_center] lg:block xl:object-[64%_center] 2xl:object-center"
      />

      {/* Versione Mobile 9:16 — Modella e anello protagonisti nella fascia alta/centrale */}
      <Image
        src={`${R2_BASE}/hero/hero-modella-mobile.webp`}
        alt="Modella ORO&CO con anello rubino marquise in oro giallo e abito magenta"
        fill
        priority
        sizes="100vw"
        className="animate-hero-kenburns object-cover object-[50%_22%] lg:hidden"
      />

      {/* Sfumatura superiore per la leggibilità dell'header trasparente */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#17130f]/55 via-[#17130f]/20 to-transparent lg:h-40 lg:from-[#17130f]/50 lg:via-[#17130f]/15" />

      {/* Mobile: velluto borgogna/ebano solo nella fascia bassa per copy bianco + oro ad alto contrasto */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#16060e]/92 via-[#230916]/45 to-transparent lg:hidden" />

      {/* Desktop: leggero velo champagne solo sul lato sinistro, lasciando la modella a destra 100% viva */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block lg:bg-gradient-to-r lg:from-[#ded2c2]/82 lg:via-[#ded2c2]/30 lg:via-[46%] lg:to-transparent" />

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
            <span className="mt-1 block italic normal-case tracking-[0.02em] text-[#e7d9b8] lg:text-[#7f5f24]">
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
