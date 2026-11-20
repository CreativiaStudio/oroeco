import type { Brand, Product, ProductCategory } from "@/types/product";

/* ------------------------------------------------------------------ *
 *  ORO&CO — Catalogo locale tipizzato e autosufficiente.
 *  Nessuna connessione a database esterni: dati demo realistici
 *  speculari al futuro schema Supabase dedicato al progetto.
 * ------------------------------------------------------------------ */

const UNSPLASH = "https://images.unsplash.com/photo-";

/** Costruisce un URL ottimizzato a partire dall'id della foto. */
function img(id: string, width = 1400): string {
  return `${UNSPLASH}${id}?auto=format&fit=crop&w=${width}&q=80`;
}

/** Marchi ufficiali censiti in gioielleria. */
export const brands: Brand[] = [
  {
    id: "brand-davite-delucchi",
    slug: "davite-delucchi",
    name: "Davite & Delucchi",
    country: "Italia",
    description:
      "Gioielleria italiana d'autore: linee contemporanee in oro e diamanti.",
    categories: ["gioielli"],
  },
  {
    id: "brand-stroili",
    slug: "stroili",
    name: "Stroili",
    country: "Italia",
    description:
      "Il marchio italiano del gioiello accessibile, dal design curato.",
    categories: ["gioielli", "orologi"],
  },
  {
    id: "brand-nihama",
    slug: "nihama",
    name: "Nihama",
    country: "Italia",
    description:
      "Alta gioielleria in perle coltivate e creazioni preziose, disponibile in gioielleria su appuntamento.",
    categories: ["gioielli"],
  },
  {
    id: "brand-golay",
    slug: "golay",
    name: "Golay",
    country: "Svizzera",
    description:
      "Alta gioielleria svizzera, sinonimo di diamanti eccezionali.",
    categories: ["gioielli"],
  },
  {
    id: "brand-dana-oro",
    slug: "dana-oro-9-kt",
    name: "Dana Oro 9 kt",
    country: "Italia",
    description: "Oro 9 kt leggero e portabile, dal prezzo accessibile.",
    categories: ["gioielli"],
  },
  {
    id: "brand-cammeo-italiano",
    slug: "cammeo-italiano",
    name: "Cammeo Italiano",
    country: "Italia",
    description:
      "Cammei incisi a mano della tradizione torrese, pezzi unici.",
    categories: ["gioielli"],
  },
  {
    id: "brand-gerba",
    slug: "gerba",
    name: "Gerba",
    country: "Italia",
    description: "Accessori maschili di classe: gemelli, portachiavi, penne.",
    categories: ["accessori"],
  },
  {
    id: "brand-guess",
    slug: "guess",
    name: "Guess",
    country: "USA",
    description: "Lifestyle e orologeria dal design glamour e riconoscibile.",
    categories: ["orologi", "accessori"],
  },
  {
    id: "brand-bulova",
    slug: "bulova",
    name: "Bulova",
    country: "USA",
    description:
      "Storica maison di orologeria americana, pioniera dell'innovazione.",
    categories: ["orologi"],
  },
  {
    id: "brand-locman",
    slug: "locman",
    name: "Locman",
    country: "Italia",
    description:
      "Orologeria italiana dall'Isola d'Elba, design mediterraneo e sportivo.",
    categories: ["orologi"],
  },
  {
    id: "brand-paul-picot",
    slug: "paul-picot",
    name: "Paul Picot",
    country: "Svizzera",
    description: "Alta orologeria svizzera, manifattura d'eccellenza.",
    categories: ["orologi"],
  },
  {
    id: "brand-villeroy-boch",
    slug: "villeroy-boch",
    name: "Villeroy & Boch",
    country: "Germania",
    description:
      "Porcellane e cristalli d'arredo per la tavola e la casa elegante.",
    categories: ["casa"],
  },
  {
    id: "brand-lladro",
    slug: "lladro",
    name: "Lladró",
    country: "Spagna",
    description:
      "Sculture in porcellana artistica, icone di raffinatezza dal 1953.",
    categories: ["casa"],
  },
  {
    id: "brand-cuorematto",
    slug: "cuorematto",
    name: "Cuorematto",
    country: "Italia",
    description:
      "Profumatori, decorazioni natalizie e oggetti regalo artigianali.",
    categories: ["casa", "natale"],
  },
  {
    id: "brand-unoaerre",
    slug: "unoaerre",
    name: "Unoaerre",
    country: "Italia",
    description:
      "Leader italiano nell'oreficeria, catene e bracciali in oro 18 kt.",
    categories: ["gioielli"],
  },
  {
    id: "brand-gli-alberelli",
    slug: "gli-alberelli",
    name: "Gli Alberelli",
    country: "Italia",
    description:
      "Decorazioni natalizie e cornici d'autore in argento e porcellana.",
    categories: ["casa", "natale"],
  },
  {
    id: "brand-ducati",
    slug: "ducati",
    name: "Ducati",
    country: "Italia",
    description:
      "Orologi dal design sportivo e grintoso ispirato al mondo Ducati Corse.",
    categories: ["orologi"],
  },
];

