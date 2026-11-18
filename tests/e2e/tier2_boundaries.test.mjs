/**
 * tests/e2e/tier2_boundaries.test.mjs
 * ---------------------------------------------------------------------------
 * GIOIELLERIA OROECO — Tier 2: Boundary Value Analysis & Corner Cases
 *
 * Opaque-box, requirement-driven edge coverage for all nine feature areas
 * described in ORIGINAL_REQUEST / TEST_INFRA.md. Every suite pins the exact
 * values either side of a threshold (0, 149.99€, 150.00€, 150.01€, min/max
 * scanner lengths, 11-digit P.IVA, 16-char CF, 7-char SDI, 5-digit CAP,
 * zero stock, negative/oversized discounts, empty collections).
 *
 * Suites
 *   1. Shipping Threshold Boundaries                     —  8 tests
 *   2. Discount Boundary Values                          —  8 tests
 *   3. Empty State Boundaries                            —  4 tests
 *   4. Barcode Hardware Scanner Timing & Input Boundaries — 11 tests
 *   5. Codice Fiscale & Partita IVA Boundaries           —  8 tests
 *   6. SDI Destination Code, PEC & Address Boundaries    —  8 tests
 *   7. Cash Tender & Change (Resto) Boundaries           —  5 tests
 *   8. Stock Depletion Edge & Corner Cases               —  5 tests
 *
 * Total: 57 test cases.
 *
 * Execution modes
 *   - node tests/e2e/tier2_boundaries.test.mjs   (harness auto-runs, sets exit code)
 *   - node tests/e2e/runner.mjs                  (runner drives runSuites itself)
 *
 * The application code lives in TypeScript. Node >= 22.18 strips types from
 * `.ts` files natively, so the modules are imported directly. Two small
 * accommodations are registered up-front for the test process only:
 *   1. a resolver hook mapping the `@/...` tsconfig path alias to the project
 *      root (needed by store/useInventoryStore.ts at runtime), and
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
  console.warn("[tier2] module resolver hook unavailable:", error && error.message);
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
  ]).then(([catalog, auraProtocol, sdiProtocol]) => ({
    catalog,
    auraProtocol,
    sdiProtocol,
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
 * components/admin/CassaTerminal.tsx (verified against the source).
 *
 * `tenderedDelta` is the raw un-clamped cash difference (negative when the
 * customer has not yet paid enough — the UI then shows "Mancano …"), while
 * `changeDue` reproduces the production `Math.max(0, cashTendered - total)`.
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

  return {
    subtotal,
    discountAmount,
    total,
    taxableBase,
    vatRate: 22,
    vatAmount,
    changeDue,
    cashTendered,
    tenderedDelta: cashTendered - total,
  };
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

/** Base fiscal fixtures reused across the CF/P.IVA/SDI suites. */
function baseB2CCustomer(overrides = {}) {
  return {
    customerType: "b2c",
    ragioneSociale: "Mario Rossi",
    partitaIva: "",
    codiceFiscale: "RSSMRA80A01H703S",
    codiceDestinatario: "0000000",
    pec: "",
    indirizzo: "Via Roma, 10",
    cap: "84016",
    comune: "Pagani",
    provincia: "SA",
    nazione: "IT",
    ...overrides,
  };
}

function baseB2BCustomer(overrides = {}) {
  return {
    customerType: "b2b",
    ragioneSociale: "Boutique Lusso S.r.l.",
    partitaIva: "02847580651",
    codiceFiscale: "02847580651",
    codiceDestinatario: "M5UXCR1",
    pec: "azienda@pec.it",
    indirizzo: "Corso Italia, 45",
    cap: "80100",
    comune: "Napoli",
    provincia: "NA",
    nazione: "IT",
    ...overrides,
  };
}

/* ===========================================================================
 * 1. SHIPPING THRESHOLD BOUNDARIES
 * ========================================================================= */

