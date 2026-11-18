/**
 * tests/e2e/tier3_pairwise.test.mjs
 * ---------------------------------------------------------------------------
 * GIOIELLERIA OROECO — Tier 3: Pairwise Cross-Feature Interaction Tests
 *
 * Opaque-box, requirement-driven verification of how the nine feature areas
 * interact with one another (TEST_INFRA.md §Tier 3, ≥10 cross-feature tests):
 *
 *   Pair  1  Cart + Catalog Navigation (free shipping progress / remaining)
 *   Pair  2  Barcode scan + ticket tax (Imponibile = Totale / 1.22) + stock
 *   Pair  3  POS sale + Axon Aura RT LAN payload + inventory transaction log
 *   Pair  4  SDI 1-Click B2B invoice + ticket summary + FatturaPA totals
 *   Pair  5  Cart drawer threshold + mixed decimal luxury lines (no FP drift)
 *   Pair  6  Operator switching + Ditron OPER + audit accountability
 *   Pair  7  Hardware scanner burst <60ms during search typing
 *   Pair  8  Quick-discount chip + Ditron SCONTO ECR command
 *   Pair  9  Christmas storefront ↔ POS consistency (barcodes & prices)
 *   Pair 10  Mixed-department sale + Ditron REPs + cash resto (change)
 *   Pair 11  Storefront cart & POS inventory cross-check (unique piece → 0)
 *
 * Total: 11 cross-feature test cases.
 *
 * Execution modes
 *   - node tests/e2e/tier3_pairwise.test.mjs   (harness auto-runs, sets exit code)
 *   - node tests/e2e/runner.mjs                (runner drives runSuites itself)
 *
 * The application code lives in TypeScript. Node >= 22.18 strips types from
 * `.ts` files natively, so the modules are imported directly. Two small
 * accommodations are registered up-front for the test process only:
 *   1. a resolver hook mapping the `@/...` tsconfig path alias to the project
 *      root (needed by store/useInventoryStore.ts and auraProtocol at runtime),
 *   2. a React stub for lib/useBarcodeScanner.ts so the real keydown handler
 *      can be exercised outside a browser without a DOM renderer.
 * Neither accommodation changes the production code.
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
  console.warn("[tier3] module resolver hook unavailable:", error && error.message);
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
    import("../../lib/auraProtocol.ts"),
    import("../../lib/sdiProtocol.ts"),
    import("../../types/cassa.ts"),
  ]).then(([catalog, auraProtocol, sdiProtocol, cassa]) => ({
    catalog,
    auraProtocol,
    sdiProtocol,
    cassa,
  })),
);
const loadBarcode = lazy(() => import("../../lib/useBarcodeScanner.ts"));
const loadCart = lazy(() => import("../../store/useCartStore.ts"));
const loadInventory = lazy(() => import("../../store/useInventoryStore.ts"));

/* ===========================================================================
 * Domain factories (typed, self-contained fixtures)
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

/** Corporate B2B fiscal fixture: 11-digit P.IVA + 7-character SDI recipient code. */
function baseB2BCustomer(overrides = {}) {
  return {
    customerType: "b2b",
    ragioneSociale: "Boutique Lusso S.r.l.",
    partitaIva: "01234567890",
    codiceFiscale: "01234567890",
    codiceDestinatario: "M5UXCR1",
    pec: "",
    indirizzo: "Corso Italia, 45",
    cap: "80100",
    comune: "Napoli",
    provincia: "NA",
    nazione: "IT",
    ...overrides,
  };
}

/* ===========================================================================
 * Tier 3 suites
 * ========================================================================= */