export const products: Product[] = [
  /* ------------------------------ GIOIELLI: ANELLI ----------------------------- */
  {
    id: "p-001",
    slug: "solitario-oro-bianco-diamante-050",
    name: "Solitario Oro Bianco e Diamante 0,50 ct",
    brand: "Golay",
    brandSlug: "golay",
    category: "gioielli",
    subcategory: "anelli",
    subcategoryLabel: "Anelli",
    price: 2480,
    compareAtPrice: 2890,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/golay_south_sea_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/golay_south_sea_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_velvet_box.jpg"
    ],
    description:
      "Solitario in oro bianco 18 kt con diamante centrale brillante da 0,50 ct, purezza VS e colore G. La montatura a griffe esalta la luce della pietra. Corredato di certificato gemmologico ufficiale e astuccio in velluto.",
    shortDescription:
      "Diamante centrale 0,50 ct, oro bianco 18 kt, certificato incluso.",
    inStock: true,
    stockQuantity: 4,
    barcode: "8054112300017",
    sku: "ORC-AN-001",
    attributes: {
      metal: "Oro bianco 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      cut: "Brillante",
      caratWeight: "0,50 ct",
      weightGr: 3.4,
      size: "Misura 14",
      gender: "Donna",
      color: "Argento",
    },
    tags: ["solitario", "diamante", "proposta", "oro bianco", "anello"],
    isFeatured: true,
    isNew: true,
    rating: 5,
    reviewsCount: 37,
    createdAt: "2026-01-12T09:00:00.000Z",
  },
  {
    id: "p-002",
    slug: "veretta-eternity-diamanti-oro-giallo",
    name: "Veretta Eternity Diamanti Oro Giallo 18 kt",
    brand: "Davite & Delucchi",
    brandSlug: "davite-delucchi",
    category: "gioielli",
    subcategory: "anelli",
    subcategoryLabel: "Anelli",
    price: 1290,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/davite-delucchi/veretta_diamanti_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/davite-delucchi/veretta_diamanti_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/davite-delucchi/veretta_diamanti_03.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/davite-delucchi/davite_box_certificato.jpg"
    ],
    description:
      "Veretta eternity in oro giallo 18 kt con diamanti a brillante incastonati a giro completo. Un classico intramontabile da indossare da sola o in abbinamento.",
    shortDescription: "Giro completo di diamanti, oro giallo 18 kt.",
    inStock: true,
    stockQuantity: 7,
    barcode: "8054112300024",
    sku: "ORC-AN-002",
    attributes: {
      metal: "Oro giallo 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      cut: "Brillante",
      caratWeight: "0,35 ct totali",
      weightGr: 2.8,
      size: "Misura 15",
      gender: "Donna",
      color: "Giallo",
    },
    tags: ["veretta", "eternity", "diamanti", "anello"],
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 21,
    createdAt: "2025-11-03T09:00:00.000Z",
  },
  {
    id: "p-003",
    slug: "anello-trilogy-oro-bianco-diamanti",
    name: "Anello Trilogy Oro Bianco e Diamanti",
    brand: "Golay",
    brandSlug: "golay",
    category: "gioielli",
    subcategory: "anelli",
    subcategoryLabel: "Anelli",
    price: 1890,
    compareAtPrice: 2150,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/golay_south_sea_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/golay_south_sea_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_velvet_box.jpg"
    ],
    description:
      "Anello trilogy in oro bianco 18 kt con tre diamanti a rappresentare passato, presente e futuro. Eleganza senza tempo per l'anello più importante.",
    shortDescription: "Tre diamanti, oro bianco 18 kt: passato, presente, futuro.",
    inStock: true,
    stockQuantity: 3,
    barcode: "8054112300031",
    sku: "ORC-AN-003",
    attributes: {
      metal: "Oro bianco 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      cut: "Brillante",
      caratWeight: "0,60 ct totali",
      weightGr: 3.9,
      size: "Misura 13",
      gender: "Donna",
      color: "Argento",
    },
    tags: ["trilogy", "diamanti", "fidanzamento", "anello"],
    rating: 4.9,
    reviewsCount: 18,
    createdAt: "2025-09-21T09:00:00.000Z",
  },

  /* ------------------------------ GIOIELLI: COLLANE ---------------------------- */
  {
    id: "p-004",
    slug: "collana-punto-luce-diamante",
    name: "Collana Punto Luce Diamante 0,10 ct",
    brand: "Unoaerre",
    brandSlug: "unoaerre",
    category: "gioielli",
    subcategory: "collane",
    subcategoryLabel: "Collane",
    price: 690,
    currency: "EUR",
    images: [
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_gioiello_classica_lux.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_indossato_lifestyle.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_packaging_gold_box.jpg"
    ],
    description:
      "Delicata collana punto luce in oro 18 kt con diamante solitario da 0,10 ct. Il regalo perfetto, discreto e luminoso, per ogni occasione.",
    shortDescription: "Punto luce con diamante 0,10 ct su catenina oro 18 kt.",
    inStock: true,
    stockQuantity: 12,
    barcode: "8054112300048",
    sku: "ORC-CO-001",
    attributes: {
      metal: "Oro giallo 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      caratWeight: "0,10 ct",
      weightGr: 1.9,
      gender: "Donna",
      color: "Giallo",
    },
    tags: ["punto luce", "collana", "diamante", "regalo"],
    isFeatured: true,
    rating: 4.9,
    reviewsCount: 54,
    createdAt: "2025-12-01T09:00:00.000Z",
  },
  {
    id: "p-005",
    slug: "catena-oro-giallo-maglia-rolo",
    name: "Catena Oro Giallo 18 kt Maglia Rolò",
    brand: "Unoaerre",
    brandSlug: "unoaerre",
    category: "gioielli",
    subcategory: "collane",
    subcategoryLabel: "Collane",
    price: 1150,
    currency: "EUR",
    images: [
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_gioiello_classica_lux.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_indossato_lifestyle.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_packaging_gold_box.jpg"
    ],
    description:
      "Catena in oro giallo 18 kt con classica maglia rolò, robusta e preziosa. Lunghezza regolabile, chiusura a moschettone rinforzata.",
    shortDescription: "Maglia rolò in oro giallo 18 kt, chiusura rinforzata.",
    inStock: true,
    stockQuantity: 5,
    barcode: "8054112300055",
    sku: "ORC-CO-002",
    attributes: {
      metal: "Oro giallo 18 kt",
      carats: "18 kt",
      weightGr: 6.2,
      size: "45 cm",
      gender: "Unisex",
      color: "Giallo",
    },
    tags: ["catena", "rolò", "oro giallo", "collana"],
    rating: 4.7,
    reviewsCount: 12,
    createdAt: "2025-08-14T09:00:00.000Z",
  },
  {
    id: "p-006",
    slug: "collier-nihama-perle-oro",
    name: "Collier Nihama Perle e Oro",
    brand: "Nihama",
    brandSlug: "nihama",
    category: "gioielli",
    subcategory: "collane",
    subcategoryLabel: "Collane",
    price: 980,
    compareAtPrice: 1180,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/nihama/nihama_akoya_strand_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/nihama/nihama_akoya_clasp_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/nihama/nihama_akoya_luster_03.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/nihama/nihama_box_passaporto.jpg"
    ],
    description:
      "Collier in oro con perle di acqua dolce selezionate, dal lustro naturale. Un gioiello romantico e sofisticato per le occasioni speciali.",
    shortDescription: "Perle d'acqua dolce e finiture in oro, chiusura a sfera.",
    inStock: true,
    stockQuantity: 6,
    barcode: "8054112300062",
    sku: "ORC-CO-003",
    attributes: {
      metal: "Oro 18 kt",
      carats: "18 kt",
      stones: ["Perla d'acqua dolce"],
      size: "42 cm",
      gender: "Donna",
      color: "Bianco",
    },
    tags: ["collier", "perle", "nihama", "collana"],
    rating: 4.6,
    reviewsCount: 9,
    createdAt: "2025-10-19T09:00:00.000Z",
  },

  /* ----------------------------- GIOIELLI: ORECCHINI --------------------------- */
  {
    id: "p-007",
    slug: "orecchini-lobo-diamanti-oro-rosa",
    name: "Orecchini a Lobo Diamanti Oro Rosa",
    brand: "Stroili",
    brandSlug: "stroili",
    category: "gioielli",
    subcategory: "orecchini",
    subcategoryLabel: "Orecchini",
    price: 540,
    currency: "EUR",
    images: [
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dw8a856d1d/images/c1685836-master.jpg?sw=1024&sh=1024",
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dw0603fb8a/images/c1685836-model4.jpg?sw=1024&sh=1024",
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dwcae9fa7f/images/c1685836-view4.jpg?sw=1024&sh=1024"
    ],
    description:
      "Orecchini a lobo in oro rosa 18 kt con diamanti a brillante. Un tocco di luce quotidiano, minimale ed elegante.",
    shortDescription: "Diamanti su oro rosa 18 kt, chiusura a farfalla.",
    inStock: true,
    stockQuantity: 9,
    barcode: "8054112300079",
    sku: "ORC-OR-001",
    attributes: {
      metal: "Oro rosa 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      caratWeight: "0,15 ct totali",
      gender: "Donna",
      color: "Rosa",
    },
    tags: ["orecchini", "lobo", "diamanti", "oro rosa"],
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 26,
    createdAt: "2025-12-18T09:00:00.000Z",
  },
  {
    id: "p-008",
    slug: "orecchini-pendenti-cammeo",
    name: "Orecchini Pendenti Cammeo Inciso a Mano",
    brand: "Cammeo Italiano",
    brandSlug: "cammeo-italiano",
    category: "gioielli",
    subcategory: "orecchini",
    subcategoryLabel: "Orecchini",
    price: 450,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/cammeo_italiano_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/cammeo_italiano_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_velvet_box.jpg"
    ],
    description:
      "Orecchini pendenti con cammeo inciso a mano della tradizione torrese, montati su oro 18 kt. Ogni pezzo è unico, espressione dell'artigianato italiano.",
    shortDescription: "Cammeo inciso a mano su montatura in oro 18 kt.",
    inStock: true,
    stockQuantity: 4,
    barcode: "8054112300086",
    sku: "ORC-OR-002",
    attributes: {
      metal: "Oro giallo 18 kt",
      carats: "18 kt",
      stones: ["Cammeo"],
      material: "Conchiglia incisa",
      gender: "Donna",
      color: "Arancio",
    },
    tags: ["cammeo", "orecchini", "artigianale", "made in italy"],
    rating: 4.9,
    reviewsCount: 14,
    createdAt: "2025-07-02T09:00:00.000Z",
  },
  {
    id: "p-009",
    slug: "orecchini-cerchio-oro-giallo",
    name: "Orecchini a Cerchio Oro Giallo",
    brand: "Dana Oro 9 kt",
    brandSlug: "dana-oro-9-kt",
    category: "gioielli",
    subcategory: "orecchini",
    subcategoryLabel: "Orecchini",
    price: 290,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/dana_oro_cerchi_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/dana_oro_cerchi_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_velvet_box.jpg"
    ],
    description:
      "Orecchini a cerchio in oro giallo 9 kt, leggeri e portabili tutto il giorno. Un classico dal prezzo accessibile, perfetto anche da regalare.",
    shortDescription: "Cerchi in oro 9 kt, leggeri e versatili.",
    inStock: true,
    stockQuantity: 15,
    barcode: "8054112300093",
    sku: "ORC-OR-003",
    attributes: {
      metal: "Oro giallo 9 kt",
      carats: "9 kt",
      weightGr: 1.4,
      gender: "Donna",
      color: "Giallo",
    },
    tags: ["orecchini", "cerchio", "oro 9 kt", "regalo"],
    rating: 4.5,
    reviewsCount: 31,
    createdAt: "2025-06-11T09:00:00.000Z",
  },

  /* ----------------------------- GIOIELLI: BRACCIALI --------------------------- */
  {
    id: "p-010",
    slug: "bracciale-tennis-diamanti-oro-bianco",
    name: "Bracciale Tennis Diamanti Oro Bianco",
    brand: "Nihama",
    brandSlug: "nihama",
    category: "gioielli",
    subcategory: "bracciali",
    subcategoryLabel: "Bracciali",
    price: 3450,
    compareAtPrice: 3990,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/nihama/nihama_bracciale_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/nihama/nihama_bracciale_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/nihama/nihama_box_passaporto.jpg"
    ],
    description:
      "Bracciale tennis in oro bianco 18 kt con una linea ininterrotta di diamanti. Massima espressione di luce e raffinatezza al polso.",
    shortDescription: "Linea continua di diamanti su oro bianco 18 kt.",
    inStock: true,
    stockQuantity: 2,
    barcode: "8054112300109",
    sku: "ORC-BR-001",
    attributes: {
      metal: "Oro bianco 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      cut: "Brillante",
      caratWeight: "1,20 ct totali",
      size: "17 cm",
      gender: "Donna",
      color: "Argento",
    },
    tags: ["tennis", "diamanti", "bracciale", "alta gioielleria"],
    isFeatured: true,
    rating: 5,
    reviewsCount: 11,
    createdAt: "2026-01-28T09:00:00.000Z",
  },
  {
    id: "p-011",
    slug: "bracciale-rigido-oro-giallo-18kt",
    name: "Bracciale Rigido Oro Giallo 18 kt",
    brand: "Unoaerre",
    brandSlug: "unoaerre",
    category: "gioielli",
    subcategory: "bracciali",
    subcategoryLabel: "Bracciali",
    price: 1590,
    currency: "EUR",
    images: [
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_gioiello_classica_lux.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_indossato_lifestyle.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_packaging_gold_box.jpg"
    ],
    description:
      "Bracciale rigido in oro giallo 18 kt dalla finitura satinata lucida. Linee pulite e presenza importante, ideale anche da solo.",
    shortDescription: "Bracciale rigido oro giallo 18 kt, finitura satinata.",
    inStock: true,
    stockQuantity: 5,
    barcode: "8054112300116",
    sku: "ORC-BR-002",
    attributes: {
      metal: "Oro giallo 18 kt",
      carats: "18 kt",
      weightGr: 8.7,
      size: "18 cm",
      gender: "Donna",
      color: "Giallo",
    },
    tags: ["bracciale", "rigido", "oro giallo", "unoaerre"],
    rating: 4.7,
    reviewsCount: 8,
    createdAt: "2025-09-05T09:00:00.000Z",
  },
  {
    id: "p-012",
    slug: "bracciale-catena-oro-bianco",
    name: "Bracciale Catena Oro Bianco",
    brand: "Dana Oro 9 kt",
    brandSlug: "dana-oro-9-kt",
    category: "gioielli",
    subcategory: "bracciali",
    subcategoryLabel: "Bracciali",
    price: 390,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/dana_oro_cerchi_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/dana_oro_cerchi_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_velvet_box.jpg"
    ],
    description:
      "Bracciale a catena in oro bianco 9 kt, dal design moderno e portabile ogni giorno. Ottimo come prima gioielleria o regalo.",
    shortDescription: "Catena in oro bianco 9 kt, chiusura a moschettone.",
    inStock: true,
    stockQuantity: 13,
    barcode: "8054112300123",
    sku: "ORC-BR-003",
    attributes: {
      metal: "Oro bianco 9 kt",
      carats: "9 kt",
      weightGr: 3.1,
      size: "19 cm",
      gender: "Unisex",
      color: "Argento",
    },
    tags: ["bracciale", "catena", "oro bianco", "regalo"],
    rating: 4.4,
    reviewsCount: 22,
    createdAt: "2025-05-27T09:00:00.000Z",
  },

  /* ------------------------- GIOIELLI: CIONDOLI E COMPONENTI ------------------- */
  {
    id: "p-013",
    slug: "ciondolo-cuore-oro-diamanti",
    name: "Ciondolo Cuore Oro e Diamanti",
    brand: "Stroili",
    brandSlug: "stroili",
    category: "gioielli",
    subcategory: "ciondoli",
    subcategoryLabel: "Ciondoli e Componenti",
    price: 320,
    currency: "EUR",
    images: [
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dw8a856d1d/images/c1685836-master.jpg?sw=1024&sh=1024",
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dw0603fb8a/images/c1685836-model4.jpg?sw=1024&sh=1024",
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dwcae9fa7f/images/c1685836-view4.jpg?sw=1024&sh=1024"
    ],
    description:
      "Ciondolo a cuore in oro con micro-diamanti, simbolo intramontabile d'amore. Da indossare su catenina o bracciale.",
    shortDescription: "Cuore in oro con micro-diamanti, anello di aggancio incluso.",
    inStock: true,
    stockQuantity: 11,
    barcode: "8054112300130",
    sku: "ORC-CI-001",
    attributes: {
      metal: "Oro 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      gender: "Donna",
      color: "Giallo",
    },
    tags: ["ciondolo", "cuore", "diamanti", "regalo"],
    rating: 4.8,
    reviewsCount: 44,
    createdAt: "2025-12-09T09:00:00.000Z",
  },
  {
    id: "p-014",
    slug: "ciondolo-madonna-argento-925",
    name: "Ciondolo Madonna in Argento 925",
    brand: "AMEN",
    brandSlug: "amen",
    category: "gioielli",
    subcategory: "ciondoli",
    subcategoryLabel: "Ciondoli e Componenti",
    price: 129,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/amen_medaglia_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/amen_medaglia_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/amen_box.jpg"
    ],
    description:
      "Medaglia della Madonna in argento 925 smaltato, custode di fede e protezione. Un dono di valore che accompagna ogni giorno.",
    shortDescription: "Medaglia religiosa in argento 925, ideale come regalo.",
    inStock: true,
    stockQuantity: 20,
    barcode: "8054112300147",
    sku: "ORC-CI-002",
    attributes: {
      metal: "Argento 925",
      stones: [],
      material: "Argento 925",
      gender: "Unisex",
      color: "Argento",
    },
    tags: ["ciondolo", "madonna", "argento", "religioso", "natale"],
    isChristmas: true,
    rating: 4.9,
    reviewsCount: 58,
    createdAt: "2025-11-20T09:00:00.000Z",
  },
  {
    id: "p-015",
    slug: "charm-natale-stella-oro",
    name: "Charm Natale Stella Oro",
    brand: "Unoaerre",
    brandSlug: "unoaerre",
    category: "gioielli",
    subcategory: "ciondoli",
    subcategoryLabel: "Ciondoli e Componenti",
    price: 180,
    currency: "EUR",
    images: [
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_gioiello_classica_lux.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_indossato_lifestyle.jpg",
          "https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/u/n/unoaerre_packaging_gold_box.jpg"
    ],
    description:
      "Charm a forma di stella cometa in oro 18 kt: il regalo natalizio che illumina il bracciale. Componibile con altri charm ORO&CO.",
    shortDescription: "Charm stella cometa in oro 18 kt, collezione Natale.",
    inStock: true,
    stockQuantity: 16,
    barcode: "8054112300154",
    sku: "ORC-CI-003",
    attributes: {
      metal: "Oro giallo 18 kt",
      carats: "18 kt",
      gender: "Unisex",
      color: "Giallo",
    },
    tags: ["charm", "natale", "stella", "regalo"],
    isChristmas: true,
    rating: 4.7,
    reviewsCount: 19,
    createdAt: "2025-12-22T09:00:00.000Z",
  },

  /* ------------------------------ OROLOGI: UOMO ------------------------------- */
  {
    id: "p-016",
    slug: "bulova-classic-cronografo-acciaio",
    name: "Bulova Classic Cronografo Acciaio",
    brand: "Bulova",
    brandSlug: "bulova",
    category: "orologi",
    subcategory: "uomo",
    subcategoryLabel: "Uomo",
    price: 449,
    compareAtPrice: 529,
    currency: "EUR",
    images: [
          "https://media.citizen.it/ImgOriginal/bulova_96B441_01_2000x2000.jpg",
          "https://media.citizen.it/ImgOriginal/bulova_96B441_02_2000x2000.jpg",
          "https://media.citizen.it/ImgOriginal/bulova_96B441_03_2000x2000.jpg"
    ],
    description:
      "Cronografo Bulova Classic in acciaio con quadrante soleillé e datario. Movimento al quarzo di precisione, bracciale a maglia di acciaio con chiusura deployante.",
    shortDescription: "Cronografo al quarzo, acciaio, 42 mm, 50 m.",
    inStock: true,
    stockQuantity: 6,
    barcode: "8054112300161",
    sku: "ORC-OR-U01",
    attributes: {
      movement: "Quarzo cronografo",
      caseMaterial: "Acciaio 316L",
      caseDiameter: 42,
      waterResistance: "50 m",
      gender: "Uomo",
      color: "Argento",
      material: "Acciaio",
    },
    tags: ["orologio", "cronografo", "bulova", "uomo", "acciaio"],
    isFeatured: true,
    rating: 4.7,
    reviewsCount: 63,
    createdAt: "2025-10-08T09:00:00.000Z",
  },
  {
    id: "p-017",
    slug: "locman-montecristo-automatico",
    name: "Locman Montecristo Automatico",
    brand: "Locman",
    brandSlug: "locman",
    category: "orologi",
    subcategory: "uomo",
    subcategoryLabel: "Uomo",
    price: 1290,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/locman/locman_montecristo_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/locman/locman_montecristo_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/locman/locman_box_garanzia.jpg"
    ],
    description:
      "Locman Montecristo con movimento automatico svizzero, cassa in acciaio e vetro zaffiro. Design italiano dal carattere sportivo ed elegante.",
    shortDescription: "Automatico svizzero, zaffiro, 44 mm, 100 m.",
    inStock: true,
    stockQuantity: 3,
    barcode: "8054112300178",
    sku: "ORC-OR-U02",
    attributes: {
      movement: "Automatico",
      caseMaterial: "Acciaio",
      caseDiameter: 44,
      waterResistance: "100 m",
      gender: "Uomo",
      color: "Nero",
      material: "Acciaio",
    },
    tags: ["orologio", "automatico", "locman", "uomo", "svizzera"],
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 27,
    createdAt: "2025-09-30T09:00:00.000Z",
  },
  {
    id: "p-018",
    slug: "paul-picot-chronograph-swiss-made",
    name: "Paul Picot Chronograph Swiss Made",
    brand: "Paul Picot",
    brandSlug: "paul-picot",
    category: "orologi",
    subcategory: "uomo",
    subcategoryLabel: "Uomo",
    price: 3900,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/paul-picot/paul_picot_classic_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/paul-picot/paul_picot_classic_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/paul-picot/paul_picot_radica_box.jpg"
    ],
    description:
      "Cronografo Paul Picot di manifattura svizzera, cassa in acciaio con finiture a specchio e quadrante guilloché. Alta orologeria per i collezionisti.",
    shortDescription: "Cronografo svizzero di manifattura, zaffiro, 100 m.",
    inStock: true,
    stockQuantity: 1,
    barcode: "8054112300185",
    sku: "ORC-OR-U03",
    attributes: {
      movement: "Automatico cronografo",
      caseMaterial: "Acciaio",
      caseDiameter: 42,
      waterResistance: "100 m",
      gender: "Uomo",
      color: "Blu",
      material: "Acciaio",
    },
    tags: ["orologio", "paul picot", "svizzera", "alta orologeria"],
    rating: 5,
    reviewsCount: 6,
    createdAt: "2025-08-22T09:00:00.000Z",
  },
  {
    id: "p-019",
    slug: "guess-voyage-subacqueo-uomo",
    name: "Guess Voyage Subacqueo Uomo",
    brand: "Guess",
    brandSlug: "guess",
    category: "orologi",
    subcategory: "uomo",
    subcategoryLabel: "Uomo",
    price: 299,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_watch_box.jpg"
    ],
    description:
      "Orologio subacqueo Guess Voyage con ghiera girevole, cassa oversize e cinturino in silicone. Stile deciso per un look contemporaneo.",
    shortDescription: "Subacqueo 50 m, ghiera girevole, cinturino silicone.",
    inStock: true,
    stockQuantity: 8,
    barcode: "8054112300192",
    sku: "ORC-OR-U04",
    attributes: {
      movement: "Quarzo",
      caseMaterial: "Acciaio",
      caseDiameter: 46,
      waterResistance: "50 m",
      gender: "Uomo",
      color: "Nero",
      material: "Acciaio e silicone",
    },
    tags: ["orologio", "guess", "subacqueo", "uomo"],
    rating: 4.5,
    reviewsCount: 41,
    createdAt: "2025-07-15T09:00:00.000Z",
  },

  /* ------------------------------ OROLOGI: DONNA ------------------------------ */
  {
    id: "p-020",
    slug: "guess-luminosa-orologio-donna-gioiello",
    name: "Guess Luminosa Orologio Donna Gioiello",
    brand: "Guess",
    brandSlug: "guess",
    category: "orologi",
    subcategory: "donna",
    subcategoryLabel: "Donna",
    price: 249,
    compareAtPrice: 299,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_watch_box.jpg"
    ],
    description:
      "Orologio donna Guess con quadrante madreperla e cristalli scintillanti. Un accessorio gioiello che illumina ogni outfit.",
    shortDescription: "Quadrante madreperla, cristalli, bracciale a maglia.",
    inStock: true,
    stockQuantity: 10,
    barcode: "8054112300208",
    sku: "ORC-OR-D01",
    attributes: {
      movement: "Quarzo",
      caseMaterial: "Acciaio",
      caseDiameter: 36,
      waterResistance: "30 m",
      gender: "Donna",
      color: "Argento",
      material: "Acciaio",
    },
    tags: ["orologio", "guess", "donna", "gioiello", "madreperla"],
    isFeatured: true,
    rating: 4.6,
    reviewsCount: 35,
    createdAt: "2025-10-25T09:00:00.000Z",
  },
  {
    id: "p-021",
    slug: "locman-orologio-donna-eleganza",
    name: "Locman Orologio Donna Eleganza",
    brand: "Locman",
    brandSlug: "locman",
    category: "orologi",
    subcategory: "donna",
    subcategoryLabel: "Donna",
    price: 690,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/locman/locman_stealth_lady_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/locman/locman_stealth_lady_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/locman/locman_box_garanzia.jpg"
    ],
    description:
      "Orologio donna Locman dal design elegante e minimalista, cassa in acciaio e cinturino intercambiabile. Made in Italy, garanzia internazionale.",
    shortDescription: "Design italiano, cassa 32 mm, cinturino in pelle.",
    inStock: true,
    stockQuantity: 5,
    barcode: "8054112300215",
    sku: "ORC-OR-D02",
    attributes: {
      movement: "Quarzo",
      caseMaterial: "Acciaio",
      caseDiameter: 32,
      waterResistance: "50 m",
      gender: "Donna",
      color: "Oro rosa",
      material: "Acciaio e pelle",
    },
    tags: ["orologio", "locman", "donna", "italia"],
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 17,
    createdAt: "2025-11-11T09:00:00.000Z",
  },
  {
    id: "p-022",
    slug: "bulova-donna-quarzo-perlato",
    name: "Bulova Donna Quarzo Perlato",
    brand: "Bulova",
    brandSlug: "bulova",
    category: "orologi",
    subcategory: "donna",
    subcategoryLabel: "Donna",
    price: 329,
    currency: "EUR",
    images: [
          "https://media.citizen.it/ImgOriginal/bulova_96P148_01_2000x2000.jpg",
          "https://media.citizen.it/ImgOriginal/bulova_96P148_02_2000x2000.jpg"
    ],
    description:
      "Orologio Bulova da donna con quadrante perlato, indici applicati e bracciale a maglia Milanese. Raffinatezza quotidiana e precisione al quarzo.",
    shortDescription: "Quadrante perlato, maglia Milanese, 34 mm.",
    inStock: true,
    stockQuantity: 7,
    barcode: "8054112300222",
    sku: "ORC-OR-D03",
    attributes: {
      movement: "Quarzo",
      caseMaterial: "Acciaio",
      caseDiameter: 34,
      waterResistance: "30 m",
      gender: "Donna",
      color: "Argento",
      material: "Acciaio",
    },
    tags: ["orologio", "bulova", "donna", "perlato"],
    rating: 4.6,
    reviewsCount: 23,
    createdAt: "2025-06-30T09:00:00.000Z",
  },

  /* --------------------------- ACCESSORI: PELLETTERIA -------------------------- */
  {
    id: "p-023",
    slug: "portafoglio-pelle-martellata-uomo",
    name: "Portafoglio Pelle Martellata Uomo",
    brand: "Guess",
    brandSlug: "guess",
    category: "accessori",
    subcategory: "pelletteria",
    subcategoryLabel: "Pelletteria",
    price: 89,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_watch_box.jpg"
    ],
    description:
      "Portafoglio uomo in pelle martellata con logo in metallo, scomparti per carte e porta banconote. Eleganza funzionale per ogni giorno.",
    shortDescription: "Pelle martellata, 8 slot carte, porta banconote.",
    inStock: true,
    stockQuantity: 22,
    barcode: "8054112300239",
    sku: "ORC-AC-P01",
    attributes: {
      material: "Pelle",
      gender: "Uomo",
      color: "Marrone",
    },
    tags: ["portafoglio", "pelletteria", "guess", "uomo", "regalo"],
    rating: 4.5,
    reviewsCount: 48,
    createdAt: "2025-09-16T09:00:00.000Z",
  },
  {
    id: "p-024",
    slug: "cintura-pelle-fibbia-acciaio",
    name: "Cintura Pelle con Fibbia in Acciaio",
    brand: "Ducati",
    brandSlug: "ducati",
    category: "accessori",
    subcategory: "pelletteria",
    subcategoryLabel: "Pelletteria",
    price: 119,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/ducati_corse_crono_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/ducati_corse_crono_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_watch_box.jpg"
    ],
    description:
      "Cintura in pelle pieno fiore con fibbia in acciaio spazzolato. Linea pulita ispirata al design Ducati, per un look maschile deciso.",
    shortDescription: "Pelle pieno fiore, fibbia acciaio, taglia regolabile.",
    inStock: true,
    stockQuantity: 14,
    barcode: "8054112300246",
    sku: "ORC-AC-P02",
    attributes: {
      material: "Pelle",
      gender: "Uomo",
      color: "Nero",
    },
    tags: ["cintura", "pelletteria", "ducati", "uomo"],
    rating: 4.4,
    reviewsCount: 15,
    createdAt: "2025-08-08T09:00:00.000Z",
  },

  /* --------------------------- ACCESSORI: PORTACHIAVI -------------------------- */
  {
    id: "p-025",
    slug: "portachiavi-lux-argento-925",
    name: "Portachiavi Lux in Argento 925",
    brand: "Gerba",
    brandSlug: "gerba",
    category: "accessori",
    subcategory: "portachiavi",
    subcategoryLabel: "Portachiavi",
    price: 79,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/gerba_bracciale_pietre_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/gerba_bracciale_pietre_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_pouch.jpg"
    ],
    description:
      "Portachiavi in argento 925 dal design minimale, con anello rinforzato e incisione personalizzabile. Un dettaglio di lusso da regalare.",
    shortDescription: "Argento 925, incisione personalizzabile inclusa.",
    inStock: true,
    stockQuantity: 18,
    barcode: "8054112300253",
    sku: "ORC-AC-K01",
    attributes: {
      metal: "Argento 925",
      material: "Argento 925",
      gender: "Unisex",
      color: "Argento",
    },
    tags: ["portachiavi", "argento", "gerba", "regalo"],
    rating: 4.7,
    reviewsCount: 29,
    createdAt: "2025-10-02T09:00:00.000Z",
  },

  /* ----------------------------- ACCESSORI: GEMELLI --------------------------- */
  {
    id: "p-026",
    slug: "gemelli-cerimonia-onice-acciaio",
    name: "Gemelli Cerimonia Onice e Acciaio",
    brand: "Gerba",
    brandSlug: "gerba",
    category: "accessori",
    subcategory: "gemelli",
    subcategoryLabel: "Gemelli",
    price: 145,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/gerba_bracciale_pietre_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/gerba_bracciale_pietre_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_pouch.jpg"
    ],
    description:
      "Gemelli da cerimonia con inserto in onice nero e finitura in acciaio. L'accessorio essenziale per smoking e abiti formali, in confezione regalo.",
    shortDescription: "Onice nero e acciaio, confezione regalo inclusa.",
    inStock: true,
    stockQuantity: 12,
    barcode: "8054112300260",
    sku: "ORC-AC-G01",
    attributes: {
      metal: "Acciaio",
      stones: ["Onice"],
      material: "Acciaio e onice",
      gender: "Uomo",
      color: "Nero",
    },
    tags: ["gemelli", "cerimonia", "gerba", "uomo", "regalo"],
    rating: 4.8,
    reviewsCount: 20,
    createdAt: "2025-09-08T09:00:00.000Z",
  },

  /* ------------------------------ ACCESSORI: PENNE ---------------------------- */
  {
    id: "p-027",
    slug: "penna-stilografica-regalo-luxury",
    name: "Penna Stilografica Regalo Luxury",
    brand: "Ducati",
    brandSlug: "ducati",
    category: "accessori",
    subcategory: "penne",
    subcategoryLabel: "Penne",
    price: 189,
    compareAtPrice: 220,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/ducati_corse_crono_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/ducati_corse_crono_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_watch_box.jpg"
    ],
    description:
      "Stilografica dal corpo in resina lucida con dettagli in metallo e pennino in acciaio. Presentata in elegante confezione regalo con cartuccia e converter.",
    shortDescription: "Pennino in acciaio, confezione regalo con converter.",
    inStock: true,
    stockQuantity: 9,
    barcode: "8054112300277",
    sku: "ORC-AC-S01",
    attributes: {
      material: "Resina e metallo",
      color: "Nero",
      gender: "Unisex",
    },
    tags: ["penna", "stilografica", "regalo", "ducati"],
    rating: 4.6,
    reviewsCount: 13,
    createdAt: "2025-07-21T09:00:00.000Z",
  },
  {
    id: "p-028",
    slug: "penna-sfera-detailing-oro",
    name: "Penna a Sfera con Detailing Oro",
    brand: "Guess",
    brandSlug: "guess",
    category: "accessori",
    subcategory: "penne",
    subcategoryLabel: "Penne",
    price: 69,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/guess_watch_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_watch_box.jpg"
    ],
    description:
      "Penna a sfera con finiture dorate e logo in evidenza. Scrittura fluida e design raffinato, ideale come pensiero aziendale o regalo.",
    shortDescription: "Finitura oro, scrittura fluida, ricarica inclusa.",
    inStock: true,
    stockQuantity: 25,
    barcode: "8054112300284",
    sku: "ORC-AC-S02",
    attributes: {
      material: "Metallo",
      color: "Nero e oro",
      gender: "Unisex",
    },
    tags: ["penna", "sfera", "guess", "regalo"],
    rating: 4.4,
    reviewsCount: 33,
    createdAt: "2025-06-18T09:00:00.000Z",
  },

  /* --------------------------------- CASA ------------------------------------- */
  {
    id: "p-029",
    slug: "servizio-posate-acciaio-24-pezzi",
    name: "Servizio Posate Acciaio 24 Pezzi",
    brand: "Villeroy & Boch",
    brandSlug: "villeroy-boch",
    category: "casa",
    subcategory: "posate",
    subcategoryLabel: "Posate",
    price: 199,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_posate_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_posate_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_gift_box.jpg"
    ],
    description:
      "Servizio posate in acciaio inossidabile 18/10 da 24 pezzi, design contemporaneo e finitura lucida. Lavabile in lavastoviglie.",
    shortDescription: "Acciaio 18/10, 24 pezzi per 6 persone.",
    inStock: true,
    stockQuantity: 6,
    barcode: "8054112300291",
    sku: "ORC-CA-P01",
    attributes: {
      material: "Acciaio inox 18/10",
      color: "Argento",
    },
    tags: ["posate", "tavola", "villeroy", "casa"],
    rating: 4.8,
    reviewsCount: 16,
    createdAt: "2025-09-12T09:00:00.000Z",
  },
  {
    id: "p-030",
    slug: "calice-cristallo-set-6-bicchieri",
    name: "Calice Cristallo Set 6 Bicchieri",
    brand: "Villeroy & Boch",
    brandSlug: "villeroy-boch",
    category: "casa",
    subcategory: "bicchieri",
    subcategoryLabel: "Bicchieri",
    price: 149,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_maxima_calici_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_maxima_calici_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_gift_box.jpg"
    ],
    description:
      "Set di 6 calici in cristallo sonoro dal gambo sottile e coppa ampia. Perfetti per esaltare vini pregiati e brindare con stile.",
    shortDescription: "Cristallo sonoro, set da 6, lavabile a mano.",
    inStock: true,
    stockQuantity: 9,
    barcode: "8054112300307",
    sku: "ORC-CA-B01",
    attributes: {
      material: "Cristallo",
      color: "Trasparente",
    },
    tags: ["bicchieri", "cristallo", "villeroy", "casa"],
    rating: 4.7,
    reviewsCount: 11,
    createdAt: "2025-08-30T09:00:00.000Z",
  },
  {
    id: "p-031",
    slug: "vaso-ceramica-artigianale",
    name: "Vaso in Ceramica Artigianale",
    brand: "Lladró",
    brandSlug: "lladro",
    category: "casa",
    subcategory: "vasi",
    subcategoryLabel: "Vasi",
    price: 260,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/lladro/lladro_valencia_art_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/lladro/lladro_valencia_art_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/lladro/lladro_box_sigillo.jpg"
    ],
    description:
      "Vaso in ceramica decorata a mano, con finiture smaltate e motivi classici. Un oggetto d'arredo che impreziosisce ogni ambiente.",
    shortDescription: "Ceramica decorata a mano, altezza 32 cm.",
    inStock: true,
    stockQuantity: 4,
    barcode: "8054112300314",
    sku: "ORC-CA-V01",
    attributes: {
      material: "Ceramica",
      color: "Bianco e oro",
    },
    tags: ["vaso", "ceramica", "lladro", "arredo"],
    rating: 4.9,
    reviewsCount: 7,
    createdAt: "2025-07-09T09:00:00.000Z",
  },
  {
    id: "p-032",
    slug: "diffusore-profumo-ambiente-oud",
    name: "Diffusore Profumo d'Ambiente Oud",
    brand: "Cuorematto",
    brandSlug: "cuorematto",
    category: "casa",
    subcategory: "profumatori",
    subcategoryLabel: "Profumatori",
    price: 59,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/cuorematto/D9162.jpeg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/cuorematto/cuorematto_box_solidale.jpg"
    ],
    description:
      "Diffusore con bastoncini in rattan, fragranza Oud calda e avvolgente. Fino a 3 mesi di profumazione per un ambiente elegante.",
    shortDescription: "Fragranza Oud, 500 ml, fino a 3 mesi.",
    inStock: true,
    stockQuantity: 20,
    barcode: "8054112300321",
    sku: "ORC-CA-F01",
    attributes: {
      material: "Vetro e rattan",
      color: "Ambra",
    },
    tags: ["profumatore", "ambiente", "oud", "regalo", "natale"],
    isFeatured: true,
    isChristmas: true,
    rating: 4.6,
    reviewsCount: 25,
    createdAt: "2025-11-25T09:00:00.000Z",
  },
  {
    id: "p-033",
    slug: "statuina-porcellana-ladro",
    name: "Statuina in Porcellana Bimbo con Bambola",
    brand: "Lladró",
    brandSlug: "lladro",
    category: "casa",
    subcategory: "statue",
    subcategoryLabel: "Statue",
    price: 420,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/lladro/lladro_valencia_art_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/lladro/lladro_valencia_art_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/lladro/lladro_box_sigillo.jpg"
    ],
    description:
      "Statuina in porcellana artistica dipinta a mano, raffigurante un bimbo con bambola. Pezzo da collezione firmato Lladró, autentico valore nel tempo.",
    shortDescription: "Porcellana artistica dipinta a mano, collezione Lladró.",
    inStock: true,
    stockQuantity: 2,
    barcode: "8054112300338",
    sku: "ORC-CA-S01",
    attributes: {
      material: "Porcellana",
      color: "Multicolore",
    },
    tags: ["statua", "porcellana", "lladro", "collezione"],
    rating: 5,
    reviewsCount: 4,
    createdAt: "2025-06-05T09:00:00.000Z",
  },
  {
    id: "p-034",
    slug: "candela-profumata-gli-alberelli",
    name: "Candela Profumata Gli Alberelli",
    brand: "Gli Alberelli",
    brandSlug: "gli-alberelli",
    category: "casa",
    subcategory: "candele",
    subcategoryLabel: "Candele",
    price: 45,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/alberelli_capodimonte_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/alberelli_capodimonte_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_gift_box.jpg"
    ],
    description:
      "Candela profumata con fragranza speziata di arancio e cannella, in bicchiere di vetro decorato. Perfetta per creare atmosfera nelle feste.",
    shortDescription: "Arancio e cannella, cera vegetale, 40 ore.",
    inStock: true,
    stockQuantity: 30,
    barcode: "8054112300345",
    sku: "ORC-CA-C01",
    attributes: {
      material: "Cera vegetale e vetro",
      color: "Ambra",
    },
    tags: ["candela", "profumata", "natale", "regalo"],
    isFeatured: true,
    isChristmas: true,
    rating: 4.7,
    reviewsCount: 38,
    createdAt: "2025-12-05T09:00:00.000Z",
  },
  {
    id: "p-035",
    slug: "cornice-argento-stile-barocco",
    name: "Cornice in Argento Stile Barocco",
    brand: "Gli Alberelli",
    brandSlug: "gli-alberelli",
    category: "casa",
    subcategory: "cornici",
    subcategoryLabel: "Cornici",
    price: 129,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/alberelli_capodimonte_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/alberelli_capodimonte_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_gift_box.jpg"
    ],
    description:
      "Cornice in argento con decori in stile barocco, per custodire i ricordi più cari. Vetro protettivo e retro in velluto.",
    shortDescription: "Argento decorato, formato 13x18 cm, retro in velluto.",
    inStock: true,
    stockQuantity: 10,
    barcode: "8054112300352",
    sku: "ORC-CA-CO01",
    attributes: {
      metal: "Argento",
      material: "Argento e velluto",
      color: "Argento",
    },
    tags: ["cornice", "argento", "natale", "regalo"],
    isChristmas: true,
    rating: 4.8,
    reviewsCount: 12,
    createdAt: "2025-11-02T09:00:00.000Z",
  },
  {
    id: "p-036",
    slug: "decanter-cristallo-con-tappo",
    name: "Decanter Cristallo con Tappo",
    brand: "Villeroy & Boch",
    brandSlug: "villeroy-boch",
    category: "casa",
    subcategory: "decanter",
    subcategoryLabel: "Decanter",
    price: 139,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_decanter_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_decanter_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_gift_box.jpg"
    ],
    description:
      "Decanter in cristallo soffiato con tappo a sfera, ideale per ossigenare vini rossi importanti. Design classico e presenza scenica.",
    shortDescription: "Cristallo soffiato, capacità 1,3 L, tappo incluso.",
    inStock: true,
    stockQuantity: 5,
    barcode: "8054112300369",
    sku: "ORC-CA-D01",
    attributes: {
      material: "Cristallo",
      color: "Trasparente",
    },
    tags: ["decanter", "cristallo", "villeroy", "vino"],
    rating: 4.7,
    reviewsCount: 9,
    createdAt: "2025-08-02T09:00:00.000Z",
  },
  {
    id: "p-037",
    slug: "idea-regalo-solidale-cuorematto",
    name: "Idea Regalo Solidale Cuorematto",
    brand: "Cuorematto",
    brandSlug: "cuorematto",
    category: "casa",
    subcategory: "solidali",
    subcategoryLabel: "Solidali",
    price: 29,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/cuorematto/D9183.jpeg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/cuorematto/cuorematto_box_solidale.jpg"
    ],
    description:
      "Oggetto regalo solidale: parte del ricavato sostiene progetti di beneficenza. Un pensiero che fa del bene, in confezione regalo.",
    shortDescription: "Regalo solidale, parte del ricavato in beneficenza.",
    inStock: true,
    stockQuantity: 40,
    barcode: "8054112300376",
    sku: "ORC-CA-SO01",
    attributes: {
      material: "Ceramica e cera",
      color: "Rosso",
    },
    tags: ["solidale", "regalo", "natale", "beneficenza"],
    isChristmas: true,
    rating: 4.9,
    reviewsCount: 52,
    createdAt: "2025-11-15T09:00:00.000Z",
  },

  /* ---------------------------------- NATALE ---------------------------------- */
  {
    id: "p-038",
    slug: "decorazione-albero-natale-oro",
    name: "Decorazione Albero di Natale in Oro",
    brand: "Gli Alberelli",
    brandSlug: "gli-alberelli",
    category: "natale",
    subcategory: "decorazioni",
    subcategoryLabel: "Decorazioni",
    price: 79,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/alberelli_capodimonte_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/alberelli_capodimonte_02.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/luxury/luxury_gift_box.jpg"
    ],
    description:
      "Decorazione per albero in vetro soffiato con finitura dorata, realizzata a mano. Un tocco di luce preziosa per l'albero di Natale.",
    shortDescription: "Vetro soffiato a mano, finitura oro, 12 cm.",
    inStock: true,
    stockQuantity: 24,
    barcode: "8054112300383",
    sku: "ORC-NA-D01",
    attributes: {
      material: "Vetro soffiato",
      color: "Oro",
    },
    tags: ["natale", "decorazione", "albero", "regalo"],
    isFeatured: true,
    isChristmas: true,
    rating: 4.8,
    reviewsCount: 30,
    createdAt: "2025-12-10T09:00:00.000Z",
  },
  {
    id: "p-039",
    slug: "set-regalo-natale-gioiello-confezione",
    name: "Set Regalo Natale Gioiello + Confezione",
    brand: "Stroili",
    brandSlug: "stroili",
    category: "natale",
    subcategory: "regali",
    subcategoryLabel: "Regali di Natale",
    price: 390,
    compareAtPrice: 460,
    currency: "EUR",
    images: [
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dw8a856d1d/images/c1685836-master.jpg?sw=1024&sh=1024",
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dw0603fb8a/images/c1685836-model4.jpg?sw=1024&sh=1024",
          "https://www.stroilioro.com/dw/image/v2/BCQS_PRD/on/demandware.static/-/Sites-THOM_CATALOG/default/dwcae9fa7f/images/c1685836-view4.jpg?sw=1024&sh=1024"
    ],
    description:
      "Set regalo di Natale con gioiello in oro e diamanti, confezione luxury con fiocco e biglietto personalizzabile. La sorpresa perfetta sotto l'albero.",
    shortDescription: "Gioiello oro e diamanti con confezione luxury e biglietto.",
    inStock: true,
    stockQuantity: 6,
    barcode: "8054112300390",
    sku: "ORC-NA-R01",
    attributes: {
      metal: "Oro 18 kt",
      carats: "18 kt",
      stones: ["Diamante"],
      color: "Giallo",
    },
    tags: ["natale", "regalo", "set", "gioiello", "diamanti"],
    isFeatured: true,
    isChristmas: true,
    isNew: true,
    rating: 4.9,
    reviewsCount: 21,
    createdAt: "2026-01-05T09:00:00.000Z",
  },
  {
    id: "p-040",
    slug: "pallina-natale-personalizzata",
    name: "Pallina di Natale Personalizzata",
    brand: "Cuorematto",
    brandSlug: "cuorematto",
    category: "natale",
    subcategory: "decorazioni",
    subcategoryLabel: "Decorazioni",
    price: 19,
    currency: "EUR",
    images: [
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/villeroy/villeroy_toys_delight_01.jpg",
          "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev/products/cuorematto/cuorematto_box_solidale.jpg"
    ],
    description:
      "Pallina natalizia personalizzabile con nome e data, in vetro e decori dipinti a mano. Un ricordo unico da appendere ogni anno.",
    shortDescription: "Personalizzabile con nome e data, decoro dipinto a mano.",
    inStock: true,
    stockQuantity: 50,
    barcode: "8054112300406",
    sku: "ORC-NA-D02",
    attributes: {
      material: "Vetro",
      color: "Rosso e oro",
    },
    tags: ["natale", "pallina", "personalizzata", "regalo"],
    isChristmas: true,
    rating: 4.6,
    reviewsCount: 47,
    createdAt: "2025-12-15T09:00:00.000Z",
  },
];