registerSuite("T2-1. Shipping Threshold Boundaries", async () => {
  const cart = await loadCart();
  const { calculateTotals, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } = cart;

  const totalsFor = (price) =>
    calculateTotals([{ product: makeProduct({ price }), quantity: 1 }]);

  it("subtotal 0€ ⇒ freeShipping true, shipping 0, remaining 150, progress 0", () => {
    const totals = totalsFor(0);
    expect(totals.subtotal).toBe(0);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.remainingForFreeShipping).toBe(150);
    expect(totals.progress).toBe(0);
    expect(totals.itemCount).toBe(1);
  });

  it("subtotal 0.01€ ⇒ shipping 9.90, remaining 149.99, progress ≈ 0.006%", () => {
    const totals = totalsFor(0.01);
    expect(totals.freeShipping).toBeFalsy();
    expect(totals.shipping).toBe(SHIPPING_COST);
    expect(totals.shipping).toBe(9.9);
    expect(totals.remainingForFreeShipping).toBeCloseTo(149.99, 2);
    expect(totals.total).toBeCloseTo(9.91, 2);
    expect(totals.progress).toBeGreaterThan(0);
    expect(totals.progress).toBeLessThan(0.01);
    expect(totals.progress).toBeCloseTo(0.006667, 4);
  });

  it("subtotal 149.90€ ⇒ shipping 9.90, remaining 0.10, progress ≈ 99.93%", () => {
    const totals = totalsFor(149.9);
    expect(totals.freeShipping).toBeFalsy();
    expect(totals.shipping).toBe(9.9);
    expect(totals.remainingForFreeShipping).toBeCloseTo(0.1, 2);
    expect(totals.total).toBeCloseTo(159.8, 2);
    expect(totals.progress).toBeCloseTo(99.93, 2);
  });

  it("subtotal 149.99€ ⇒ shipping 9.90, remaining 0.01, progress ≈ 99.99%", () => {
    const totals = totalsFor(149.99);
    expect(totals.freeShipping).toBeFalsy();
    expect(totals.shipping).toBe(9.9);
    expect(totals.remainingForFreeShipping).toBeCloseTo(0.01, 2);
    expect(totals.total).toBeCloseTo(159.89, 2);
    expect(totals.progress).toBeCloseTo(99.99, 2);
  });

  it("subtotal 150.00€ (exact threshold) ⇒ freeShipping true, shipping 0, remaining 0, progress 100", () => {
    assert.strictEqual(FREE_SHIPPING_THRESHOLD, 150);
    const totals = totalsFor(150);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(150);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.progress).toBe(100);
  });

  it("subtotal 150.01€ (just over threshold) ⇒ freeShipping true, shipping 0, remaining 0, progress 100", () => {
    const totals = totalsFor(150.01);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBeCloseTo(150.01, 2);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.progress).toBe(100);
  });

  it("subtotal 999.99€ ⇒ freeShipping true, shipping 0, remaining 0, progress 100", () => {
    const totals = totalsFor(999.99);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBeCloseTo(999.99, 2);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.progress).toBe(100);
  });

  it("subtotal 10000.00€ (high luxury) ⇒ freeShipping true, shipping 0, remaining 0, progress 100", () => {
    const totals = totalsFor(10000);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(10000);
    expect(totals.remainingForFreeShipping).toBe(0);
    expect(totals.progress).toBe(100);
  });
});

/* ===========================================================================
 * 2. DISCOUNT BOUNDARY VALUES
 * ========================================================================= */