registerSuite("Tier 3 — Pairwise Cross-Feature Interactions", async () => {
  const { catalog, auraProtocol, sdiProtocol, cassa } = await loadCore();
  const scanner = await loadBarcode();
  const cart = await loadCart();
  const { useInventoryStore } = await loadInventory();
  const { useCartStore, calculateTotals, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } = cart;
  const inventory = () => useInventoryStore.getState();

  /* ----------------------------------------------------------------------- *
   * Pair 1 — Cart + Catalog Navigation
   * ----------------------------------------------------------------------- */
  it("Pair 1 — Catalogue browsing feeds the cart, shipping progress and remaining amount", () => {
    useCartStore.getState().clearCart();

    const casa = catalog.getProductsByCategory("casa");
    const natale = catalog.getProductsByCategory("natale");
    const calici = casa.find((product) => product.price === 149);
    assert.ok(calici, "the 149€ crystal set must exist in the casa category");

    useCartStore.getState().addItem(calici, 1);
    let totals = calculateTotals(useCartStore.getState().items);
    expect(totals.itemCount).toBe(1);
    expect(totals.subtotal).toBe(149);
    expect(totals.shipping).toBe(SHIPPING_COST);
    expect(totals.freeShipping).toBeFalsy();
    expect(totals.remainingForFreeShipping).toBe(1);
    expect(totals.progress).toBeCloseTo((149 / FREE_SHIPPING_THRESHOLD) * 100, 2);

    const pallina = natale.find((product) => product.price === 19);
    assert.ok(pallina, "the 19€ Christmas bauble must exist");
    useCartStore.getState().addItem(pallina, 1);

    totals = calculateTotals(useCartStore.getState().items);
    expect(totals.itemCount).toBe(2);
    expect(totals.subtotal).toBe(168);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(168);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.progress).toBe(100);

    useCartStore.getState().clearCart();
  });

  /* ----------------------------------------------------------------------- *
   * Pair 2 — Barcode Scan + Stock Depletion + Ticket Tax Calculation
   * ----------------------------------------------------------------------- */
  it("Pair 2 — Scanned EAN becomes a taxed ticket line and depletes real stock", () => {
    const { scans } = runScannerSession(scanner, ({ type, press }) => {
      type("8054112300017", 20);
      press("Enter");
    });
    expect(scans).toEqual(["8054112300017"]);

    const product = catalog.findProductByCode(scans[0]);
    assert.ok(product, "the scanned EAN must resolve through the catalogue");
    expect(product.sku).toBe("ORC-AN-001");
    expect(product.price).toBe(2480);

    const ticket = makeTicket({ items: [makeLine(product, 1)], cashTendered: 2500 });
    const result = computeTicket([{ unitPrice: product.price, quantity: 1 }], { cashTendered: 2500 });

    expect(result.subtotal).toBe(2480);
    expect(result.taxableBase).toBe(2032.79);
    expect(result.vatRate).toBe(22);
    expect(result.vatAmount).toBe(447.21);
    expect(ticket.taxBreakdown.taxableBase).toBe(result.taxableBase);
    expect(ticket.taxBreakdown.vatAmount).toBe(result.vatAmount);
    expect(ticket.changeDue).toBe(result.changeDue);

    inventory().resetToCatalog();
    const before = inventory().getStock(product.barcode);
    expect(inventory().depleteStock(product.barcode, 1, "SALE-PAIR2", "Renato")).toBeTruthy();
    expect(inventory().getStock(product.barcode)).toBe(before - 1);
  });

  /* ----------------------------------------------------------------------- *
   * Pair 3 — POS Sale + Axon Aura RT LAN payload + Inventory Transaction Log
   * ----------------------------------------------------------------------- */
  it("Pair 3 — Multi-item POS sale emits Ditron LAN ECR commands and logs stock movements", () => {
    const orologio = catalog.getProductBySlug("bulova-classic-cronografo-acciaio");
    const accessorio = catalog.getProductBySlug("portafoglio-pelle-martellata-uomo");
    assert.ok(orologio && accessorio);

    const ticket = makeTicket({
      items: [makeLine(orologio, 1), makeLine(accessorio, 2)],
      operator: "Carmela",
      paymentMethod: "cash",
      cashTendered: 700,
    });

    const payload = auraProtocol.generateDitronAuraPayload(ticket, "Carmela");
    expect(payload.commandLines[0]).toBe("OPER DES='Carmela'");
    expect(payload.commandLines.some((line) => line.startsWith("VEND REP=1") && line.includes("Bulova"))).toBeTruthy();
    expect(
      payload.commandLines.some((line) => line.startsWith("VEND REP=2") && line.includes("Portafoglio")),
    ).toBeTruthy();
    expect(payload.commandLines).toContain("SUBT");
    expect(payload.commandLines.some((line) => line.startsWith("CHIUS T=1"))).toBeTruthy();
    expect(payload.rawPayload.endsWith("\r\n")).toBeTruthy();
    expect(payload.totalEuro).toBe(ticket.total);

    inventory().resetToCatalog();
    const beforeA = inventory().getStock(orologio.barcode);
    const beforeB = inventory().getStock(accessorio.barcode);

    expect(
      inventory().batchDepleteStock(
        [
          { barcodeOrSku: orologio.barcode, quantity: 1 },
          { barcodeOrSku: accessorio.barcode, quantity: 2 },
        ],
        "SALE-POS-PAIR3",
        "Carmela",
      ),
    ).toBeTruthy();

    expect(inventory().getStock(orologio.barcode)).toBe(beforeA - 1);
    expect(inventory().getStock(accessorio.barcode)).toBe(beforeB - 2);

    const transactions = inventory()
      .getTransactionHistory()
      .filter((tx) => tx.referenceId === "SALE-POS-PAIR3");
    expect(transactions).toHaveLength(2);
    expect(transactions.every((tx) => tx.movementType === "pos_instore_sale")).toBeTruthy();
    expect(transactions.every((tx) => tx.operator === "Carmela")).toBeTruthy();
    expect(transactions.every((tx) => tx.changeQuantity < 0)).toBeTruthy();
  });

  /* ----------------------------------------------------------------------- *
   * Pair 4 — SDI 1-Click Modal + Customer Data + Ticket Summary
   * ----------------------------------------------------------------------- */
  it("Pair 4 — B2B e-invoice XML lines and DatiRiepilogo match the ticket's 22% VAT", () => {
    const bulova = catalog.getProductBySlug("bulova-classic-cronografo-acciaio");
    const ticket = makeTicket({
      items: [makeLine(bulova, 2)],
      paymentMethod: "card",
      operator: "Carmela",
    });

    const customer = baseB2BCustomer();
    expect(sdiProtocol.validateSdiCustomer(customer).isValid).toBeTruthy();

    const payload = sdiProtocol.generateSdiPayload(customer, ticket, "Carmela");
    expect(payload.invoiceNumber).toMatch(/^FATT-\d{8}-\d{3}$/);
    expect(payload.totaleDocumento).toBe(ticket.total);
    expect(payload.imponibileTotale).toBe(ticket.taxBreakdown.taxableBase);
    expect(payload.impostaTotale).toBe(ticket.taxBreakdown.vatAmount);
    expect(payload.summaryLines).toHaveLength(ticket.items.length);

    const xml = payload.xmlFatturaPA;
    expect(xml).toContain('versione="FPR12"');
    expect(xml).toContain("<DettaglioLinee>");
    expect(xml).toContain("<PrezzoUnitario>449.00</PrezzoUnitario>");
    expect(xml).toContain("<PrezzoTotale>898.00</PrezzoTotale>");
    expect(xml).toContain("<AliquotaIVA>22.00</AliquotaIVA>");
    expect(xml).toContain(
      `<ImponibileImporto>${ticket.taxBreakdown.taxableBase.toFixed(2)}</ImponibileImporto>`,
    );
    expect(xml).toContain(`<Imposta>${ticket.taxBreakdown.vatAmount.toFixed(2)}</Imposta>`);
    expect(xml).toContain("<IdCodice>02847580651</IdCodice>");
    expect(xml).toContain("<IdCodice>01234567890</IdCodice>");
    expect(xml).toContain("<CodiceDestinatario>M5UXCR1</CodiceDestinatario>");

    // Direct generator coverage: the XML is deterministic for a fixed number/date.
    const directXml = sdiProtocol.buildFatturaPaXml(
      "FATT-TEST-001",
      new Date().toISOString(),
      customer,
      ticket,
    );
    expect(directXml).toContain("<Numero>FATT-TEST-001</Numero>");
    expect(directXml).toContain(
      `<ImportoTotaleDocumento>${ticket.total.toFixed(2)}</ImportoTotaleDocumento>`,
    );
  });

  /* ----------------------------------------------------------------------- *
   * Pair 5 — Cart Drawer Threshold + Mixed Decimal Luxury Items
   * ----------------------------------------------------------------------- */
  it("Pair 5 — Mixed decimal lines cross 150€ with no floating-point drift", () => {
    useCartStore.getState().clearCart();

    const itemA = makeProduct({ id: "dec-a", sku: "DEC-A", barcode: "DEC-A", price: 49.99 });
    const itemB = makeProduct({ id: "dec-b", sku: "DEC-B", barcode: "DEC-B", price: 50.01 });
    const itemC = makeProduct({ id: "dec-c", sku: "DEC-C", barcode: "DEC-C", price: 50.0 });

    useCartStore.getState().addItem(itemA, 1);
    useCartStore.getState().addItem(itemB, 1);
    useCartStore.getState().addItem(itemC, 1);

    const totals = calculateTotals(useCartStore.getState().items);
    expect(totals.itemCount).toBe(3);
    expect(totals.subtotal).toBeCloseTo(150, 2);
    expect(Math.round(totals.subtotal * 100)).toBe(15000);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBeCloseTo(150, 2);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.progress).toBe(100);

    useCartStore.getState().clearCart();
  });

  /* ----------------------------------------------------------------------- *
   * Pair 6 — Operator Switching + Audit Accountability
   * ----------------------------------------------------------------------- */
  it("Pair 6 — Renato/Carmela/Maria switching lands in Ditron OPER and audit transactions", () => {
    const operators = Object.keys(cassa.OPERATOR_PROFILES);
    expect(operators).toContain("Renato");
    expect(operators).toContain("Carmela");
    expect(operators).toContain("Maria");

    const product = catalog.getProductBySlug("calice-cristallo-set-6-bicchieri");
    assert.ok(product);
    const ticket = makeTicket({ items: [makeLine(product, 1)], operator: "Renato" });

    for (const name of operators) {
      const profile = cassa.OPERATOR_PROFILES[name];
      expect(profile.name).toBe(name);

      const payload = auraProtocol.generateDitronAuraPayload(ticket, name);
      expect(payload.commandLines[0]).toBe(`OPER DES='${name}'`);

      inventory().resetToCatalog();
      expect(inventory().depleteStock(product.barcode, 1, `SALE-OP-${name}`, name)).toBeTruthy();

      const tx = inventory()
        .getTransactionHistory()
        .find((entry) => entry.referenceId === `SALE-OP-${name}`);
      assert.ok(tx, `audit transaction for ${name} must be recorded`);
      expect(tx.operator).toBe(name);
      expect(tx.movementType).toBe("pos_instore_sale");
    }
  });

  /* ----------------------------------------------------------------------- *
   * Pair 7 — Hardware Scanner Burst during Search Simulation
   * ----------------------------------------------------------------------- */
  it("Pair 7 — Scanner bursts <60ms resolve the target product during manual search typing", () => {
    const resolved = [];
    const { scans } = runScannerSession(scanner, ({ type, press, advance }) => {
      // Operator types a manual search slowly; a >400ms pause flushes it.
      type("anello", 120);
      advance(650);
      // Hardware gun fires two rapid bursts (< 60ms per keystroke).
      type("8054112300017", 15);
      press("Enter");
      type("8054112300024", 15);
      press("Enter");
    });

    expect(scans).toEqual(["8054112300017", "8054112300024"]);
    for (const code of scans) {
      const product = catalog.findProductByCode(code);
      assert.ok(product, `scanned code ${code} must resolve to a product`);
      resolved.push(product.sku);
    }
    expect(resolved).toEqual(["ORC-AN-001", "ORC-AN-002"]);
  });

  /* ----------------------------------------------------------------------- *
   * Pair 8 — Quick Discount Chip + Ditron ECR Protocol
   * ----------------------------------------------------------------------- */
  it("Pair 8 — Quick-discount chips recalculate the ticket and emit SCONTO to the ECR", () => {
    const percentChip = cassa.QUICK_DISCOUNTS.find((discount) => discount.mode === "percent" && discount.value === 10);
    const amountChip = cassa.QUICK_DISCOUNTS.find((discount) => discount.mode === "amount" && discount.value === 50);
    assert.ok(percentChip, "a 10% quick discount chip must exist");
    assert.ok(amountChip, "a 50€ quick discount chip must exist");

    const line = makeLine(makeProduct({ id: "disc", sku: "DISC", barcode: "DISC", price: 500 }), 1);

    const percentTicket = makeTicket({
      items: [line],
      discountMode: percentChip.mode,
      discountValue: percentChip.value,
    });
    expect(percentTicket.subtotal).toBe(500);
    expect(percentTicket.discountAmount).toBe(50);
    expect(percentTicket.total).toBe(450);
    const percentPayload = auraProtocol.generateDitronAuraPayload(percentTicket, "Renato");
    expect(percentPayload.commandLines).toContain(`SCONTO S=${percentTicket.discountAmount.toFixed(2)}`);
    expect(percentPayload.totalEuro).toBe(450);

    const amountTicket = makeTicket({
      items: [line],
      discountMode: amountChip.mode,
      discountValue: amountChip.value,
    });
    expect(amountTicket.subtotal).toBe(500);
    expect(amountTicket.discountAmount).toBe(50);
    expect(amountTicket.total).toBe(450);
    const amountPayload = auraProtocol.generateDitronAuraPayload(amountTicket, "Renato");
    expect(amountPayload.commandLines).toContain(`SCONTO S=${amountTicket.discountAmount.toFixed(2)}`);

    const noDiscount = auraProtocol.generateDitronAuraPayload(makeTicket({ items: [line] }), "Renato");
    expect(noDiscount.commandLines.some((entry) => entry.startsWith("SCONTO"))).toBeFalsy();
  });

  /* ----------------------------------------------------------------------- *
   * Pair 9 — Christmas Seasonal Campaign Storefront & POS Consistency
   * ----------------------------------------------------------------------- */
  it("Pair 9 — Every Christmas catalogue item resolves in POS with a matching price", () => {
    const christmas = catalog.getChristmasProducts();
    expect(christmas.length).toBeGreaterThan(0);
    expect(christmas.some((product) => product.isChristmas === true)).toBeTruthy();

    for (const product of christmas) {
      const resolved = catalog.findProductByCode(product.barcode);
      assert.ok(resolved, `Christmas item ${product.sku} must be resolvable by barcode`);
      expect(resolved.id).toBe(product.id);
      expect(resolved.sku).toBe(product.sku);
      expect(resolved.price).toBe(product.price);
      expect(resolved.category).toBe(product.category);
    }

    const marked = catalog.getAllProducts().filter((product) => product.isChristmas === true);
    expect(marked.length).toBeGreaterThan(0);
    for (const product of marked) {
      const resolved = catalog.findProductByCode(product.barcode);
      assert.ok(resolved, `isChristmas item ${product.sku} must be resolvable by barcode`);
      expect(resolved.id).toBe(product.id);
      expect(resolved.price).toBe(product.price);
    }
  });

  /* ----------------------------------------------------------------------- *
   * Pair 10 — Multi-Item Mixed Department POS Sale + Cash Tender with Resto
   * ----------------------------------------------------------------------- */
  it("Pair 10 — Mixed-department sale maps Ditron REPs and computes the cash resto", () => {
    const gioiello = catalog.getProductBySlug("ciondolo-madonna-argento-925");
    const accessorio = catalog.getProductBySlug("portafoglio-pelle-martellata-uomo");
    const casa = catalog.getProductBySlug("diffusore-profumo-ambiente-oud");
    assert.ok(gioiello && accessorio && casa);

    expect(auraProtocol.getDepartmentForCategory(gioiello.category)).toBe(auraProtocol.AURA_DEPARTMENTS.gioielli.id);
    expect(auraProtocol.getDepartmentForCategory(accessorio.category)).toBe(auraProtocol.AURA_DEPARTMENTS.accessori.id);
    expect(auraProtocol.getDepartmentForCategory(casa.category)).toBe(auraProtocol.AURA_DEPARTMENTS.casa.id);
    expect(auraProtocol.AURA_DEPARTMENTS.gioielli.id).toBe(1);
    expect(auraProtocol.AURA_DEPARTMENTS.accessori.id).toBe(2);
    expect(auraProtocol.AURA_DEPARTMENTS.casa.id).toBe(3);

    const ticket = makeTicket({
      items: [makeLine(gioiello, 1), makeLine(accessorio, 1), makeLine(casa, 1)],
      paymentMethod: "cash",
      cashTendered: 500,
    });
    expect(ticket.total).toBe(277);
    expect(ticket.changeDue).toBe(223);

    const payload = auraProtocol.generateDitronAuraPayload(ticket, "Renato");
    expect(payload.commandLines.some((line) => line.startsWith("VEND REP=1"))).toBeTruthy();
    expect(payload.commandLines.some((line) => line.startsWith("VEND REP=2"))).toBeTruthy();
    expect(payload.commandLines.some((line) => line.startsWith("VEND REP=3"))).toBeTruthy();
    expect(payload.commandLines).toContain("CHIUS T=1, IMP=500.00");
    expect(payload.totalEuro).toBe(277);

    const preview = auraProtocol.buildThermalReceiptPreview(ticket, "Renato", "001-001", "99MEY012480");
    expect(preview).toContain("RESTO DA DARE");
    expect(preview).toContain("223.00");
  });

  /* ----------------------------------------------------------------------- *
   * Pair 11 — Storefront Cart & POS Inventory Cross-Check
   * ----------------------------------------------------------------------- */
  it("Pair 11 — Draining the last unique luxury piece zeroes stock and isInStock", () => {
    const unique = catalog.getAllProducts().find((product) => product.stockQuantity === 1);
    assert.ok(unique, "the catalogue must contain a unique piece (stockQuantity === 1)");
    expect(unique.sku).toBe("ORC-OR-U03");

    inventory().resetToCatalog();
    expect(inventory().getStock(unique.barcode)).toBe(1);
    expect(inventory().isInStock(unique.barcode)).toBeTruthy();

    expect(inventory().depleteStock(unique.barcode, 1, "SALE-UNIQUE", "Maria")).toBeTruthy();

    expect(inventory().getStock(unique.barcode)).toBe(0);
    expect(inventory().getStock(unique.sku)).toBe(0);
    expect(inventory().getStock(unique.id)).toBe(0);
    expect(inventory().isInStock(unique.barcode)).toBeFalsy();

    const tx = inventory().getTransactionHistory()[0];
    expect(tx.movementType).toBe("pos_instore_sale");
    expect(tx.operator).toBe("Maria");
    expect(tx.changeQuantity).toBe(-1);
    expect(tx.newQuantity).toBe(0);
  });
});

/* Keep `describe`/`test` exported API reachable for tooling that introspects tiers. */
void describe;
void test;
void fs;
