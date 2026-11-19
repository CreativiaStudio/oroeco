import Image from "next/image";
import Link from "next/link";

/** Hero full-bleed della homepage: fotografia editoriale 16:9 e copy nello spazio negativo a sinistra. */
export function HeroSection() {
  return (
    <section className="relative isolate flex h-[92svh] min-h-[620px] max-h-[960px] w-full items-end overflow-hidden bg-[#eae3d7] lg:items-center">
      <Image
        src="https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/hero/hero-main.jpg"
        alt="Anello in oro su cubo di travertino e bracciale tennis, collezione Oroeco"
        fill
        priority
        sizes="100vw"
        className="animate-hero-kenburns object-cover object-[82%_center] md:object-[76%_center] xl:object-[64%_center]"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#17130f]/55 via-[#17130f]/20 to-transparent" />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#eae3d7]/85 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#eae3d7]/82 lg:via-[#eae3d7]/28 lg:to-transparent" />

      <div className="container-luxe relative z-10 pb-14 pt-28 lg:pb-0 lg:pt-16">
        <div className="max-w-[330px] sm:max-w-[380px] xl:max-w-[440px]">
          <p
            className="animate-fade-up font-serif text-[0.72rem] uppercase tracking-[0.3em] text-[#4e423e]"
            style={{ animationDelay: "100ms" }}
          >
            MAISON DI GIOIELLERIA · DAL 1992
          </p>

          <h1
            className="animate-fade-up mt-4 font-serif text-3xl uppercase leading-[1.06] tracking-[0.06em] text-[#020202] sm:text-4xl xl:text-[3.35rem]"
            style={{ animationDelay: "220ms" }}
          >
            L&apos;Arte dell&apos;Oro
            <span className="mt-1 block italic normal-case tracking-[0.02em] text-[#8c6d32]">
              e del tempo
            </span>
          </h1>

          <p
            className="animate-fade-up mt-4 font-serif text-base leading-relaxed text-[#4e423e]"
            style={{ animationDelay: "340ms" }}
          >
            Oro 18 kt, diamanti certificati
            <br />
            e alta orologeria a San Marzano.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-wrap items-center gap-4"
            style={{ animationDelay: "450ms" }}
          >
            <Link
              href="/gioielli"
              className="inline-flex h-12 items-center justify-center rounded-[2px] border border-[#020202] bg-[#020202] px-8 font-serif text-[0.74rem] uppercase tracking-[0.24em] text-white transition-all duration-300 hover:bg-transparent hover:text-[#020202]"
            >
              SCOPRI LE COLLEZIONI
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