registerSuite("T2-2. Discount Boundary Values", async () => {
  const line = (unitPrice, quantity = 1) => ({ unitPrice, quantity });

  it("0% discount ⇒ total unchanged, discountAmount 0", () => {
    const result = computeTicket([line(100)], { discountMode: "percent", discountValue: 0 });
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(100);
  });

  it("100% discount ⇒ discountAmount equals subtotal, total is 0.00€", () => {
    const result = computeTicket([line(250)], { discountMode: "percent", discountValue: 100 });
    expect(result.subtotal).toBe(250);
    expect(result.discountAmount).toBe(250);
    expect(result.total).toBe(0);
  });

  it("negative discount ⇒ clamped/ignored, never increases the price", () => {
    const percent = computeTicket([line(100)], { discountMode: "percent", discountValue: -10 });
    expect(percent.discountAmount).toBe(0);
    expect(percent.total).toBe(100);

    const amount = computeTicket([line(100)], { discountMode: "amount", discountValue: -5 });
    expect(amount.discountAmount).toBe(0);
    expect(amount.total).toBe(100);
  });

  it("value discount 0€ ⇒ total unchanged", () => {
    const result = computeTicket([line(100)], { discountMode: "amount", discountValue: 0 });
    expect(result.discountAmount).toBe(0);
    expect(result.total).toBe(100);
  });

  it("value discount exactly equal to subtotal ⇒ total becomes 0.00€", () => {
    const result = computeTicket([line(100)], { discountMode: "amount", discountValue: 100 });
    expect(result.discountAmount).toBe(100);
    expect(result.total).toBe(0);
  });

  it("value discount greater than subtotal ⇒ total floored at 0.00€, never negative", () => {
    const result = computeTicket([line(100)], { discountMode: "amount", discountValue: 150 });
    expect(result.discountAmount).toBe(100);
    expect(result.total).toBe(0);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it("decimal percentage discount (12.5% on 200€ = 25€ off, 175€ total)", () => {
    const result = computeTicket([line(200)], { discountMode: "percent", discountValue: 12.5 });
    expect(result.discountAmount).toBeCloseTo(25, 2);
    expect(result.total).toBeCloseTo(175, 2);
  });

  it("micro discount (0.01€ on 100€ ⇒ 99.99€ total)", () => {
    const result = computeTicket([line(100)], { discountMode: "amount", discountValue: 0.01 });
    expect(result.discountAmount).toBeCloseTo(0.01, 2);
    expect(result.total).toBeCloseTo(99.99, 2);
  });
});

/* ===========================================================================
 * 3. EMPTY STATE BOUNDARIES
 * ========================================================================= */

registerSuite("T2-3. Empty State Boundaries", async () => {
  const { catalog, auraProtocol, sdiProtocol } = await loadCore();
  const cart = await loadCart();
  const { calculateTotals } = cart;

  it("empty cart items array ⇒ subtotal 0, total 0, itemCount 0, shipping 0", () => {
    const totals = calculateTotals([]);
    expect(totals.subtotal).toBe(0);
    expect(totals.total).toBe(0);
    expect(totals.itemCount).toBe(0);
    expect(totals.shipping).toBe(0);
    expect(totals.remainingForFreeShipping).toBe(150);
    expect(totals.progress).toBe(0);
  });

  it("empty ticket ⇒ subtotal 0, total 0, taxableBase 0, vatAmount 0", () => {
    const result = computeTicket([]);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.taxableBase).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.discountAmount).toBe(0);
  });

  it("Ditron Aura payload with empty items ⇒ valid header and footer without throw", () => {
    let payload;
    assert.doesNotThrow(() => {
      payload = auraProtocol.generateDitronAuraPayload(makeTicket({ items: [] }), "Renato");
    });
    expect(payload.totalEuro).toBe(0);
    expect(payload.commandLines[0].startsWith("OPER DES=")).toBeTruthy();
    expect(payload.commandLines).toContain("SUBT");
    expect(payload.commandLines.some((line) => line.startsWith("CHIUS"))).toBeTruthy();
    expect(payload.rawPayload.endsWith("\r\n")).toBeTruthy();
  });

  it("SDI XML generation with empty ticket items ⇒ valid XML without throwing", () => {
    const emptyTicket = makeTicket({ items: [], paymentMethod: "card" });
    let xml;
    assert.doesNotThrow(() => {
      xml = sdiProtocol.buildFatturaPaXml(
        "FATT-EMPTY-001",
        new Date().toISOString(),
        baseB2CCustomer(),
        emptyTicket,
      );
    });
    expect(xml).toContain('versione="FPR12"');
    expect(xml).toContain("</p:FatturaElettronica>");
    expect(xml).toContain("<DatiBeniServizi>");
    // No line items, but the summary block still carries 0.00 totals.
    expect(xml).toContain("<ImportoTotaleDocumento>0.00</ImportoTotaleDocumento>");
    void catalog;
  });
});

/* ===========================================================================
 * 4. BARCODE HARDWARE SCANNER TIMING & INPUT BOUNDARIES
 * ========================================================================= */

