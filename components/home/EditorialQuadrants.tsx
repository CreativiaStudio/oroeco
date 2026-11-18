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
    // Riga 1 — Col 1: Modella, focus sul girocollo, watermark inferiore eliminato dal crop
    image: "/images/editorial/modella-3.jpg",
    href: "/gioielli?sub=collane",
    label: "Indossa la Luce — Girocollo in oro e diamanti",
    imageClassName:
      "object-cover object-[50%_36%] scale-[1.55] transition-transform duration-[1400ms] ease-out group-hover:scale-[1.61]",
    priority: true,
  },
  {
    // Riga 1 — Col 2: Gioiello still-life, crop pulito centrato
    image: "/images/products/davite-delucchi/solitario_diamante_01.jpg",
    href: "/prodotto/solitario-oro-bianco-diamante-050",
    label: "Solitario in oro bianco e diamante 0,50 ct",
    imageClassName:
      "object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]",
  },
  {
    // Riga 2 — Col 1: Gioiello still-life, crop pulito centrato
    image: "/images/products/davite-delucchi/tennis_diamanti_01.jpg",
    href: "/prodotto/bracciale-tennis-diamanti-oro-bianco",
    label: "Bracciale Tennis in diamanti 2,10 ct",
    imageClassName:
      "object-cover object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.05]",
  },
  {
    // Riga 2 — Col 2: Modella, focus sul girocollo a fiori e orecchini, senza watermark
    image: "/images/editorial/modella-4.jpg",
    href: "/gioielli",
    label: "Girocollo rigido e orecchini in oro scolpito",
    imageClassName:
      "object-cover object-[50%_60%] scale-[1.48] transition-transform duration-[1400ms] ease-out group-hover:scale-[1.54]",
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