/* --------------------------- Funzioni di accesso --------------------------- */

/** Tutti i prodotti attivi. */
export function getAllProducts(): Product[] {
  return products;
}

/** Prodotto singolo per slug. */
export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

/** Prodotti di una macro-categoria. */
export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((product) => product.category === category);
}

/** Prodotti di una sottocategoria. */
export function getProductsBySubcategory(subcategory: string): Product[] {
  return products.filter((product) => product.subcategory === subcategory);
}

/**
 * Prodotti di un marchio. Accetta il nome ("Golay") oppure lo slug
 * ("golay") indifferentemente.
 */
export function getProductsByBrand(brandNameOrSlug: string): Product[] {
  const needle = brandNameOrSlug.toLowerCase();
  return products.filter(
    (product) =>
      product.brandSlug === needle || product.brand.toLowerCase() === needle,
  );
}

/** Prodotti in evidenza per la homepage. */
export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.isFeatured);
}

/** Selezione stagionale Natale (tag esplicito o categoria dedicata). */
export function getChristmasProducts(): Product[] {
  return products.filter(
    (product) => product.isChristmas || product.category === "natale",
  );
}

/** Nuovi arrivi, dal più recente. */
export function getNewArrivals(): Product[] {
  return [...products]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 8);
}

/** Ricerca full-text semplice su nome, brand, sku, barcode e tag. */
export function searchProducts(query: string): Product[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return products.filter((product) => {
    const haystack = [
      product.name,
      product.brand,
      product.sku,
      product.barcode,
      product.category,
      product.subcategoryLabel,
      ...product.tags,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

/** Lookup rapido per codice a barre (pistola ottica) o SKU. */
export function findProductByCode(code: string): Product | undefined {
  const needle = code.trim();
  if (!needle) return undefined;
  return products.find(
    (product) =>
      product.barcode === needle ||
      product.sku.toLowerCase() === needle.toLowerCase(),
  );
}

/** Elenco dei marchi. */
export function getAllBrands(): Brand[] {
  return brands;
}

/** Marchio per slug. */
export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((brand) => brand.slug === slug);
}

/** Le quattro collezioni della tabella "in evidenza" in homepage. */
export function getDiamondsAndGold(): Product[] {
  return products.filter((product) =>
    product.tags.some((tag) =>
      ["diamante", "diamanti", "oro", "oro giallo", "oro bianco", "solitario"].includes(
        tag,
      ),
    ),
  );
}