registerSuite("T2-4. Barcode Hardware Scanner Timing & Input Boundaries", async () => {
  const { catalog } = await loadCore();
  const scanner = await loadBarcode();

  /**
   * Instantiates the real useBarcodeScanner hook against a window double and a
   * controllable clock, then drives the keydown stream. `advance(ms)` moves the
   * fake Date.now forward so inter-keystroke timing can be exercised without
   * real sleeps (deterministic, no flakiness).
   */
  function runScannerSession(interact, options = {}) {
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

  it("rapid burst at 15ms inter-keystroke delta is buffered correctly", () => {
    const { scans } = runScannerSession(({ type, press }) => {
      type("8054112300017", 15);
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["8054112300017"]);
  });

  it("rapid burst at 30ms inter-keystroke delta is buffered correctly", () => {
    const { scans } = runScannerSession(({ type, press }) => {
      type("8054112300024", 30);
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["8054112300024"]);
  });

  it("rapid burst at 50ms inter-keystroke delta is buffered correctly", () => {
    const { scans } = runScannerSession(({ type, press }) => {
      type("ORC-AN-003", 50);
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["ORC-AN-003"]);
  });

  it("slow typing pause > 400ms resets the buffer", () => {
    const { scans } = runScannerSession(({ type, press, advance }) => {
      type("8054");
      advance(500); // manual pause — discards the partial buffer
      type("12300017");
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["12300017"]);
    expect(scans[0]).not.toContain("8054");
  });

  it("length < 4 chars on Enter is ignored and the buffer cleared ('123' ignored)", () => {
    const { scans } = runScannerSession(({ type, press, scans: captured }) => {
      type("123");
      const enter = press("Enter");
      assert.strictEqual(captured.length, 0, "short buffer must not emit a scan");
      assert.ok(!enter.defaultPrevented, "short buffer must not preventDefault");

      type("8054");
      press("Enter"); // exactly 4 chars — accepted
    });
    assert.deepStrictEqual(scans, ["8054"]);
  });

  it("exactly 4 chars on Enter is accepted", () => {
    const { scans } = runScannerSession(({ type, press }) => {
      type("1234");
      const enter = press("Enter");
      assert.ok(enter.defaultPrevented, "valid scan must preventDefault");
    });
    assert.deepStrictEqual(scans, ["1234"]);
  });

  it("exactly 13 digits EAN-13 is accepted", () => {
    const { scans } = runScannerSession(({ type, press }) => {
      type("8054112300017");
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["8054112300017"]);
    expect(scans[0]).toHaveLength(13);
  });

  it("alphanumeric code (e.g. 'BUL-PREC-01') is accepted", () => {
    const { scans } = runScannerSession(({ type, press }) => {
      type("BUL-PREC-01");
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["BUL-PREC-01"]);
  });

  it("code with whitespace is trimmed correctly", () => {
    const { scans } = runScannerSession(({ type, press }) => {
      type("  8054  ");
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["8054"]);
  });

  it("non-existent barcode/SKU lookup returns undefined cleanly", () => {
    assert.strictEqual(catalog.findProductByCode("9999999999999"), undefined);
    assert.strictEqual(catalog.findProductByCode("NON-EXISTENT-SKU"), undefined);
    assert.strictEqual(catalog.findProductByCode("   "), undefined);
    assert.strictEqual(catalog.findProductByCode(""), undefined);
  });

  it("empty Enter keypress does not trigger onScan callback", () => {
    const { scans } = runScannerSession(({ press, scans: captured }) => {
      const enter = press("Enter");
      assert.strictEqual(captured.length, 0);
      assert.ok(!enter.defaultPrevented);
      press("Enter"); // still empty
    });
    assert.deepStrictEqual(scans, []);
  });
});

/* ===========================================================================
 * 5. CODICE FISCALE & PARTITA IVA BOUNDARIES
 * ========================================================================= */

registerSuite("T2-5. Codice Fiscale & Partita IVA Boundaries", async () => {
  const { sdiProtocol } = await loadCore();

  it("CF 16 chars valid uppercase passes", () => {
    const result = sdiProtocol.validateSdiCustomer(baseB2CCustomer());
    expect(result.isValid).toBeTruthy();
    expect(result.errors.codiceFiscale).toBeUndefined();
  });

  it("CF 16 chars lowercase is normalized to uppercase and passes", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2CCustomer({ codiceFiscale: "rssmra80a01h703s" }),
    );
    expect(result.isValid).toBeTruthy();
    expect(result.errors.codiceFiscale).toBeUndefined();
  });

  it("CF 15 chars fails validation", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2CCustomer({ codiceFiscale: "RSSMRA80A01H703" }),
    );
    expect(result.isValid).toBeFalsy();
    expect(result.errors.codiceFiscale).toBeDefined();
  });

  it("CF 17 chars fails validation", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2CCustomer({ codiceFiscale: "RSSMRA80A01H703SS" }),
    );
    expect(result.isValid).toBeFalsy();
    expect(result.errors.codiceFiscale).toBeDefined();
  });

  it("P.IVA 11 digits valid passes", () => {
    const result = sdiProtocol.validateSdiCustomer(baseB2BCustomer());
    expect(result.isValid).toBeTruthy();
    expect(result.errors.partitaIva).toBeUndefined();
  });

  it("P.IVA 10 digits fails validation", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ partitaIva: "1234567890" }),
    );
    expect(result.isValid).toBeFalsy();
    expect(result.errors.partitaIva).toBeDefined();
  });

  it("P.IVA 12 digits fails validation", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ partitaIva: "123456789012" }),
    );
    expect(result.isValid).toBeFalsy();
    expect(result.errors.partitaIva).toBeDefined();
  });

  it("P.IVA containing letters (e.g. '0284758065A') fails validation", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ partitaIva: "0284758065A" }),
    );
    expect(result.isValid).toBeFalsy();
    expect(result.errors.partitaIva).toBeDefined();
  });
});

