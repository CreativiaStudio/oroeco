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
        heading: "Sottocategorie",
        links: [
          { label: "Anelli", href: "/gioielli?sub=anelli" },
          { label: "Bracciali", href: "/gioielli?sub=bracciali" },
          { label: "Collane", href: "/gioielli?sub=collane" },
          { label: "Orecchini", href: "/gioielli?sub=orecchini" },
          {
            label: "Ciondoli e Componenti",
            href: "/gioielli?sub=ciondoli",
          },
        ],
      },
    ],
    featured: {
      eyebrow: "Gioielleria",
      title: "Oro, Argento & Luce",
      description:
        "Stroili, Unoaerre, Gerba e Guess selezionati dalla nostra Gioielleria.",
      href: "/gioielli",
      cta: "Scopri la collezione",
      image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-3.jpg",
    },
  },
  {
    label: "Orologi",
    href: "/orologi",
    columns: [
      {
        heading: "Sottocategorie",
        links: [
          { label: "Orologi Uomo", href: "/orologi?sub=uomo" },
          { label: "Orologi Donna", href: "/orologi?sub=donna" },
        ],
      },
    ],
    featured: {
      eyebrow: "Alta Orologeria",
      title: "Segnatempo d'Autore",
      description:
        "Bulova, Locman, Paul Picot e Guess: meccanica svizzera e design italiano.",
      href: "/orologi",
      cta: "Esplora gli orologi",
      image: "/images/client-media/cat-orologi.webp",
    },
  },
  {
    label: "Accessori",
    href: "/accessori",
    columns: [
      {
        heading: "Sottocategorie",
        links: [
          { label: "Pelletteria", href: "/accessori?sub=pelletteria" },
        ],
      },
    ],
    featured: {
      eyebrow: "Pelletteria & Regali",
      title: "Dettagli di Pregio",
      description:
        "Pochette e porta carte in pelle Saffiano firmati Gerba, in confezione regalo.",
      href: "/accessori",
      cta: "Scopri gli accessori",
      image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/gerba/gb015-black-01.webp",
    },
  },
  {
    label: "Casa",
    href: "/casa",
    columns: [
      {
        heading: "Sottocategorie",
        links: [
          { label: "Statue", href: "/casa?sub=statue" },
          { label: "Profumatori", href: "/casa?sub=profumatori" },
          { label: "Candele", href: "/casa?sub=candele" },
          { label: "Vasi", href: "/casa?sub=vasi" },
          { label: "Decanter", href: "/casa?sub=decanter" },
        ],
      },
    ],
    featured: {
      eyebrow: "Arte dell'Abitare",
      title: "Gli Alberelli & Lladró",
      description:
        "Sculture in porcellana, ceramiche artistiche e profumatori d'ambiente.",
      href: "/casa",
      cta: "Arreda con stile",
      image: "/images/client-media/cat-casa.webp",
    },
  },
  {
    label: "Brand",
    href: "/brand",
    children: [
      { label: "Bulova", href: "/brand/bulova" },
      { label: "Cammeo Italiano", href: "/brand/cammeo-italiano" },
      { label: "Cuorematto", href: "/brand/cuorematto" },
      { label: "Dana Oro 9 kt", href: "/brand/dana-oro-9-kt" },
      { label: "Davite & Delucchi", href: "/brand/davite-delucchi" },
      { label: "Ducati", href: "/brand/ducati" },
      { label: "Gerba", href: "/brand/gerba" },
      { label: "Gli Alberelli", href: "/brand/gli-alberelli" },
      { label: "Golay", href: "/brand/golay" },
      { label: "Guess", href: "/brand/guess" },
      { label: "Lladró", href: "/brand/lladro" },
      { label: "Locman", href: "/brand/locman" },
      { label: "Nihama", href: "/brand/nihama" },
      { label: "Paul Picot", href: "/brand/paul-picot" },
      { label: "Stroili", href: "/brand/stroili" },
      { label: "Unoaerre", href: "/brand/unoaerre" },
      { label: "Villeroy & Boch", href: "/brand/villeroy-boch" },
    ],
  },
  {
    label: "Natale",
    href: "/natale",
  },
];

/** Sottocategorie ufficiali per macro-area, allineate al catalogo live approvato. */
export const subcategoriesByCategory: Record<
  ProductCategory,
  { slug: string; label: string }[]
> = {
  gioielli: [
    { slug: "anelli", label: "Anelli" },
    { slug: "bracciali", label: "Bracciali" },
    { slug: "collane", label: "Collane" },
    { slug: "orecchini", label: "Orecchini" },
    { slug: "ciondoli", label: "Ciondoli e Componenti" },
  ],
  orologi: [
    { slug: "uomo", label: "Orologi Uomo" },
    { slug: "donna", label: "Orologi Donna" },
  ],
  accessori: [
    { slug: "pelletteria", label: "Pelletteria" },
  ],
  casa: [
    { slug: "statue", label: "Statue" },
    { slug: "profumatori", label: "Profumatori" },
    { slug: "candele", label: "Candele" },
    { slug: "vasi", label: "Vasi" },
    { slug: "decanter", label: "Decanter" },
  ],
  natale: [],
};

/** Titoli editoriali delle pagine di categoria. */
export const categoryCopy: Record<
  ProductCategory,
  { title: string; eyebrow: string; description: string; image: string }
> = {
  gioielli: {
    eyebrow: "Gioielleria",
    title: "Gioielli",
    description:
      "Anelli, bracciali, collane, orecchini e ciondoli selezionati con certificato ufficiale di autenticità.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/editorial/modella-1.jpg",
  },
  orologi: {
    eyebrow: "Alta Orologeria",
    title: "Orologi",
    description:
      "Segnatempo automatici, cronografi e subacquei dei marchi più prestigiosi, uomo e donna, con garanzia internazionale.",
    image: "/images/client-media/cat-orologi.webp",
  },
  accessori: {
    eyebrow: "Dettagli di Pregio",
    title: "Accessori",
    description:
      "Pelletteria in pelle Saffiano e accessori da regalo firmati: l'eleganza nei dettagli quotidiani.",
    image: "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/gerba/gb015-black-01.webp",
  },
  casa: {
    eyebrow: "Arte dell'Abitare",
    title: "Casa",
    description:
      "Porcellane Lladró, ceramiche Gli Alberelli, profumatori d'ambiente e oggetti d'autore per una casa dal gusto raffinato.",
    image: "/images/client-media/cat-casa.webp",
  },
  natale: {
    eyebrow: "Speciale Natale 2026",
    title: "Natale",
    description:
      "La selezione stagionale per i regali più preziosi: decorazioni Villeroy & Boch, oggetti da collezione e confezioni firmate ORO&CO.",
    image: "/images/client-media/cat-natale.webp",
  },
};
