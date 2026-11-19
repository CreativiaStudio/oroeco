import Link from "next/link";
import { SmartImage } from "@/components/ui/SmartImage";

interface EditorialCard {
  image: string;
  href: string;
  label: string;
  imageClassName: string;
  priority?: boolean;
}

const cards: EditorialCard[] = [
  {
    // Riga 1 — Col 1: Orecchini pendenti oro giallo, diamanti e acquamarina (1080x1080 senza logo)
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/client-media/foto/oroeco-foto-24-square.webp",
    href: "/gioielli?sub=orecchini",
    label: "Orecchini pendenti in oro giallo, diamanti e acquamarina ORO&CO",
    imageClassName:
      "object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]",
    priority: true,
  },
  {
    // Riga 1 — Col 2: Anello indossato ORO&CO, taglio quadrato 1080x1080 pulito senza logo
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/client-media/foto/oroeco-foto-15-square.webp",
    href: "/gioielli?sub=anelli",
    label: "Anello a fasce in oro rosa e diamanti ORO&CO",
    imageClassName:
      "object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]",
  },
  {
    // Riga 2 — Col 1: Orologio gioiello oro indossato (1080x1080 senza logo)
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/client-media/foto/oroeco-foto-17-square.webp",
    href: "/orologi",
    label: "Orologio gioiello in acciaio dorato ORO&CO",
    imageClassName:
      "object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]",
  },
  {
    // Riga 2 — Col 2: Anello con smeraldo e contorno di diamanti (1080x1080 pulito senza logo)
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/client-media/foto/oroeco-foto-02-square.webp",
    href: "/gioielli?sub=anelli",
    label: "Anello in oro bianco con smeraldo ovale e diamanti ORO&CO",
    imageClassName:
      "object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]",
  },
];

/**
 * Galleria Editoriale Baggio Gioielli Style:
 * Grandi quadranti a tutta altezza senza bordi da card, con fotografia pura su fondo bianco,
 * alternanza tra modella e still-life di prodotto, e tipografia Arapey minimalista.
 */
export function EditorialQuadrants() {
  return (
    <div className="w-full overflow-hidden bg-white">
      <section className="relative left-1/2 w-screen -translate-x-1/2 border-b border-line/60 bg-white pb-0 pt-20 sm:pt-28">
        {/* Intestazione minimalista in puro stile Arapey */}
        <div className="container-luxe">
          <div className="mx-auto mb-14 max-w-2xl text-center sm:mb-16">
            <span className="text-[0.68rem] font-medium uppercase tracking-[0.32em] text-neutral-400">
              Maison ORO&amp;CO · 1992
            </span>
            <h2 className="mt-4 font-serif text-3xl font-normal leading-[1.15] text-ink sm:text-4xl lg:text-[2.75rem]">
              Ispirazioni &amp; <span className="italic text-gold">Creazioni d&apos;Autore</span>
            </h2>
            <p className="mt-4 text-pretty font-serif text-sm italic leading-relaxed text-graphite sm:text-base">
              L&apos;armonia tra il fascino del gioiello indossato e la purezza della manifattura orafa.
            </p>
          </div>
        </div>

        {/* Galleria full-bleed 100vw: due righe da due colonne a contatto con i bordi,
            gap minimo e formati quadrati per modella e still-life, senza scritte sulle foto */}
        <div className="grid w-full grid-cols-2 gap-1 sm:gap-2">
          {cards.map((card) => (
            <Link
              key={card.image}
              href={card.href}
              aria-label={card.label}
              className="group relative block w-full overflow-hidden bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
            >
              {/* Contenitore fotografico puro 1:1, senza bordi, senza ombre e senza testo */}
              <div className="relative aspect-square w-full overflow-hidden">
                <SmartImage
                  src={card.image}
                  alt={card.label}
                  className="aspect-square w-full"
                  imageClassName={card.imageClassName}
                  sizes="50vw"
                  priority={card.priority}
                />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
