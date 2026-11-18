import type { ProductCategory } from "@/types/product";

export interface NavChild {
  label: string;
  href: string;
  description?: string;
}

export interface NavFeatured {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  image: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
  columns?: NavColumn[];
  featured?: NavFeatured;
  visualCards?: {
    label: string;
    subtitle: string;
    href: string;
    image: string;
  }[];
}

export interface NavColumn {
  heading: string;
  links: NavChild[];
}

/**
 * Alberatura e-commerce ufficiale ORO&CO, fedele al documento cliente
 * fornito da Renato (macro-categorie e sottocategorie censite).
 */
export const mainNav: NavItem[] = [
  {
    label: "La Nostra Storia",
    href: "/storia",
  },
  {
    label: "Gioielli",
    href: "/gioielli",
    columns: [
      {
        heading: "Gioielli",
        links: [
          { label: "Anelli", href: "/gioielli?sub=anelli" },
          { label: "Collane", href: "/gioielli?sub=collane" },
          { label: "Orecchini", href: "/gioielli?sub=orecchini" },
          { label: "Bracciali", href: "/gioielli?sub=bracciali" },
          {
            label: "Ciondoli e Componenti",
            href: "/gioielli?sub=ciondoli",
          },
        ],
      },
    ],
    featured: {
      eyebrow: "Alta Gioielleria",
      title: "Diamanti & Oro 18 kt",
      description:
        "Solitari, verette e trilogy selezionati con perizia gemmologica.",
      href: "/gioielli",
      cta: "Scopri la collezione",
      image: "/images/editorial/modella-3.jpg",
    },
  },
  {
    label: "Orologi",
    href: "/orologi",
    columns: [
      {
        heading: "Alta Orologeria",
        links: [
          { label: "Uomo", href: "/orologi?sub=uomo" },
          { label: "Donna", href: "/orologi?sub=donna" },
        ],
      },
    ],
    featured: {
      eyebrow: "Alta Orologeria",
      title: "Segnatempo d'Autore",
      description:
        "Bulova, Locman e Paul Picot: meccanica svizzera e design italiano.",
      href: "/orologi",
      cta: "Esplora gli orologi",
      image: "/images/editorial/category-orologi.jpg",
    },
  },
  {
    label: "Accessori",
    href: "/accessori",
    columns: [
      {
        heading: "Accessori",
        links: [
          { label: "Pelletteria", href: "/accessori?sub=pelletteria" },
          { label: "Portachiavi", href: "/accessori?sub=portachiavi" },
          { label: "Gemelli", href: "/accessori?sub=gemelli" },
          { label: "Penne", href: "/accessori?sub=penne" },
        ],
      },
    ],
    featured: {
      eyebrow: "Idee Regalo",
      title: "Dettagli di Pregio",
      description:
        "Pelletteria, gemelli da cerimonia e penne da regalo in confezione luxury.",
      href: "/accessori",
      cta: "Scopri gli accessori",
      image: "/images/editorial/quad-unoaerre-bracciale.jpg",
    },
  },
  {
    label: "Casa",
    href: "/casa",
    columns: [
      {
        heading: "Casa & Arredo",
        links: [
          { label: "Posate", href: "/casa?sub=posate" },
          { label: "Bicchieri", href: "/casa?sub=bicchieri" },
          { label: "Vasi", href: "/casa?sub=vasi" },
          { label: "Profumatori", href: "/casa?sub=profumatori" },
          { label: "Statue", href: "/casa?sub=statue" },
        ],
      },
      {
        heading: "Ambiente",
        links: [
          { label: "Candele", href: "/casa?sub=candele" },
          { label: "Cornici", href: "/casa?sub=cornici" },
          { label: "Decanter", href: "/casa?sub=decanter" },
          { label: "Solidali", href: "/casa?sub=solidali" },
        ],
      },
    ],
    featured: {
      eyebrow: "Arte da Tavola",
      title: "Villeroy & Lladró",
      description:
        "Porcellane, cristalli e oggetti d'arredo per la casa più elegante.",
      href: "/casa",
      cta: "Arreda con stile",
      image: "/images/products/villeroy/VB-2200_1.webp",
    },
  },
  {
    label: "Brand",
    href: "/brand",
    children: [
      { label: "Davite & Delucchi", href: "/brand?marca=davite-delucchi" },
      { label: "Stroili", href: "/brand?marca=stroili" },
      { label: "Nihama", href: "/brand?marca=nihama" },
      { label: "Golay", href: "/brand?marca=golay" },
      { label: "Dana Oro 9 kt", href: "/brand?marca=dana-oro-9-kt" },
      { label: "Cammeo Italiano", href: "/brand?marca=cammeo-italiano" },
      { label: "Gerba", href: "/brand?marca=gerba" },
      { label: "Guess", href: "/brand?marca=guess" },
      { label: "Bulova", href: "/brand?marca=bulova" },
      { label: "Locman", href: "/brand?marca=locman" },
      { label: "Paul Picot", href: "/brand?marca=paul-picot" },
      { label: "Villeroy & Boch", href: "/brand?marca=villeroy-boch" },
      { label: "Lladró", href: "/brand?marca=lladro" },
      { label: "Cuorematto", href: "/brand?marca=cuorematto" },
      { label: "Unoaerre", href: "/brand?marca=unoaerre" },
      { label: "Gli Alberelli", href: "/brand?marca=gli-alberelli" },
      { label: "Ducati", href: "/brand?marca=ducati" },
      { label: "AMEN", href: "/brand?marca=amen" },
    ],
  },
  {
    label: "Natale",
    href: "/natale",
    children: [
      { label: "Decorazioni", href: "/natale?sub=decorazioni" },
      { label: "Regali di Natale", href: "/natale?sub=regali" },
    ],
    featured: {
      eyebrow: "Speciale Natale 2026",
      title: "Speciale Natale 2026",
      description: "Porcellane Villeroy & Boch e idee regalo firmate",
      href: "/natale",
      cta: "Scopri il Natale",
      image: "/images/editorial/category-natale.jpg",
    },
  },
];

