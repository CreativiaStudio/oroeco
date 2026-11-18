/**
 * ORO&CO — Test di Validazione Integrata Milestones M1, M2, M3
 */

import fs from "fs";
import path from "path";
import {
  buildThermalReceiptPreview,
  generateDitronAuraPayload,
  getDepartmentForCategory,
} from "../lib/auraProtocol";
import { getAllProducts } from "../lib/catalog";
import { generateSdiPayload, validateSdiCustomer } from "../lib/sdiProtocol";
import { useInventoryStore } from "../store/useInventoryStore";
import type { CassaTicket, SdiCustomerData } from "../types/cassa";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runVerification() {
  console.log("=== 1. VERIFICA SUPABASE SCHEMA DDL (M1 / R3) ===");
  const schemaPath = path.resolve(__dirname, "../supabase/schema.sql");
  assert(fs.existsSync(schemaPath), "File supabase/schema.sql esiste");

  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const requiredTables = [
    "oroeco_brands",
    "oroeco_categories",
    "oroeco_products",
    "oroeco_customers",
    "oroeco_sales",
    "oroeco_sale_items",
    "oroeco_inventory_transactions",
    "oroeco_aura_receipts",
    "oroeco_audit_log",
  ];

  requiredTables.forEach((tbl) => {
    assert(schemaContent.includes(`CREATE TABLE IF NOT EXISTS ${tbl}`), `Tabella ${tbl} definita`);
  });

  assert(schemaContent.includes("ENABLE ROW LEVEL SECURITY"), "RLS abilitata sulle tabelle");
  assert(schemaContent.includes("oroeco_record_pos_sale"), "Stored procedure oroeco_record_pos_sale presente");
  assert(schemaContent.includes("idx_oroeco_products_barcode"), "Indice barcode presente");
  assert(!schemaContent.includes("creativia_hub"), "Isolamento totale da Creativia DB rispettato");

  console.log("\n=== 2. VERIFICA PROTOCOLLO DITRON LAN AURA RT (M3 / R2) ===");
  const mockProduct = getAllProducts()[0];
  assert(!!mockProduct, "Almeno 1 prodotto presente nel catalogo");

  const mockTicket: CassaTicket = {
    id: "ORC-TEST-001",
    ticketNumber: "ORC-TEST-001",
    operator: "Renato",
    items: [
      {
        product: mockProduct,
        quantity: 2,
        unitPrice: mockProduct.price,
        lineDiscount: 0,
        lineTotal: mockProduct.price * 2,
      },
    ],
    itemCount: 2,
    subtotal: mockProduct.price * 2,
    discountMode: "percent",
    discountValue: 10,
    discountAmount: (mockProduct.price * 2 * 0.10),
    taxBreakdown: {
      subtotal: mockProduct.price * 2,
      discountAmount: (mockProduct.price * 2 * 0.10),
      taxableBase: Number(((mockProduct.price * 2 * 0.90) / 1.22).toFixed(2)),
      vatRate: 22.0,
      vatAmount: Number(((mockProduct.price * 2 * 0.90) - ((mockProduct.price * 2 * 0.90) / 1.22)).toFixed(2)),
      total: (mockProduct.price * 2 * 0.90),
    },
    total: (mockProduct.price * 2 * 0.90),
    paymentMethod: "cash",
    cashTendered: (mockProduct.price * 2 * 0.90) + 50,
    changeDue: 50,
    lotteryCode: "8A7B6C5D",
    createdAt: new Date().toISOString(),
  };

  const auraPayload = generateDitronAuraPayload(mockTicket, "Renato");
  assert(auraPayload.commandLines.some((l) => l.startsWith("OPER DES=")), "Comando OPER presente");
  assert(auraPayload.commandLines.some((l) => l.startsWith("VEND REP=")), "Comando VEND presente");
  assert(auraPayload.commandLines.includes("SUBT"), "Comando SUBT presente");
  assert(auraPayload.commandLines.some((l) => l.startsWith("SCONTO S=")), "Comando SCONTO presente");
  assert(auraPayload.commandLines.some((l) => l.startsWith("LOTTERIA COD=")), "Comando LOTTERIA presente");
  assert(auraPayload.commandLines.some((l) => l.startsWith("CHIUS T=1")), "Comando CHIUS T=1 presente");

  const thermalText = buildThermalReceiptPreview(mockTicket, "Renato");
  assert(thermalText.includes("ORO&CO GIOIELLERIA"), "Intestazione termica presente");
  assert(thermalText.includes("IVA 22,00%"), "Dettaglio scorporo IVA 22% presente");
  assert(thermalText.includes("RESTO DA DARE"), "Riepilogo resto da dare presente");

  console.log("\n=== 3. VERIFICA PROTOCOLLO FATTURA SDI 1-CLICK (M3 / R2) ===");
  const validB2C: SdiCustomerData = {
    customerType: "b2c",
    ragioneSociale: "Mario Rossi",
    codiceFiscale: "RSSMRA80A01H703S",
    partitaIva: "",
    codiceDestinatario: "0000000",
    pec: "",
    indirizzo: "Via Roma, 10",
    cap: "84016",
    comune: "Pagani",
    provincia: "SA",
    nazione: "IT",
  };
  const valB2C = validateSdiCustomer(validB2C);
  assert(valB2C.isValid, "Validazione B2C valida con Codice Fiscale corretto");

  const invalidB2C: SdiCustomerData = {
    ...validB2C,
    codiceFiscale: "12345", // Errato
  };
  const valInvB2C = validateSdiCustomer(invalidB2C);
  assert(!valInvB2C.isValid && !!valInvB2C.errors.codiceFiscale, "Validazione B2C scarta Codice Fiscale errato");

  const validB2B: SdiCustomerData = {
    customerType: "b2b",
    ragioneSociale: "Boutique Lusso S.r.l.",
    codiceFiscale: "01234567890",
    partitaIva: "01234567890",
    codiceDestinatario: "M5UXCR1",
    pec: "azienda@pec.it",
    indirizzo: "Corso Italia, 45",
    cap: "80100",
    comune: "Napoli",
    provincia: "NA",
    nazione: "IT",
  };
  const valB2B = validateSdiCustomer(validB2B);
  assert(valB2B.isValid, "Validazione B2B valida con P.IVA e Codice SDI");

  const sdiPayload = generateSdiPayload(validB2C, mockTicket, "Renato");
  assert(sdiPayload.xmlFatturaPA.includes("<p:FatturaElettronica"), "Tracciato XML FPR12 generato");
  assert(sdiPayload.xmlFatturaPA.includes("ORO&CO GIOIELLERIA"), "Cedente ORO&CO presente nel XML");
  assert(sdiPayload.xmlFatturaPA.includes("RSSMRA80A01H703S"), "Codice Fiscale cessionario presente nel XML");

  console.log("\n=== 4. VERIFICA STORE GIACENZE ZUSTAND (M1 / M3) ===");
  const store = useInventoryStore.getState();
  const initialStock = store.getStock(mockProduct.id);
  assert(initialStock > 0, `Giacenza iniziale prodotto ${mockProduct.id}: ${initialStock}`);

  const depleted = store.depleteStock(mockProduct.barcode, 1, "TEST-SALE", "Renato");
  assert(depleted, "Scalo giacenza riuscito");
  assert(store.getStock(mockProduct.id) === initialStock - 1, "Giacenza scalata di 1 pz");

  const history = store.getTransactionHistory();
  assert(history.length > 0 && history[0].changeQuantity === -1, "Registro movimentazioni tracciato");

  store.resetToCatalog();
  assert(store.getStock(mockProduct.id) === mockProduct.stockQuantity, "Ripristino giacenze a catalogo riuscito");

  console.log("\n=== 5. VERIFICA FOOTER AGENCY CREDIT (M2 / R1) ===");
  const footerPath = path.resolve(__dirname, "../components/layout/Footer.tsx");
  const footerContent = fs.readFileSync(footerPath, "utf-8");
  assert(
    footerContent.includes("Sviluppato da") && footerContent.includes("Creativia Studio"),
    "Credit 'Sviluppato da Creativia Studio' presente nel Footer",
  );

  console.log("\n🎉 TUTTE LE VERIFICHE M1, M2, M3 SONO COMPLETATE CON SUCCESSO AL 100%!");
}

runVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
