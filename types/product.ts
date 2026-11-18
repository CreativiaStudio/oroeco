/**
 * ORO&CO — Modello dati tipizzato.
 *
 * Questi tipi sono speculari a un futuro schema Supabase dedicato al progetto
 * ORO&CO e restano completamente autosufficienti: nessuna dipendenza esterna,
 * nessuna connessione a database di terzi.
 */

/** Macro-aree dello storefront. */
export type ProductCategory =
  | "gioielli"
  | "orologi"
  | "accessori"
  | "casa"
  | "natale";

/** Attributi tecnici del prezioso (metalli, carati, pietre, movimenti…). */
export interface ProductAttributes {
  /** Es. "Oro giallo 18 kt", "Acciaio 316L", "Argento 925". */
  metal?: string;
  /** Es. "18 kt", "9 kt". */
  carats?: string;
  /** Pietre principali, es. ["Diamante", "Zircone"]. */
  stones?: string[];
  /** Taglio della pietra, es. "Brillante". */
  cut?: string;
  /** Peso complessivo in grammi. */
  weightGr?: number;
  /** Caratura/purezza della pietra, es. "0,50 ct". */
  caratWeight?: string;
  /** Misura disponibile, es. "Misura 14". */
  size?: string;
  /** Movimento orologio, es. "Automatico", "Quarzo". */
  movement?: string;
  /** Materiale cassa orologio. */
  caseMaterial?: string;
  /** Impermeabilità, es. "100 m". */
  waterResistance?: string;
  /** Diametro cassa in mm. */
  caseDiameter?: number;
  /** Genere, es. "Uomo", "Donna", "Unisex". */
  gender?: string;
  /** Colore principale. */
  color?: string;
  /** Materiale principale (per accessori/casa). */
  material?: string;
}

/** Marchio trattato in gioielleria. */
export interface Brand {
  /** Identificativo stabile. */
  id: string;
  /** Slug per URL. */
  slug: string;
  /** Nome commerciale ufficiale. */
  name: string;
  /** Origine/stile, es. "Svizzera", "Italia". */
  country?: string;
  /** Breve descrizione editoriale. */
  description?: string;
  /** Macro-aree in cui il marchio è presente. */
  categories: ProductCategory[];
}

/** Prodotto dello storefront. */
export interface Product {
  id: string;
  /** Slug univoco per URL. */
  slug: string;
  name: string;
  /** Nome del marchio (denormalizzato per facilità di render). */
  brand: string;
  /** Slug del marchio. */
  brandSlug: string;
  category: ProductCategory;
  /** Slug della sottocategoria, es. "anelli". */
  subcategory: string;
  /** Etichetta leggibile della sottocategoria, es. "Anelli". */
  subcategoryLabel: string;
  /** Prezzo di vendita in euro. */
  price: number;
  /** Prezzo pieno precedente (per mostrare il barrato), in euro. */
  compareAtPrice?: number;
  currency: "EUR";
  /** Galleria immagini. */
  images: string[];
  /** Descrizione estesa. */
  description: string;
  /** Descrizione sintetica per le card. */
  shortDescription?: string;
  /** Disponibilità a magazzino. */
  inStock: boolean;
  /** Giacenza fisica sincronizzata dal gestionale. */
  stockQuantity: number;
  /** Codice a barre / EAN letto dalla pistola ottica. */
  barcode: string;
  /** Codice articolo interno. */
  sku: string;
  /** Attributi tecnici del prezioso. */
  attributes: ProductAttributes;
  /** Tag liberi per la ricerca e i raggruppamenti. */
  tags: string[];
  /** In evidenza in homepage. */
  isFeatured?: boolean;
  /** Nuovo arrivo. */
  isNew?: boolean;
  /** Selezione stagionale Natale. */
  isChristmas?: boolean;
  /** Rating medio (1–5). */
  rating?: number;
  /** Numero di recensioni. */
  reviewsCount?: number;
  /** Stato approvazione Renato ("approved" | "pending_approval" | "rejected"). */
  approvalStatus?: "approved" | "pending_approval" | "rejected";
  /** Costo ingrosso da fattura fornitore. */
  supplierCost?: number;
  /** Moltiplicatore di ricarico applicato. */
  markupMultiplier?: number;
  /** Nome fornitore da fattura. */
  supplierName?: string;
  /** Riferimento fattura fornitore (numero e data). */
  invoiceRef?: string;
  /** Data di inserimento (ISO). */
  createdAt: string;
}

/** Riga del carrello. */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Riga dello scontrino in costruzione alla cassa banco. */
export interface ReceiptLine {
  product: Product;
  quantity: number;
}