/** Sottocategorie ufficiali per macro-area, usate nei filtri di categoria. */
export const subcategoriesByCategory: Record<
  ProductCategory,
  { slug: string; label: string }[]
> = {
  gioielli: [
    { slug: "anelli", label: "Anelli" },
    { slug: "collane", label: "Collane" },
    { slug: "orecchini", label: "Orecchini" },
    { slug: "bracciali", label: "Bracciali" },
    { slug: "ciondoli", label: "Ciondoli e Componenti" },
  ],
  orologi: [
    { slug: "uomo", label: "Uomo" },
    { slug: "donna", label: "Donna" },
  ],
  accessori: [
    { slug: "pelletteria", label: "Pelletteria" },
    { slug: "portachiavi", label: "Portachiavi" },
    { slug: "gemelli", label: "Gemelli" },
    { slug: "penne", label: "Penne" },
  ],
  casa: [
    { slug: "posate", label: "Posate" },
    { slug: "bicchieri", label: "Bicchieri" },
    { slug: "vasi", label: "Vasi" },
    { slug: "profumatori", label: "Profumatori" },
    { slug: "statue", label: "Statue" },
    { slug: "candele", label: "Candele" },
    { slug: "cornici", label: "Cornici" },
    { slug: "decanter", label: "Decanter" },
    { slug: "solidali", label: "Solidali" },
  ],
  natale: [
    { slug: "decorazioni", label: "Decorazioni" },
    { slug: "regali", label: "Regali di Natale" },
  ],
};

/** Titoli editoriali delle pagine di categoria. */
export const categoryCopy: Record<
  ProductCategory,
  { title: string; eyebrow: string; description: string; image: string }
> = {
  gioielli: {
    eyebrow: "Alta Gioielleria",
    title: "Gioielli",
    description:
      "Solitari, verette, collane e bracciali in oro 18 kt e diamanti selezionati, con certificato ufficiale di autenticità.",
    image: "/images/editorial/modella-1.jpg",
  },
  orologi: {
    eyebrow: "Alta Orologeria",
    title: "Orologi",
    description:
      "Segnatempo automatici, cronografi e subacquei dei marchi più prestigiosi, uomo e donna, con garanzia internazionale.",
    image: "/images/products/paul-picot/paul_picot_firshire_moon_01.jpg",
  },
  accessori: {
    eyebrow: "Dettagli di Pregio",
    title: "Accessori",
    description:
      "Pelletteria, portachiavi, gemelli da cerimonia e penne da regalo: l'eleganza nei dettagli quotidiani.",
    image: "/images/products/luxury/gerba_bracciale_pietre_01.jpg",
  },
  casa: {
    eyebrow: "Arte dell'Abitare",
    title: "Casa",
    description:
      "Posate, cristalli, porcellane e profumatori d'ambiente per una casa dal gusto raffinato.",
    image: "/images/products/lladro/lladro_cranes_dome_01.jpg",
  },
  natale: {
    eyebrow: "Speciale Natale 2026",
    title: "Natale",
    description:
      "La selezione stagionale per i regali più preziosi: gioielli, decorazioni e confezioni luxury firmate ORO&CO.",
    image: "/images/natale/natale-1.jpg",
  },
};