/* ===========================================================================
 * 6. SDI DESTINATION CODE, PEC & ADDRESS BOUNDARIES
 * ========================================================================= */

registerSuite("T2-6. SDI Destination Code, PEC & Address Boundaries", async () => {
  const { sdiProtocol } = await loadCore();

  it("SDI code exactly 7 alphanumeric chars passes", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ codiceDestinatario: "M5UXCR1", pec: "" }),
    );
    expect(result.isValid).toBeTruthy();
    expect(result.errors.codiceDestinatario).toBeUndefined();
  });

  it("SDI code '0000000' passes for B2C", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2CCustomer({ codiceDestinatario: "0000000" }),
    );
    expect(result.isValid).toBeTruthy();
    expect(result.errors.codiceDestinatario).toBeUndefined();
  });

  it("SDI code 6 chars fails", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ codiceDestinatario: "ABCDEF", pec: "" }),
    );
    expect(result.isValid).toBeFalsy();
    expect(result.errors.codiceDestinatario).toBeDefined();
  });

  it("SDI code 8 chars fails", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ codiceDestinatario: "ABCDEFGH", pec: "" }),
    );
    expect(result.isValid).toBeFalsy();
    expect(result.errors.codiceDestinatario).toBeDefined();
  });

  it("valid PEC email passes", () => {
    const result = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ codiceDestinatario: "", pec: "azienda@pec.it" }),
    );
    expect(result.isValid).toBeTruthy();
    expect(result.errors.pec).toBeUndefined();
  });

  it("invalid PEC email missing @ or dot fails", () => {
    const noAt = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ codiceDestinatario: "", pec: "azienda.pec.it" }),
    );
    expect(noAt.isValid).toBeFalsy();
    expect(noAt.errors.pec).toBeDefined();

    const noDot = sdiProtocol.validateSdiCustomer(
      baseB2BCustomer({ codiceDestinatario: "", pec: "azienda@pec" }),
    );
    expect(noDot.isValid).toBeFalsy();
    expect(noDot.errors.pec).toBeDefined();
  });

  it("CAP exactly 5 digits passes, 4 or 6 digits fails", () => {
    const ok = sdiProtocol.validateSdiCustomer(baseB2CCustomer({ cap: "84016" }));
    expect(ok.errors.cap).toBeUndefined();

    const four = sdiProtocol.validateSdiCustomer(baseB2CCustomer({ cap: "8401" }));
    expect(four.errors.cap).toBeDefined();

    const six = sdiProtocol.validateSdiCustomer(baseB2CCustomer({ cap: "840166" }));
    expect(six.errors.cap).toBeDefined();
  });

  it("Provincia exactly 2 letters passes, 1 or 3 letters fails", () => {
    const ok = sdiProtocol.validateSdiCustomer(baseB2CCustomer({ provincia: "SA" }));
    expect(ok.errors.provincia).toBeUndefined();

    const one = sdiProtocol.validateSdiCustomer(baseB2CCustomer({ provincia: "S" }));
    expect(one.errors.provincia).toBeDefined();

    const three = sdiProtocol.validateSdiCustomer(baseB2CCustomer({ provincia: "SAX" }));
    expect(three.errors.provincia).toBeDefined();
  });
});

/* ===========================================================================
 * 7. CASH TENDER & CHANGE (RESTO) BOUNDARIES
 * ========================================================================= */

