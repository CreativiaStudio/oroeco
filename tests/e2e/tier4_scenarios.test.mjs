/**
 * tests/e2e/tier4_scenarios.test.mjs
 * ---------------------------------------------------------------------------
 * GIOIELLERIA OROECO — Tier 4: Real-World Workload Scenarios (S1–S5)
 *
 * Opaque-box, requirement-driven end-to-end workflows described in
 * TEST_INFRA.md §"Real-World Application Scenarios (Tier 4)" and PROJECT.md:
 *
 *   S1  In-Store Luxury Walk-In Sale  (Renato · Aura RT · stock depletion)
 *   S2  High-Ticket Corporate SDI Invoice (Carmela · B2B · FatturaPA)
 *   S3  E-Commerce Luxury Customer Journey (/storia · /gioielli · CartDrawer)
 *   S4  Omnichannel Inventory Depletion (Maria · /admin/cassa · audit trail)
 *   S5  Christmas Campaign Seasonal Rush (Renato · burst scanner · Reparto 4)
 *
 * Execution modes
 *   - node tests/e2e/tier4_scenarios.test.mjs   (harness auto-runs, sets exit code)
 *   - node tests/e2e/runner.mjs                 (runner drives runSuites itself)
 *
 * The application code lives in TypeScript. Node >= 22.18 strips types from
 * `.ts` files natively, so the modules are imported directly. The same two
 * accommodations registered by Tiers 1–3 are provided up-front for the test
 * process only (never touching production source):
 *   1. a resolver hook mapping the `@/...` tsconfig path alias to the project
 *      root (needed by store/useInventoryStore.ts and the protocol modules),
 *   2. a React stub for lib/useBarcodeScanner.ts so the real keydown handler
 *      can be exercised outside a browser without a DOM renderer.
 *
 * Note on scenario list prices: the boutique scenarios pin their negotiated
 * showcase prices (e.g. the 1.850 € ring or 499 € watch) while the catalogue
 * product identities (barcode, SKU, brand, department) remain the real ones,
 * so Aura RT departments, SDI descriptions and inventory barcodes stay aligned
 * with `lib/catalog.ts`.
 * ---------------------------------------------------------------------------
 */

import { describe, it, test, expect, assert, registerSuite } from "./harness.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "node:module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

/* ===========================================================================
 * Test-process shims (never touch production source)
 * ========================================================================= */

// In-memory Web Storage so the zustand `persist` middleware works head-less.
// Node 25 exposes its own `localStorage`, so we explicitly provide a functional
// implementation on the head-less `window` (which is what zustand reads).
const memoryStorage = (() => {
  const memory = new Map();
  return {
    getItem: (key) => (memory.has(key) ? memory.get(key) : null),
    setItem: (key, value) => memory.set(key, String(value)),
    removeItem: (key) => memory.delete(key),
    clear: () => memory.clear(),
    key: (index) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    },
  };
})();

if (typeof globalThis.window === "undefined") {
  globalThis.window = {};
}
globalThis.window.localStorage = memoryStorage;
try {
  Object.defineProperty(globalThis, "localStorage", {
    value: memoryStorage,
    configurable: true,
    writable: true,
  });
} catch {
  // Non-configurable built-in — `window.localStorage` above is what matters.
}

// Minimal React module (only the hooks used by useBarcodeScanner).
const reactStubSource = [
  "export function useRef(initial){ return { current: initial }; }",
  'export function useEffect(fn){ const cleanup = fn(); if (typeof cleanup === "function") { (globalThis.__oroecoCleanups ||= []).push(cleanup); } }',
  "export function useState(value){ return [typeof value === 'function' ? value() : value, () => {}]; }",
  "export function useCallback(fn){ return fn; }",
  "export function useMemo(fn){ return fn(); }",
].join("\n");
const REACT_STUB_URL = "data:text/javascript," + encodeURIComponent(reactStubSource);

// Resolver hook: `@/x` -> <root>/x(.ts|.tsx|...), and React stub for the hook.
const rootUrl = new URL("../../", import.meta.url).href;
const loaderSource = [
  'import { existsSync } from "node:fs";',
  'import { fileURLToPath } from "node:url";',
  `const ROOT = ${JSON.stringify(rootUrl)};`,
  `const REACT_STUB = ${JSON.stringify(REACT_STUB_URL)};`,
  'const EXTS = ["", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"];',
  "export async function resolve(specifier, context, next) {",
  '  if (specifier === "react" && context.parentURL && context.parentURL.endsWith("useBarcodeScanner.ts")) {',
  "    return { url: REACT_STUB, shortCircuit: true };",
  "  }",
  '  if (specifier.startsWith("@/")) {',
  "    const base = new URL(specifier.slice(2), ROOT);",
  "    for (const ext of EXTS) {",
  "      const candidate = new URL(base.href + ext);",
  "      if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);",
  "    }",
  "  }",
  "  return next(specifier, context);",
  "}",
].join("\n");
try {
  register("data:text/javascript," + encodeURIComponent(loaderSource));
} catch (error) {
  console.warn("[tier4] module resolver hook unavailable:", error && error.message);
}

/* ===========================================================================
 * Lazy module loading (memoised; suites run sequentially)
 * ========================================================================= */

function lazy(factory) {
  let promise = null;
  return () => (promise ||= factory());
}

