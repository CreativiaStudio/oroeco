/**
 * ORO&CO — Modello Dati Tipizzato per Cassa Banco & POS Hardware
 *
 * Contiene le definizioni di tipo rigorose per:
 * - Operatori autorizzati al banco ('Renato' | 'Carmela' | 'Maria')
 * - Scontrino in costruzione e riepilogo fiscale (IVA 22% scorporata)
 * - Protocollo LAN Ditron ECR per Registratore Telematico Axon Micrelec Aura RT
 * - Emissione 1-Click Fattura Elettronica SDI (B2C & B2B)
 * - Movimentazioni di magazzino e registro giacenze sincronizzate
 */

import type { Product } from "@/types/product";

/* ==========================================================================
   1. OPERATORI CASSA BANCO
   ========================================================================== */

export type CassaOperator = "Renato" | "Carmela" | "Maria";

export interface OperatorProfile {
  id: string;
  name: CassaOperator;
  role: string;
  titleBadge: string;
  description: string;
  colorClass: string;
}

export const OPERATOR_PROFILES: Record<CassaOperator, OperatorProfile> = {
  Renato: {
    id: "op-renato",
    name: "Renato",
    role: "Titolare & Mastro Orafo",
    titleBadge: "TITOLARE",
    description: "Fondatore e perito gemmologo della gioielleria",
    colorClass: "bg-gold text-ink",
  },
  Carmela: {
    id: "op-carmela",
    name: "Carmela",
    role: "Responsabile Banco & Accoglienza",
    titleBadge: "BANCO",
    description: "Mamma di Renato · Presidio vendite e bomboniere",
    colorClass: "bg-emerald-600 text-white",
  },
  Maria: {
    id: "op-maria",
    name: "Maria",
    role: "Consulente Preziosi & Cerimonie",
    titleBadge: "ASSISTENZA",
    description: "Zia di Renato · Cura orologi, perle e accessori",
    colorClass: "bg-navy-deep text-gold-soft border border-gold/40",
  },
};

/* ==========================================================================
   2. TICKET CASSA & CALCOLO FISCALE (IVA 22%)
   ========================================================================== */

export type PaymentMethod = "cash" | "card" | "split";
export type DiscountMode = "percent" | "amount" | "none";

export interface QuickDiscountOption {
  label: string;
  mode: DiscountMode;
  value: number;
}

export const QUICK_DISCOUNTS: QuickDiscountOption[] = [
  { label: "5%", mode: "percent", value: 5 },
  { label: "10%", mode: "percent", value: 10 },
  { label: "15%", mode: "percent", value: 15 },
  { label: "20%", mode: "percent", value: 20 },
  { label: "50 €", mode: "amount", value: 50 },
  { label: "100 €", mode: "amount", value: 100 },
];

export interface CassaTicketLine {
  product: Product;
  quantity: number;
  unitPrice: number;
  lineDiscount: number;
  lineTotal: number;
}

export interface TaxBreakdown {
  subtotal: number;
  discountAmount: number;
  taxableBase: number; // Imponibile = Totale / 1.22
  vatRate: number;     // 22.00%
  vatAmount: number;   // Totale - Imponibile
  total: number;
}

export interface CassaTicket {
  id: string;
  ticketNumber: string;
  operator: CassaOperator;
  items: CassaTicketLine[];
  itemCount: number;
  subtotal: number;
  discountMode: DiscountMode;
  discountValue: number;
  discountAmount: number;
  taxBreakdown: TaxBreakdown;
  total: number;
  paymentMethod: PaymentMethod;
  cashTendered: number;
  changeDue: number;
  lotteryCode?: string;
  notes?: string;
  createdAt: string;
}

/* ==========================================================================
   3. PROTOCOLLO DITRON LAN (AXON MICRELEC AURA RT)
   ========================================================================== */

export interface AuraReceiptItem {
  name: string;
  price: number;
  quantity: number;
  department: number; // Reparto RT: 1=Gioielli/Orologi, 2=Accessori, 3=Casa, 4=Natale
}

export interface AuraReceiptPayload {
  items: AuraReceiptItem[];
  paymentMethod: PaymentMethod;
  discountAmount?: number;
  lotteryCode?: string;
  operatorName: string;
  saleNumber: string;
  cashTendered?: number;
  changeDue?: number;
}

export interface DitronAuraResult {
  commandLines: string[];
  totalEuro: number;
  rawPayload: string;
  simulatedReceiptNumber: string;
  zReport: string;
  timestamp: string;
  formattedThermalReceipt: string;
}

/* ==========================================================================
   4. FATTURA ELETTRONICA SDI 1-CLICK (FATTURAPA v1.2)
   ========================================================================== */

export type SdiCustomerType = "b2c" | "b2b";

export interface SdiCustomerData {
  customerType: SdiCustomerType;
  ragioneSociale: string;
  nome?: string;
  cognome?: string;
  partitaIva: string;
  codiceFiscale: string;
  codiceDestinatario: string; // '0000000' per privati/PEC, 7 caratteri alfanumerici per aziende
  pec: string;
  indirizzo: string;
  civico?: string;
  cap: string;
  comune: string;
  provincia: string;
  nazione: string;
  telefono?: string;
  email?: string;
}

export type SdiValidationErrors = Partial<Record<keyof SdiCustomerData, string>>;

export interface SdiInvoicePayload {
  invoiceNumber: string;
  date: string;
  customer: SdiCustomerData;
  ticket: CassaTicket;
  cedente: {
    denominazione: string;
    partitaIva: string;
    codiceFiscale: string;
    regimeFiscale: string;
    indirizzo: string;
    cap: string;
    comune: string;
    provincia: string;
    nazione: string;
  };
  xmlFatturaPA: string;
  summaryLines: {
    numeroLinea: number;
    descrizione: string;
    quantita: number;
    prezzoUnitario: number;
    prezzoTotale: number;
    aliquotaIVA: number;
  }[];
  totaleDocumento: number;
  imponibileTotale: number;
  impostaTotale: number;
}

/* ==========================================================================
   5. MOVIMENTAZIONI & GIACENZE DI MAGAZZINO
   ========================================================================== */

export type InventoryMovementType =
  | "pos_instore_sale"
  | "ecom_online_sale"
  | "restock"
  | "manual_adjustment"
  | "return_restock"
  | "return_damaged";

export interface InventoryTransaction {
  id: string;
  productId: string;
  sku: string;
  barcode: string;
  productName: string;
  changeQuantity: number; // negativo per vendite, positivo per carichi
  previousQuantity: number;
  newQuantity: number;
  movementType: InventoryMovementType;
  referenceId: string;
  operator: string;
  notes?: string;
  timestamp: string;
}