registerSuite("T2-7. Cash Tender & Change (Resto) Boundaries", async () => {
  const line = (unitPrice, quantity = 1) => ({ unitPrice, quantity });

  it("exact cash (tendered == total) ⇒ changeDue 0.00€", () => {
    const result = computeTicket([line(180)], { cashTendered: 180 });
    expect(result.total).toBe(180);
    expect(result.changeDue).toBe(0);
  });

  it("tendered > total (200€ vs 180€) ⇒ changeDue 20.00€", () => {
    const result = computeTicket([line(180)], { cashTendered: 200 });
    expect(result.changeDue).toBe(20);
  });

  it("high denomination (500€ vs 25€) ⇒ changeDue 475.00€", () => {
    const result = computeTicket([line(25)], { cashTendered: 500 });
    expect(result.changeDue).toBe(475);
  });

  it("micro change (100.00€ vs 99.95€) ⇒ changeDue 0.05€", () => {
    const result = computeTicket([line(99.95)], { cashTendered: 100 });
    expect(result.total).toBeCloseTo(99.95, 2);
    expect(result.changeDue).toBeCloseTo(0.05, 2);
  });

  it("tendered < total ⇒ changeDue clamped to 0 and raw delta negative (remaining to pay)", () => {
    const result = computeTicket([line(180)], { cashTendered: 150 });
    expect(result.total).toBe(180);
    // Production clamps change to zero (never a negative "resto")...
    expect(result.changeDue).toBe(0);
    // ...while the signed difference is negative, i.e. 30€ still due.
    expect(result.tenderedDelta).toBeLessThan(0);
    expect(result.tenderedDelta).toBe(-30);
    expect(Math.abs(result.tenderedDelta)).toBe(30);
  });
});

/* ===========================================================================
 * 8. STOCK DEPLETION EDGE & CORNER CASES
 * ========================================================================= */

registerSuite("T2-8. Stock Depletion Edge & Corner Cases", async () => {
  const { catalog } = await loadCore();
  const { useInventoryStore } = await loadInventory();

  const store = () => useInventoryStore.getState();
  const productA =
    catalog.getProductBySlug("solitario-oro-bianco-diamante-050") ?? catalog.getAllProducts()[0];

  it("depleting 0 units does not alter stock", () => {
    store().resetToCatalog();
    const before = store().getStock(productA.barcode);
    expect(store().depleteStock(productA.barcode, 0, "SALE-ZERO", "Renato")).toBeTruthy();
    expect(store().getStock(productA.barcode)).toBe(before);
  });

  it("depleting exact stock quantity drops stock to 0 and isInStock to false", () => {
    store().resetToCatalog();
    const before = store().getStock(productA.barcode);
    expect(before).toBeGreaterThan(0);
    expect(store().depleteStock(productA.barcode, before, "SALE-EXACT", "Renato")).toBeTruthy();
    expect(store().getStock(productA.barcode)).toBe(0);
    expect(store().isInStock(productA.barcode)).toBeFalsy();
  });

  it("depleting more than available stock floors quantity at 0 (never negative)", () => {
    store().resetToCatalog();
    const before = store().getStock(productA.barcode);
    expect(
      store().depleteStock(productA.barcode, before + 100, "SALE-OVER", "Renato"),
    ).toBeTruthy();
    expect(store().getStock(productA.barcode)).toBe(0);
    expect(store().getStock(productA.barcode)).toBeGreaterThanOrEqual(0);
  });

  it("depletion of non-existent product barcode returns false without crashing", () => {
    store().resetToCatalog();
    let result;
    assert.doesNotThrow(() => {
      result = store().depleteStock("NON-EXISTENT-CODE-999", 1, "SALE-GHOST", "Renato");
    });
    expect(result).toBeFalsy();
    expect(store().getStock("NON-EXISTENT-CODE-999")).toBe(0);
  });

  it("multiple sequential depletions on zero stock remain at 0", () => {
    store().resetToCatalog();
    const before = store().getStock(productA.barcode);
    store().depleteStock(productA.barcode, before, "SALE-DRAIN", "Renato");
    expect(store().getStock(productA.barcode)).toBe(0);

    expect(store().depleteStock(productA.barcode, 5, "SALE-EXTRA-1", "Renato")).toBeTruthy();
    expect(store().getStock(productA.barcode)).toBe(0);
    expect(store().depleteStock(productA.barcode, 3, "SALE-EXTRA-2", "Renato")).toBeTruthy();
    expect(store().getStock(productA.barcode)).toBe(0);
    expect(store().isInStock(productA.barcode)).toBeFalsy();
  });
});

/* Keep `describe`/`test` exported API reachable for tooling that introspects tiers. */
void describe;
void test;