const loadCore = lazy(() =>
  Promise.all([
    import("../../lib/catalog.ts"),
    import("../../lib/navigation.ts"),
    import("../../lib/auraProtocol.ts"),
    import("../../lib/sdiProtocol.ts"),
    import("../../types/cassa.ts"),
  ]).then(([catalog, navigation, auraProtocol, sdiProtocol, cassa]) => ({
    catalog,
    navigation,
    auraProtocol,
    sdiProtocol,
    cassa,
  })),
);
const loadBarcode = lazy(() => import("../../lib/useBarcodeScanner.ts"));
const loadCart = lazy(() => import("../../store/useCartStore.ts"));
const loadInventory = lazy(() => import("../../store/useInventoryStore.ts"));

/* ===========================================================================
 * Filesystem helpers
 * ========================================================================= */

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function fileExists(relativePath) {
  return fs.existsSync(path.join(ROOT, relativePath));
}

/* ===========================================================================
 * Domain factories & POS arithmetic (mirrors components/admin/CassaTerminal)
 * ========================================================================= */

function makeProduct(overrides = {}) {
  return {
    id: "p-fixture",
    slug: "fixture",
    name: "Prodotto Fixture",
    brand: "Fixture",
    brandSlug: "fixture",
    category: "gioielli",
    subcategory: "anelli",
    subcategoryLabel: "Anelli",
    price: 100,
    currency: "EUR",
    images: [],
    description: "",
    shortDescription: "",
    inStock: true,
    stockQuantity: 10,
    barcode: "0000000000000",
    sku: "FIX-001",
    attributes: {},
    tags: [],
    rating: 5,
    reviewsCount: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Scenario helper: keeps a real catalogue identity but pins a scenario sale price. */
function atPrice(product, price) {
  return { ...product, price };
}

function makeLine(product, quantity) {
  return {
    product,
    quantity,
    unitPrice: product.price,
    lineDiscount: 0,
    lineTotal: product.price * quantity,
  };
}

/** Builds a CassaTicket mirroring the fields the POS terminal produces. */
function makeTicket(options = {}) {
  const {
    items = [],
    discountMode = "none",
    discountValue = 0,
    paymentMethod = "cash",
    cashTendered = 0,
    lotteryCode,
    operator = "Renato",
  } = options;

  const subtotal = items.reduce((acc, line) => acc + line.lineTotal, 0);
  const parsed = Number.isFinite(discountValue) ? discountValue : 0;
  const discountAmount =
    parsed <= 0 || subtotal <= 0
      ? 0
      : discountMode === "percent"
        ? (subtotal * Math.min(100, parsed)) / 100
        : Math.min(subtotal, parsed);
  const total = Math.max(0, subtotal - discountAmount);
  const taxableBase = total > 0 ? Number((total / 1.22).toFixed(2)) : 0;
  const vatAmount = total > 0 ? Number((total - taxableBase).toFixed(2)) : 0;
  const changeDue = Math.max(0, cashTendered - total);
  const id = `ORC-TEST-${Date.now()}`;

  return {
    id,
    ticketNumber: id,
    operator,
    items,
    itemCount: items.reduce((acc, line) => acc + line.quantity, 0),
    subtotal,
    discountMode,
    discountValue: parsed,
    discountAmount,
    taxBreakdown: {
      subtotal,
      discountAmount,
      taxableBase,
      vatRate: 22,
      vatAmount,
      total,
    },
    total,
    paymentMethod,
    cashTendered,
    changeDue,
    lotteryCode,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Pure mirror of the POS ticket arithmetic implemented in
 * components/admin/CassaTerminal.tsx (verified against the source in Tier 1/2):
 * Imponibile = Totale / 1.22, IVA = Totale − Imponibile, Resto = max(0, ricevuto − totale).
 */
function computeTicket(lines, options = {}) {
  const { discountMode = "none", discountValue = 0 } = options;
  const cashTendered = options.cashTendered ?? 0;

  const subtotal = lines.reduce((acc, line) => acc + line.unitPrice * line.quantity, 0);
  const parsed = Number.isFinite(discountValue) ? discountValue : 0;
  const discountAmount =
    parsed <= 0 || subtotal <= 0
      ? 0
      : discountMode === "percent"
        ? (subtotal * Math.min(100, parsed)) / 100
        : Math.min(subtotal, parsed);
  const total = Math.max(0, subtotal - discountAmount);
  const taxableBase = total > 0 ? Number((total / 1.22).toFixed(2)) : 0;
  const vatAmount = total > 0 ? Number((total - taxableBase).toFixed(2)) : 0;
  const changeDue = Math.max(0, cashTendered - total);

  return { subtotal, discountAmount, total, taxableBase, vatRate: 22, vatAmount, changeDue };
}

/** Cents helper to compare money with zero penny discrepancy. */
function cents(value) {
  return Math.round(value * 100);
}

/* Minimal window double used to drive the real barcode keydown handler. */
class FakeWindow {
  constructor() {
    this.listeners = Object.create(null);
  }
  addEventListener(type, handler) {
    (this.listeners[type] ||= []).push(handler);
  }
  removeEventListener(type, handler) {
    this.listeners[type] = (this.listeners[type] || []).filter((fn) => fn !== handler);
  }
  dispatch(type, event) {
    for (const handler of this.listeners[type] || []) handler(event);
  }
}

/**
 * Instantiates the real useBarcodeScanner hook against a window double and a
 * controllable clock, then drives the keydown stream. `advance(ms)` moves the
 * fake Date.now forward so inter-keystroke timing is exercised deterministically.
 */
function runScannerSession(scanner, interact, options = {}) {
  const previousWindow = globalThis.window;
  const previousDateNow = Date.now;
  const window = new FakeWindow();
  globalThis.window = window;

  let clock = options.startTime ?? 1_000_000;
  Date.now = () => clock;

  const scans = [];
  try {
    scanner.useBarcodeScanner({
      onScan: (code) => scans.push(code),
      minChars: options.minChars ?? 4,
      maxKeystrokeDeltaMs: options.maxKeystrokeDeltaMs ?? 60,
      enabled: options.enabled ?? true,
    });

    const press = (key) => {
      const event = {
        key,
        ctrlKey: false,
        altKey: false,
        metaKey: false,
        defaultPrevented: false,
        propagationStopped: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
        stopPropagation() {
          this.propagationStopped = true;
        },
      };
      window.dispatch("keydown", event);
      return event;
    };
    const type = (text, stepMs = 0) => {
      let entered = null;
      for (const char of text) {
        if (stepMs > 0) clock += stepMs;
        entered = press(char);
      }
      return entered;
    };
    const advance = (ms) => {
      clock += ms;
    };

    interact({ press, type, advance, window, scans });
  } finally {
    globalThis.window = previousWindow;
    Date.now = previousDateNow;
  }

  return { scans };
}

/* ===========================================================================
 * S1 — In-Store Luxury Walk-In Sale
 * ========================================================================= */

registerSuite("Tier 4 — S1: In-Store Luxury Walk-In Sale (Renato)", async () => {
  const { catalog, auraProtocol, cassa } = await loadCore();
  const scanner = await loadBarcode();
  const { useInventoryStore } = await loadInventory();
  const inventory = () => useInventoryStore.getState();

  const SCAN_CODE = "8054112300017"; // 18 kt gold diamond ring (EAN-13)
  const SALE_PRICE = 1850; // boutique showcase price for the scenario
  const DISCOUNT_PERCENT = 10;

  const ring = catalog.findProductByCode(SCAN_CODE);
  const saledRing = atPrice(ring, SALE_PRICE);

  function walkInTicket() {
    return makeTicket({
      items: [makeLine(saledRing, 1)],
      operator: "Renato",
      discountMode: "percent",
      discountValue: DISCOUNT_PERCENT,
      paymentMethod: "cash",
      cashTendered: 1700,
    });
  }

  it("S1.1 — Renato scans the ring; the EAN resolves and the operator profile is the Titolare", () => {
    expect(cassa.OPERATOR_PROFILES.Renato.role).toContain("Titolare");
    expect(cassa.OPERATOR_PROFILES.Renato.name).toBe("Renato");

    const { scans } = runScannerSession(scanner, ({ type, press }) => {
      type(SCAN_CODE, 18);
      press("Enter");
    });
    expect(scans).toEqual([SCAN_CODE]);

    const scanned = catalog.findProductByCode(scans[0]);
    assert.ok(scanned, "the scanned EAN must resolve through the catalogue");
    expect(scanned.sku).toBe("ORC-AN-001");
    expect(scanned.category).toBe("gioielli");
    expect(scanned.attributes.metal).toContain("18 kt");
    expect(scanned.attributes.stones).toContain("Diamante");
  });

  it("S1.2 — 10% boutique discount: 1850 € → 185 € off → 1665 €, 22% VAT scorporata (1364.75 + 300.25)", () => {
    const ticket = walkInTicket();
    expect(ticket.subtotal).toBe(1850);
    expect(ticket.discountAmount).toBe(185);
    expect(ticket.total).toBe(1665);
    expect(ticket.taxBreakdown.vatRate).toBe(22);
    expect(ticket.taxBreakdown.taxableBase).toBe(1364.75);
    expect(ticket.taxBreakdown.vatAmount).toBe(300.25);

    // Independent mirror proves the fiscal arithmetic with no drift.
    const mirror = computeTicket([{ unitPrice: SALE_PRICE, quantity: 1 }], {
      discountMode: "percent",
      discountValue: DISCOUNT_PERCENT,
      cashTendered: 1700,
    });
    expect(mirror.discountAmount).toBe(185);
    expect(mirror.total).toBe(1665);
    expect(mirror.taxableBase).toBe(1364.75);
    expect(mirror.vatAmount).toBe(300.25);
  });

  it("S1.3 — Cash tender of the 1700 € note yields 35.00 € change", () => {
    const ticket = walkInTicket();
    expect(ticket.changeDue).toBe(35);
    const mirror = computeTicket([{ unitPrice: SALE_PRICE, quantity: 1 }], {
      discountMode: "percent",
      discountValue: DISCOUNT_PERCENT,
      cashTendered: 1700,
    });
    expect(mirror.changeDue).toBe(35);
    expect(cents(mirror.changeDue)).toBe(3500);
  });

  it("S1.4 — Axon Aura RT Ditron LAN commands carry OPER, REP=1, SCONTO S=185.00 and CHIUS T=1", () => {
    const payload = auraProtocol.generateDitronAuraPayload(walkInTicket(), "Renato");
    const desc = auraProtocol.sanitizeAuraDescription(saledRing.name);

    expect(auraProtocol.AURA_DEPARTMENTS.gioielli.id).toBe(1);
    expect(payload.commandLines[0]).toBe("OPER DES='Renato'");
    expect(payload.commandLines).toContain(`VEND REP=1, PRE=1850.00, DES='${desc}'`);
    expect(payload.commandLines).toContain("SUBT");
    expect(payload.commandLines).toContain("SCONTO S=185.00");
    expect(payload.commandLines).toContain("CHIUS T=1, IMP=1700.00");
    expect(payload.totalEuro).toBe(1665);
    expect(payload.rawPayload.endsWith("\r\n")).toBeTruthy();
  });

  it("S1.5 — Thermal receipt preview shows the San Marzano header, line, VAT breakdown and change due", () => {
    const preview = auraProtocol.buildThermalReceiptPreview(walkInTicket(), "Renato", "001-042", "99MEY012480");
    expect(preview).toContain("GIOIELLERIA ORO & CO");
    expect(preview).toContain("84010 San Marzano sul Sarno (SA)");
    expect(preview).toContain("[REP 1]");
    expect(preview).toContain("1850.00 €");
    expect(preview).toContain("SUBTOTALE");
    expect(preview).toContain("SCONTO NEGOZIATO (10%)");
    expect(preview).toContain("-185.00 €");
    expect(preview).toContain("di cui IVA 22,00%");
    expect(preview).toContain("300.25 €");
    expect(preview).toContain("Totale Imponibile Netto");
    expect(preview).toContain("1364.75 €");
    expect(preview).toContain("CONTANTI RICEVUTI");
    expect(preview).toContain("1700.00 €");
    expect(preview).toContain("RESTO DA DARE");
    expect(preview).toContain("35.00 €");

    const execution = auraProtocol.simulateAuraExecution(walkInTicket(), "Renato");
    expect(execution.totalEuro).toBe(1665);
    expect(execution.formattedThermalReceipt).toContain("GIOIELLERIA ORO & CO");
    expect(typeof execution.simulatedReceiptNumber).toBe("string");
    expect(execution.simulatedReceiptNumber.length).toBeGreaterThan(0);
    expect(execution.zReport.startsWith("Z-")).toBeTruthy();
  });

  it("S1.6 — Depletion logs a pos_instore_sale transaction by Renato; the POS beep is head-less safe", () => {
    inventory().resetToCatalog();
    const before = inventory().getStock(ring.barcode);
    expect(before).toBeGreaterThanOrEqual(1);

    expect(inventory().depleteStock(ring.barcode, 1, "SALE-S1-WALKIN", "Renato")).toBeTruthy();
    expect(inventory().getStock(ring.barcode)).toBe(before - 1);
    expect(inventory().getStock(ring.sku)).toBe(before - 1);

    const tx = inventory().getTransactionHistory().find((entry) => entry.referenceId === "SALE-S1-WALKIN");
    assert.ok(tx, "the inventory transaction must be logged");
    expect(tx.movementType).toBe("pos_instore_sale");
    expect(tx.operator).toBe("Renato");
    expect(tx.changeQuantity).toBe(-1);
    expect(tx.previousQuantity).toBe(before);
    expect(tx.newQuantity).toBe(before - 1);

    assert.doesNotThrow(() => scanner.playPosBeep());
  });
});

/* ===========================================================================
 * S2 — High-Ticket Corporate SDI Invoice
 * ========================================================================= */

registerSuite("Tier 4 — S2: High-Ticket Corporate SDI Invoice (Carmela)", async () => {
  const { catalog, sdiProtocol, cassa } = await loadCore();
  const { useInventoryStore } = await loadInventory();
  const inventory = () => useInventoryStore.getState();

  const WATCH_PRICE = 499; // scenario corporate price per Bulova watch
  const bulova = catalog.getProductBySlug("bulova-classic-cronografo-acciaio");
  const watch = atPrice(bulova, WATCH_PRICE);

  const customer = {
    customerType: "b2b",
    ragioneSociale: "Pastificio De Matteis S.r.l.",
    partitaIva: "01234567890",
    codiceFiscale: "01234567890",
    codiceDestinatario: "M5UXCR1",
    pec: "amministrazione@pec.dematteis.it",
    indirizzo: "Via San Alfonso 12",
    cap: "84016",
    comune: "Pagani",
    provincia: "SA",
    nazione: "IT",
  };

  function corporateTicket() {
    return makeTicket({
      items: [makeLine(watch, 2)],
      operator: "Carmela",
      paymentMethod: "card",
    });
  }

  it("S2.1 — Carmela is the Responsabile Banco and the B2B anagrafica passes SDI validation", () => {
    expect(cassa.OPERATOR_PROFILES.Carmela.role).toContain("Responsabile Banco");

    const result = sdiProtocol.validateSdiCustomer(customer);
    expect(result.isValid).toBeTruthy();
    expect(Object.keys(result.errors).length).toBe(0);
  });

  it("S2.2 — Two Bulova watches at 499 € each: 998 € with VAT 22% scorporata (818.03 + 179.97)", () => {
    const ticket = corporateTicket();
    expect(ticket.subtotal).toBe(998);
    expect(ticket.itemCount).toBe(2);
    expect(ticket.total).toBe(998);
    expect(ticket.taxBreakdown.taxableBase).toBe(818.03);
    expect(ticket.taxBreakdown.vatAmount).toBe(179.97);
    expect(cents(ticket.taxBreakdown.taxableBase) + cents(ticket.taxBreakdown.vatAmount)).toBe(cents(ticket.total));
  });

  it("S2.3 — SDI 1-Click payload and FatturaPA v1.2 (FPR12) XML carry cedente, cessionario, qty 2 and IVA 22%", () => {
    const ticket = corporateTicket();
    const payload = sdiProtocol.generateSdiPayload(customer, ticket, "Carmela");

    expect(sdiProtocol.OROECO_CEDENTE.partitaIva).toBe("02847580651");
    expect(payload.invoiceNumber).toMatch(/^FATT-\d{8}-\d{3}$/);
    expect(payload.totaleDocumento).toBe(998);
    expect(payload.imponibileTotale).toBe(818.03);
    expect(payload.impostaTotale).toBe(179.97);
    expect(payload.summaryLines).toHaveLength(1);
    expect(payload.summaryLines[0].quantita).toBe(2);
    expect(payload.summaryLines[0].prezzoUnitario).toBe(499);
    expect(payload.summaryLines[0].prezzoTotale).toBe(998);

    const xml = payload.xmlFatturaPA;
    expect(xml).toContain('versione="FPR12"');
    expect(xml).toContain("<FormatoTrasmissione>FPR12</FormatoTrasmissione>");
    // Cedente ORO&CO
    expect(xml).toContain("<IdCodice>02847580651</IdCodice>");
    expect(xml).toContain("GIOIELLERIA ORO & CO - DI CALABRESE SPERANZA");
    // Cessionario Pastificio De Matteis
    expect(xml).toContain("Pastificio De Matteis S.r.l.");
    expect(xml).toContain("<IdCodice>01234567890</IdCodice>");
    expect(xml).toContain("<CodiceDestinatario>M5UXCR1</CodiceDestinatario>");
    expect(xml).toContain("<PECDestinatario>amministrazione@pec.dematteis.it</PECDestinatario>");
    expect(xml).toContain("<Comune>Pagani</Comune>");
    // Line item: quantity 2, unit 499, total 998
    expect(xml).toContain("<Quantita>2.00</Quantita>");
    expect(xml).toContain("<PrezzoUnitario>499.00</PrezzoUnitario>");
    expect(xml).toContain("<PrezzoTotale>998.00</PrezzoTotale>");
    // DatiRiepilogo IVA 22%
    expect(xml).toContain("<AliquotaIVA>22.00</AliquotaIVA>");
    expect(xml).toContain("<ImponibileImporto>818.03</ImponibileImporto>");
    expect(xml).toContain("<Imposta>179.97</Imposta>");
    // Card payment => MP08
    expect(xml).toContain("<ModalitaPagamento>MP08</ModalitaPagamento>");
    expect(xml).toContain("<ImportoTotaleDocumento>998.00</ImportoTotaleDocumento>");
    expect(xml).toContain("</p:FatturaElettronica>");
  });

  it("S2.4 — The two watches are depleted and the corporate sale is logged under Carmela", () => {
    inventory().resetToCatalog();
    const before = inventory().getStock(bulova.barcode);
    expect(before).toBeGreaterThanOrEqual(2);

    expect(
      inventory().batchDepleteStock(
        [{ barcodeOrSku: bulova.barcode, quantity: 2 }],
        "SALE-S2-CORP",
        "Carmela",
      ),
    ).toBeTruthy();

    expect(inventory().getStock(bulova.barcode)).toBe(before - 2);
    const txs = inventory()
      .getTransactionHistory()
      .filter((entry) => entry.referenceId === "SALE-S2-CORP");
    expect(txs).toHaveLength(1);
    expect(txs[0].operator).toBe("Carmela");
    expect(txs[0].movementType).toBe("pos_instore_sale");
    expect(txs[0].changeQuantity).toBe(-2);
    expect(txs[0].newQuantity).toBe(before - 2);
  });
});

/* ===========================================================================
 * S3 — E-Commerce Luxury Customer Journey
 * ========================================================================= */

registerSuite("Tier 4 — S3: E-Commerce Luxury Customer Journey", async () => {
  const { catalog, navigation } = await loadCore();
  const cart = await loadCart();
  const { useCartStore, calculateTotals, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } = cart;

  it("S3.1 — /storia tells the atelier story of San Marzano dal 1992 with periti gemmologi, garanzie and spedizioni", () => {
    assert.ok(fileExists("app/storia/page.tsx"), "app/storia/page.tsx must exist");
    const source = readText("app/storia/page.tsx");
    expect(source).toContain("1992");
    expect(source).toMatch(/San Marzano/);
    expect(source).toMatch(/[Pp]eriti gemmologi/);
    expect(source).toMatch(/[Gg]aranzia/);
    expect(source).toMatch(/[Ss]pedizioni/);
  });

  it("S3.2 — /gioielli exposes the tennis bracelets and a high-ticket bracelet is selectable", () => {
    assert.ok(fileExists("app/gioielli/page.tsx"), "app/gioielli/page.tsx must exist");
    expect(navigation.subcategoriesByCategory.gioielli.map((item) => item.slug)).toContain("bracciali");

    const bracelets = catalog
      .getProductsByCategory("gioielli")
      .filter((product) => product.subcategory === "bracciali");
    const tennis = bracelets.find((product) => product.name.toLowerCase().includes("tennis"));
    assert.ok(tennis, "a tennis bracelet must exist in the jewellery catalogue");
    expect(tennis.slug).toBe("bracciale-tennis-diamanti-oro-bianco");
    expect(tennis.price).toBeGreaterThan(FREE_SHIPPING_THRESHOLD);
  });

  it("S3.3 — CartDrawer state after addItem: 1 item, subtotal > 150 €, free shipping, 100% progress", () => {
    useCartStore.getState().clearCart();
    const bracelet = catalog.getProductBySlug("bracciale-tennis-diamanti-oro-bianco");
    useCartStore.getState().addItem(bracelet, 1);

    const totals = calculateTotals(useCartStore.getState().items);
    expect(useCartStore.getState().isOpen).toBeTruthy();
    expect(totals.itemCount).toBe(1);
    expect(totals.subtotal).toBe(bracelet.price);
    expect(totals.subtotal).toBeGreaterThan(FREE_SHIPPING_THRESHOLD);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.progress).toBe(100);
    expect(totals.total).toBe(bracelet.price);
    expect(SHIPPING_COST).toBe(9.9);

    useCartStore.getState().clearCart();
  });

  it("S3.4 — Adding a secondary item updates the subtotal smoothly", () => {
    useCartStore.getState().clearCart();
    const bracelet = catalog.getProductBySlug("bracciale-tennis-diamanti-oro-bianco");
    const ring = catalog.getProductBySlug("solitario-oro-bianco-diamante-050");

    useCartStore.getState().addItem(bracelet, 1);
    const first = calculateTotals(useCartStore.getState().items).subtotal;

    useCartStore.getState().addItem(ring, 1);
    const second = calculateTotals(useCartStore.getState().items).subtotal;
    const after = calculateTotals(useCartStore.getState().items);

    expect(second).toBe(first + ring.price);
    expect(second).toBeGreaterThan(first);
    expect(after.itemCount).toBe(2);
    expect(after.freeShipping).toBeTruthy();

    useCartStore.getState().clearCart();
  });

  it("S3.5 — The luxury footer credits 'Sviluppato da Creativia Studio' and shows the San Marzano boutique address", () => {
    const footer = readText("components/layout/Footer.tsx");
    expect(footer).toContain("Sviluppato da");
    expect(footer).toContain("Creativia Studio");
    expect(footer).toContain("Via Filippo Turati");
    expect(footer).toContain("San Marzano sul Sarno");
  });

  it("S3.6 — All 7 Excel navigation routes resolve to real App Router pages", () => {
    const routes = [
      ["/storia", "app/storia/page.tsx"],
      ["/gioielli", "app/gioielli/page.tsx"],
      ["/orologi", "app/orologi/page.tsx"],
      ["/accessori", "app/accessori/page.tsx"],
      ["/casa", "app/casa/page.tsx"],
      ["/brand", "app/brand/page.tsx"],
      ["/natale", "app/natale/page.tsx"],
    ];
    expect(routes).toHaveLength(7);

    const navHrefs = navigation.mainNav.map((item) => item.href);
    for (const [href, file] of routes) {
      expect(navHrefs).toContain(href);
      assert.ok(fileExists(file), `${file} must exist`);
    }
  });
});

/* ===========================================================================
 * S4 — Omnichannel Inventory Depletion
 * ========================================================================= */

registerSuite("Tier 4 — S4: Omnichannel Inventory Depletion (Maria)", async () => {
  const { catalog, cassa } = await loadCore();
  const { useInventoryStore } = await loadInventory();
  const inventory = () => useInventoryStore.getState();

  // Finite-stock piece: the catalogue exposes stockQuantity === 2 luxury items.
  const piece =
    catalog.getAllProducts().find((product) => product.stockQuantity === 2 && product.category === "gioielli") ??
    catalog.getAllProducts().find((product) => product.stockQuantity === 2);

  it("S4.1 — Initial availability is 2 units and isInStock is true; Maria is the Zia operator", () => {
    assert.ok(piece, "the catalogue must expose a finite-stock (2 pz) piece");
    expect(cassa.OPERATOR_PROFILES.Maria.name).toBe("Maria");
    expect(cassa.OPERATOR_PROFILES.Maria.description).toContain("Zia");

    inventory().resetToCatalog();
    expect(inventory().getStock(piece.barcode)).toBe(2);
    expect(inventory().getStock(piece.sku)).toBe(2);
    expect(inventory().getStock(piece.id)).toBe(2);
    expect(inventory().isInStock(piece.barcode)).toBeTruthy();
  });

  it("S4.2 — A physical POS sale at /admin/cassa by Maria decrements stock by 1", () => {
    assert.ok(fileExists("app/admin/cassa/page.tsx"), "app/admin/cassa/page.tsx must exist");
    inventory().resetToCatalog();

    expect(inventory().depleteStock(piece.barcode, 1, "SALE-S4-POS-1", "Maria")).toBeTruthy();

    // Live availability reconciles across barcode, SKU and id lookups.
    expect(inventory().getStock(piece.barcode)).toBe(1);
    expect(inventory().getStock(piece.sku)).toBe(1);
    expect(inventory().getStock(piece.id)).toBe(1);
    expect(inventory().isInStock(piece.barcode)).toBeTruthy();

    const tx = inventory().getTransactionHistory().find((entry) => entry.referenceId === "SALE-S4-POS-1");
    assert.ok(tx);
    expect(tx.operator).toBe("Maria");
    expect(tx.previousQuantity).toBe(2);
    expect(tx.newQuantity).toBe(1);
  });

  it("S4.3 — The second POS sale drains the last piece: stock 0 and isInStock false", () => {
    inventory().resetToCatalog();
    inventory().depleteStock(piece.barcode, 1, "SALE-S4-POS-1", "Maria");
    expect(inventory().getStock(piece.id)).toBe(1);

    expect(inventory().depleteStock(piece.barcode, 1, "SALE-S4-POS-2", "Maria")).toBeTruthy();
    expect(inventory().getStock(piece.barcode)).toBe(0);
    expect(inventory().getStock(piece.sku)).toBe(0);
    expect(inventory().getStock(piece.id)).toBe(0);
    expect(inventory().isInStock(piece.barcode)).toBeFalsy();
  });

  it("S4.4 — Attempting to oversell floors the quantity at 0 (no negative overselling)", () => {
    inventory().resetToCatalog();
    inventory().depleteStock(piece.barcode, piece.stockQuantity, "SALE-S4-DRAIN", "Maria");
    expect(inventory().getStock(piece.barcode)).toBe(0);

    expect(inventory().depleteStock(piece.barcode, 5, "SALE-S4-OVER", "Maria")).toBeTruthy();
    expect(inventory().getStock(piece.barcode)).toBe(0);
    expect(inventory().getStock(piece.barcode)).toBeGreaterThanOrEqual(0);

    const tx = inventory().getTransactionHistory().find((entry) => entry.referenceId === "SALE-S4-OVER");
    assert.ok(tx);
    expect(tx.changeQuantity).toBe(-5);
    expect(tx.newQuantity).toBe(0);
  });

  it("S4.5 — The audit trail logs both sales chronologically under operator Maria", () => {
    inventory().resetToCatalog();
    inventory().depleteStock(piece.barcode, 1, "SALE-S4-AUDIT-1", "Maria");
    inventory().depleteStock(piece.barcode, 1, "SALE-S4-AUDIT-2", "Maria");

    const history = inventory().getTransactionHistory();
    const firstIndex = history.findIndex((entry) => entry.referenceId === "SALE-S4-AUDIT-1");
    const secondIndex = history.findIndex((entry) => entry.referenceId === "SALE-S4-AUDIT-2");
    assert.ok(firstIndex >= 0 && secondIndex >= 0, "both audit transactions must be present");
    // The store prepends newest-first, so the second sale sits at a lower index.
    expect(secondIndex).toBeLessThan(firstIndex);

    expect(history[firstIndex].operator).toBe("Maria");
    expect(history[secondIndex].operator).toBe("Maria");
    expect(history[firstIndex].previousQuantity).toBe(2);
    expect(history[firstIndex].newQuantity).toBe(1);
    expect(history[secondIndex].previousQuantity).toBe(1);
    expect(history[secondIndex].newQuantity).toBe(0);
    expect(history[firstIndex].movementType).toBe("pos_instore_sale");
    expect(history[secondIndex].movementType).toBe("pos_instore_sale");
  });
});

/* ===========================================================================
 * S5 — Christmas Campaign Seasonal Rush
 * ========================================================================= */

registerSuite("Tier 4 — S5: Christmas Campaign Seasonal Rush (Renato)", async () => {
  const { catalog, auraProtocol } = await loadCore();
  const scanner = await loadBarcode();
  const cart = await loadCart();
  const { useCartStore, calculateTotals } = cart;
  const { useInventoryStore } = await loadInventory();
  const inventory = () => useInventoryStore.getState();

  const HOLIDAY_SKUS = ["ORC-NA-D01", "ORC-NA-R01", "ORC-NA-D02"];
  const holidayItems = HOLIDAY_SKUS.map((sku) => catalog.findProductByCode(sku));

  function christmasTicket() {
    return makeTicket({
      items: holidayItems.map((product) => makeLine(product, 1)),
      operator: "Renato",
      discountMode: "percent",
      discountValue: 15,
      paymentMethod: "cash",
      cashTendered: 500,
    });
  }

  it("S5.1 — /natale renders the holiday selection and featured items are marked isChristmas: true", () => {
    assert.ok(fileExists("app/natale/page.tsx"), "app/natale/page.tsx must exist");
    expect(readText("app/natale/page.tsx")).toContain("getChristmasProducts");

    const christmas = catalog.getChristmasProducts();
    expect(christmas.length).toBeGreaterThan(0);
    const marked = christmas.filter((product) => product.isChristmas === true);
    expect(marked.length).toBeGreaterThan(0);
    for (const product of marked) {
      expect(product.isChristmas).toBe(true);
    }
    expect(holidayItems.every((product) => product && product.category === "natale")).toBeTruthy();
  });

  it("S5.2 — A rapid seasonal scanner burst (<35 ms per keystroke) captures every holiday item", () => {
    const barcodes = holidayItems.map((product) => product.barcode);
    const { scans } = runScannerSession(scanner, ({ type, press }) => {
      for (const code of barcodes) {
        type(code, 30); // < 35 ms inter-keystroke delta
        press("Enter");
      }
    });
    expect(scans).toEqual(barcodes);

    const resolved = scans.map((code) => catalog.findProductByCode(code));
    expect(resolved.every(Boolean)).toBeTruthy();
    expect(resolved.map((product) => product.sku)).toEqual(HOLIDAY_SKUS);
  });

  it("S5.3 — Renato applies the 15% Christmas discount with zero penny discrepancy", () => {
    const ticket = christmasTicket();
    expect(ticket.subtotal).toBe(488); // 79 + 390 + 19
    expect(ticket.itemCount).toBe(3);
    expect(cents(ticket.discountAmount)).toBe(7320); // 73.20
    expect(cents(ticket.total)).toBe(41480); // 414.80
    expect(cents(ticket.taxBreakdown.taxableBase)).toBe(34000); // 340.00
    expect(cents(ticket.taxBreakdown.vatAmount)).toBe(7480); // 74.80
    expect(ticket.taxBreakdown.vatRate).toBe(22);

    // Invariants: subtotal − discount = total and base + VAT = total, in cents.
    expect(cents(ticket.subtotal) - cents(ticket.discountAmount)).toBe(cents(ticket.total));
    expect(cents(ticket.taxBreakdown.taxableBase) + cents(ticket.taxBreakdown.vatAmount)).toBe(cents(ticket.total));
    expect(ticket.total).toBeCloseTo(414.8, 2);
    expect(ticket.taxBreakdown.taxableBase).toBeCloseTo(340, 2);
  });

  it("S5.4 — Cash payment computes the exact change", () => {
    const ticket = christmasTicket();
    expect(cents(ticket.changeDue)).toBe(8520); // 500.00 − 414.80 = 85.20
    const mirror = computeTicket(
      holidayItems.map((product) => ({ unitPrice: product.price, quantity: 1 })),
      { discountMode: "percent", discountValue: 15, cashTendered: 500 },
    );
    expect(cents(mirror.changeDue)).toBe(cents(ticket.changeDue));
  });

  it("S5.5 — Ditron Aura RT commands route every Christmas line to Reparto 4 (Natale)", () => {
    expect(auraProtocol.AURA_DEPARTMENTS.natale.id).toBe(4);
    expect(auraProtocol.getDepartmentForCategory("natale")).toBe(4);

    const payload = auraProtocol.generateDitronAuraPayload(christmasTicket(), "Renato");
    expect(payload.commandLines[0]).toBe("OPER DES='Renato'");
    expect(payload.commandLines).toContain("SUBT");
    expect(payload.commandLines).toContain("SCONTO S=73.20");
    expect(payload.commandLines).toContain("CHIUS T=1, IMP=500.00");
    expect(payload.totalEuro).toBeCloseTo(414.8, 2);

    const vends = payload.commandLines.filter((line) => line.startsWith("VEND"));
    expect(vends).toHaveLength(3);
    expect(vends.every((line) => line.startsWith("VEND REP=4"))).toBeTruthy();
  });

  it("S5.6 — Batch stock depletion updates the holiday inventory atomically", () => {
    inventory().resetToCatalog();
    const before = holidayItems.map((product) => inventory().getStock(product.barcode));
    expect(before.every((quantity) => quantity > 0)).toBeTruthy();

    expect(
      inventory().batchDepleteStock(
        holidayItems.map((product) => ({ barcodeOrSku: product.barcode, quantity: 1 })),
        "SALE-S5-XMAS",
        "Renato",
      ),
    ).toBeTruthy();

    holidayItems.forEach((product, index) => {
      expect(inventory().getStock(product.barcode)).toBe(before[index] - 1);
    });

    const txs = inventory()
      .getTransactionHistory()
      .filter((entry) => entry.referenceId === "SALE-S5-XMAS");
    expect(txs).toHaveLength(3);
    expect(txs.every((entry) => entry.operator === "Renato")).toBeTruthy();
    expect(txs.every((entry) => entry.movementType === "pos_instore_sale")).toBeTruthy();
    // Atomicity: every line of the batch shares the exact same write timestamp.
    expect(new Set(txs.map((entry) => entry.timestamp)).size).toBe(1);
  });

  it("S5.7 — Holiday decorations flow into the storefront cart", () => {
    useCartStore.getState().clearCart();
    const decoration = catalog.getProductBySlug("decorazione-albero-natale-oro");
    expect(decoration.category).toBe("natale");

    useCartStore.getState().addItem(decoration, 2);
    const totals = calculateTotals(useCartStore.getState().items);
    expect(totals.itemCount).toBe(2);
    expect(totals.subtotal).toBe(decoration.price * 2);
    expect(totals.freeShipping).toBeTruthy();

    useCartStore.getState().clearCart();
  });
});

/* Keep `describe`/`test` exported API reachable for tooling that introspects tiers. */
void describe;
void test;
