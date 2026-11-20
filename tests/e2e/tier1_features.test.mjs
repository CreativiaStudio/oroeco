/**
 * tests/e2e/tier1_features.test.mjs
 * ---------------------------------------------------------------------------
 * GIOIELLERIA OROECO — Tier 1: Feature-Area Happy-Path Coverage
 *
 * Opaque-box, requirement-driven verification of all nine feature areas
 * described in ORIGINAL_REQUEST / TEST_INFRA.md:
 *
 *   1. Database Isolation & Standalone Schema        (R3) — 6 tests
 *   2. Visual Identity & Design System               (R1) — 6 tests
 *   3. Navigation & Excel Routes                     (R1) — 8 tests
 *   4. Cart Drawer & Free Shipping (>150€)           (R1) — 6 tests
 *   5. POS Barcode Hardware Listener                 (R2) — 5 tests
 *   6. POS Ticket & Tax Computation                  (R2) — 6 tests
 *   7. Axon Micrelec Aura RT Modal & Protocol        (R2) — 6 tests
 *   8. SDI 1-Click Invoice Modal & Protocol          (R2) — 6 tests
 *   9. Stock Depletion & Inventory                   (R2) — 6 tests
 *
 * Total: 55 test cases.
 *
 * Execution modes
 *   - node tests/e2e/tier1_features.test.mjs   (harness auto-runs, sets exit code)
 *   - node tests/e2e/runner.mjs                (runner drives runSuites itself)
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
  console.warn("[tier1] module resolver hook unavailable:", error && error.message);
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
  ]).then(([catalog, navigation, auraProtocol, sdiProtocol]) => ({
    catalog,
    navigation,
    auraProtocol,
    sdiProtocol,
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

function walkSourceFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === ".git" ||
      entry.name === ".agents" ||
      entry.name === "coverage"
    ) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkSourceFiles(full, acc);
    else if (/\.(ts|tsx|js|mjs|cjs|json)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

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
 * components/admin/CassaTerminal.tsx (verified against the source in Feature 6).
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

const REQUIRED_TABLES = [
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

/* ===========================================================================
 * 1. DATABASE ISOLATION & STANDALONE SCHEMA (R3)
 * ========================================================================= */

registerSuite("1. Database Isolation & Standalone Schema (R3)", async () => {
  const { catalog } = await loadCore();
  const schema = readText("supabase/schema.sql");

  it("enforces strict database isolation: only dedicated Oroeco Supabase instance is permitted and agency DBs are forbidden", () => {
    const files = ["app", "lib", "store", "components", "types"].flatMap((dir) =>
      walkSourceFiles(path.join(ROOT, dir)),
    );

    const forbiddenAgencyDbs = [
      /creativia.*(supabase|postgres|database|_hub)/i,
      /yqvy[a-z0-9]+/i, // Creativia Studio Supabase instance
      /DATABASE_URL\s*=/i,
      /POSTGRES_(URL|PASSWORD)\s*=/i,
      /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/, // Hardcoded raw JWT tokens
    ];

    const violations = [];
    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      // If a supabase url is mentioned, ensure it's ONLY the dedicated oroeco instance
      const supabaseUrls = text.match(/https?:\/\/[a-z0-9-]+\.supabase\.co/gi) || [];
      for (const url of supabaseUrls) {
        if (!url.includes("cuztyagbckeyljlhhzvr")) {
          violations.push(`${path.relative(ROOT, file)} :: unauthorized database URL ${url}`);
        }
      }

      for (const pattern of forbiddenAgencyDbs) {
        if (pattern.test(text)) {
          violations.push(`${path.relative(ROOT, file)} :: forbidden agency reference ${pattern}`);
        }
      }
    }
    assert.deepStrictEqual(violations, [], `External database isolation violations found: ${violations.join("; ")}`);

    const pkg = JSON.parse(readText("package.json"));
    assert.ok(pkg.dependencies?.["@supabase/supabase-js"], "supabase-js must be installed for dedicated Oroeco DB");
  });

  it("ships supabase/schema.sql as a standalone, decoupled schema", () => {
    assert.ok(fileExists("supabase/schema.sql"), "supabase/schema.sql must exist");
    assert.match(schema, /STANDALONE/);
    assert.match(schema, /decoupled from Creativia Studio/i);
    assert.ok(!/creativia_hub/i.test(schema), "must not reference the agency hub schema");
  });

  it("defines all nine required Oroeco tables", () => {
    for (const table of REQUIRED_TABLES) {
      assert.ok(
        schema.includes(`CREATE TABLE IF NOT EXISTS ${table}`),
        `missing table definition: ${table}`,
      );
    }
  });

  it("enables row level security on every table", () => {
    for (const table of REQUIRED_TABLES) {
      assert.ok(
        schema.includes(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`),
        `RLS not enabled on ${table}`,
      );
    }
    assert.match(schema, /CREATE POLICY/);
  });

  it("ships the atomic oroeco_record_pos_sale procedure with a FOR UPDATE row lock", () => {
    assert.ok(schema.includes("CREATE OR REPLACE FUNCTION oroeco_record_pos_sale"));
    assert.match(schema, /FOR UPDATE/);
    assert.match(schema, /jsonb_array_elements/);
    assert.match(schema, /GREATEST\(0,\s*v_current_stock - v_qty\)/);
    assert.match(schema, /SECURITY DEFINER/);
  });

  it("provides lib/catalog.ts as a 100% local, typed catalogue with 17 active brands", () => {
    const source = readText("lib/catalog.ts");
    assert.match(source, /export const products: Product\[\]/);
    assert.match(source, /export const brands: Brand\[\]/);
    assert.ok(!/fetch\(|axios|createClient|@supabase|XMLHttpRequest/.test(source), "catalogue must stay local");

    assert.strictEqual(catalog.brands.length, 17);
    assert.strictEqual(catalog.getAllBrands().length, 17);
    assert.strictEqual(new Set(catalog.brands.map((brand) => brand.slug)).size, 17);
    assert.ok(!catalog.brands.some((brand) => brand.slug === "amen"), "AMEN must be removed");
    assert.ok(catalog.products.length >= 17, "catalogue must expose a meaningful product set");

    const categories = new Set(["gioielli", "orologi", "accessori", "casa", "natale"]);
    for (const product of catalog.products) {
      assert.strictEqual(typeof product.id, "string");
      assert.strictEqual(typeof product.slug, "string");
      assert.strictEqual(typeof product.name, "string");
      assert.strictEqual(typeof product.price, "number");
      assert.ok(categories.has(product.category), `unexpected category: ${product.category}`);
      assert.strictEqual(typeof product.barcode, "string");
      assert.strictEqual(typeof product.sku, "string");
      assert.strictEqual(product.currency, "EUR");
      assert.ok(Array.isArray(product.images));
      assert.ok(Array.isArray(product.tags));
      assert.strictEqual(typeof product.attributes, "object");
    }
    assert.strictEqual(catalog.getAllProducts().length, catalog.products.length);
  });
});

/* ===========================================================================
 * 2. VISUAL IDENTITY & DESIGN SYSTEM (R1)
 * ========================================================================= */

registerSuite("2. Visual Identity & Design System (R1)", async () => {
  const css = readText("app/globals.css");
  const footer = readText("components/layout/Footer.tsx");

  it("renders the storefront on a pure white canvas (#ffffff)", () => {
    assert.match(css, /background-color:\s*#ffffff/i);
  });

  it("uses deep ebony ink and warm graphite tokens for text", () => {
    assert.match(css, /--color-ink:\s*#0a0a0a/i);
    assert.match(css, /--color-ink-soft:\s*#151515/i);
    assert.match(css, /--color-graphite:\s*#4e423e/i);
    assert.match(css, /--color-graphite-soft:\s*#6b615c/i);
  });

  it("defines the warm satin gold accent palette", () => {
    assert.match(css, /--color-gold:\s*#c5a059/i);
    assert.match(css, /--color-gold-bright:\s*#d4af37/i);
    assert.match(css, /--color-gold-soft:\s*#e7d9b8/i);
  });

  it("pairs Playfair Display headings with Plus Jakarta Sans body copy", () => {
    assert.match(css, /Playfair\+Display/);
    assert.match(css, /Plus\+Jakarta\+Sans/);
    assert.match(css, /--font-serif:\s*"(Arapey|Playfair Display)"/);
    assert.match(css, /--font-sans:\s*"Plus Jakarta Sans"/);
    assert.match(css, /h1,[\s\S]*?font-family:\s*var\(--font-serif\)/);
    assert.match(css, /body\s*\{[\s\S]*?font-family:\s*var\(--font-sans\)/);
  });

  it("uses refined 1px hairlines, the .luxe-rule and compact radii", () => {
    assert.match(css, /--color-line:\s*#eaeaea/i);
    assert.match(css, /\.luxe-rule\s*\{[\s\S]*?height:\s*1px/);

    const drawer = readText("components/cart/CartDrawer.tsx");
    assert.match(drawer, /rounded-sm/);
    assert.ok(!/rounded-(2xl|3xl|xl|lg)\b/.test(drawer), "cart drawer must use compact radii");
    assert.ok(!/rounded-(2xl|3xl|xl|lg)\b/.test(footer), "footer must use compact radii");
  });

  it("credits 'Sviluppato da Creativia Studio' in the footer", () => {
    assert.match(footer, /Sviluppato da/);
    assert.match(footer, /Creativia Studio/);
  });
});

/* ===========================================================================
 * 3. NAVIGATION & EXCEL ROUTES (R1)
 * ========================================================================= */

registerSuite("3. Navigation & Excel Routes (R1)", async () => {
  const { catalog, navigation } = await loadCore();
  const { subcategoriesByCategory, mainNav } = navigation;

  it("/storia exists and tells the atelier story of San Marzano dal 1992", () => {
    assert.ok(fileExists("app/storia/page.tsx"), "app/storia/page.tsx must exist");
    const source = readText("app/storia/page.tsx");
    assert.match(source, /1992/);
    assert.match(source, /San Marzano/);
    assert.match(source, /Renato/);
  });

  it("/gioielli exposes the five updated subcategories", () => {
    assert.ok(fileExists("app/gioielli/page.tsx"));
    assert.deepStrictEqual(
      subcategoriesByCategory.gioielli.map((item) => item.slug),
      ["anelli", "bracciali", "collane", "orecchini", "ciondoli"],
    );
    assert.ok(catalog.getProductsByCategory("gioielli").length > 0);
  });

  it("/orologi exposes the two Excel subcategories", () => {
    assert.ok(fileExists("app/orologi/page.tsx"));
    assert.deepStrictEqual(
      subcategoriesByCategory.orologi.map((item) => item.slug),
      ["uomo", "donna"],
    );
    assert.ok(catalog.getProductsByCategory("orologi").length > 0);
  });

  it("/accessori exposes pelletteria and portachiavi subcategories", () => {
    assert.ok(fileExists("app/accessori/page.tsx"));
    assert.deepStrictEqual(
      subcategoriesByCategory.accessori.map((item) => item.slug),
      ["pelletteria", "portachiavi"],
    );
    assert.ok(catalog.getProductsByCategory("accessori").length > 0);
  });

  it("/casa exposes the active home subcategories without solidali", () => {
    assert.ok(fileExists("app/casa/page.tsx"));
    assert.deepStrictEqual(
      subcategoriesByCategory.casa.map((item) => item.slug),
      [
        "statue",
        "profumatori",
        "candele",
        "vasi",
        "decanter",
      ],
    );
    assert.ok(!subcategoriesByCategory.casa.some((item) => item.slug === "solidali"));
    assert.ok(catalog.getProductsByCategory("casa").length > 0);
  });

  it("/brand lists all 17 active official brands from the navigation", () => {
    assert.ok(fileExists("app/brand/page.tsx"));
    const brands = catalog.getAllBrands();
    assert.strictEqual(brands.length, 17);

    const brandNav = mainNav.find((item) => item.href === "/brand");
    assert.ok(brandNav && Array.isArray(brandNav.children), "mainNav must expose the brand menu");
    assert.strictEqual(brandNav.children.length, 17);

    const navSlugs = brandNav.children.map((child) => child.href.replace(/^\/brand\//, ""));
    assert.deepStrictEqual(
      [...navSlugs].sort(),
      brands.map((brand) => brand.slug).sort(),
    );
  });

  it("/natale renders the live Christmas selection", () => {
    assert.ok(fileExists("app/natale/page.tsx"));
    assert.match(readText("app/natale/page.tsx"), /getLiveChristmasProducts/);

    const christmas = catalog.getChristmasProducts();
    assert.ok(christmas.length > 0, "Christmas selection must not be empty");
    assert.ok(christmas.every((product) => product.isChristmas || product.category === "natale"));
    assert.ok(christmas.some((product) => product.isChristmas === true));
  });

  it("the dynamic /prodotto/[slug] route exists", () => {
    assert.ok(fileExists("app/prodotto/[slug]/page.tsx"), "dynamic product route must exist");
  });

  it("/admin, /admin/cassa and /api/admin|pos routes enforce HMAC session protection", () => {
    assert.ok(fileExists("middleware.ts"), "middleware.ts must exist");
    assert.ok(fileExists("lib/adminAuth.ts"), "lib/adminAuth.ts must exist");
    assert.ok(fileExists("app/admin/login/page.tsx"), "app/admin/login/page.tsx must exist");
    const mw = readText("middleware.ts");
    assert.match(mw, /"\/admin\/:path\*"/);
    assert.match(mw, /"\/api\/admin\/:path\*"/);
    assert.match(mw, /"\/api\/pos\/:path\*"/);

    const auth = readText("lib/adminAuth.ts");
    assert.match(auth, /oroeco_admin_session/);
    assert.match(auth, /HMAC/);

    for (const apiPath of [
      "app/api/admin/products/route.ts",
      "app/api/admin/crm/route.ts",
      "app/api/admin/media/route.ts",
      "app/api/pos/sale/route.ts",
    ]) {
      assert.match(readText(apiPath), /getAdminSessionFromRequest/, `${apiPath} must verify session`);
    }
  });
});

/* ===========================================================================
 * 4. CART DRAWER & FREE SHIPPING (>150€) (R1)
 * ========================================================================= */

registerSuite("4. Cart Drawer & Free Shipping (>150€) (R1)", async () => {
  const cart = await loadCart();
  const { calculateTotals, FREE_SHIPPING_THRESHOLD, SHIPPING_COST } = cart;

  it("an empty cart has zero subtotal, zero shipping and zero progress", () => {
    const totals = calculateTotals([]);
    assert.strictEqual(totals.subtotal, 0);
    assert.strictEqual(totals.shipping, 0);
    assert.strictEqual(totals.total, 0);
    assert.strictEqual(totals.progress, 0);
    assert.strictEqual(totals.itemCount, 0);
  });

  it("an order below 150€ charges 9.90€ shipping, 60€ remaining and 60% progress", () => {
    assert.strictEqual(SHIPPING_COST, 9.9);
    const totals = calculateTotals([{ product: makeProduct({ price: 90 }), quantity: 1 }]);
    expect(totals.subtotal).toBe(90);
    expect(totals.shipping).toBe(9.9);
    expect(totals.total).toBeCloseTo(99.9, 2);
    expect(totals.freeShipping).toBeFalsy();
    expect(totals.remainingForFreeShipping).toBe(60);
    expect(totals.progress).toBe(60);
  });

  it("an order above 150€ unlocks free shipping at 100% progress", () => {
    const totals = calculateTotals([{ product: makeProduct({ price: 250 }), quantity: 1 }]);
    expect(totals.shipping).toBe(0);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.total).toBe(250);
    expect(totals.progress).toBe(100);
    expect(totals.remainingForFreeShipping).toBe(0);
  });

  it("an order of exactly 150€ is at the free-shipping threshold", () => {
    assert.strictEqual(FREE_SHIPPING_THRESHOLD, 150);
    const totals = calculateTotals([{ product: makeProduct({ price: 150 }), quantity: 1 }]);
    expect(totals.freeShipping).toBeTruthy();
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(150);
    expect(totals.progress).toBe(100);
    expect(totals.remainingForFreeShipping).toBe(0);
  });

  it("multi-item carts sum line totals and item counts", () => {
    const totals = calculateTotals([
      { product: makeProduct({ id: "a", price: 100 }), quantity: 2 },
      { product: makeProduct({ id: "b", price: 30 }), quantity: 1 },
    ]);
    expect(totals.subtotal).toBe(230);
    expect(totals.itemCount).toBe(3);
    expect(totals.shipping).toBe(0);
    expect(totals.total).toBe(230);
  });

  it("the cart drawer and announcement bar advertise free shipping over 150€", () => {
    const drawer = readText("components/cart/CartDrawer.tsx");
    assert.match(drawer, /calculateTotals/);
    assert.match(drawer, /FREE_SHIPPING_THRESHOLD/);
    assert.match(drawer, /totals\.progress/);
    assert.match(drawer, /remainingForFreeShipping/);

    const bar = readText("components/layout/AnnouncementBar.tsx");
    assert.match(bar, /Spedizione assicurata gratuita sopra i 150/);
  });
});

/* ===========================================================================
 * 5. POS BARCODE HARDWARE LISTENER (R2)
 * ========================================================================= */

registerSuite("5. POS Barcode Hardware Listener (R2)", async () => {
  const { catalog } = await loadCore();
  const scanner = await loadBarcode();

  /**
   * Instantiates the real useBarcodeScanner hook with a window double and
   * returns the captured scans. `interact` drives the keydown stream.
   */
  function runScannerSession(interact, options = {}) {
    const previousWindow = globalThis.window;
    const window = new FakeWindow();
    globalThis.window = window;
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

      interact({ press, window, scans });
    } finally {
      globalThis.window = previousWindow;
    }

    return { scans };
  }

  it("accepts a barcode stream typed faster than the 60ms inter-keystroke threshold", () => {
    assert.match(readText("lib/useBarcodeScanner.ts"), /maxKeystrokeDeltaMs = 60/);
    const { scans } = runScannerSession(({ press }) => {
      for (const char of "8054112300017") press(char);
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["8054112300017"]);
  });

  it("an Enter terminator emits the scan and resets the internal buffer", () => {
    const { scans } = runScannerSession(({ press }) => {
      for (const char of "8054112300017") press(char);
      const enter = press("Enter");
      assert.ok(enter.defaultPrevented, "Enter must be preventDefault()ed on a valid scan");

      press("Enter"); // empty buffer — must not emit
      for (const char of "8054112300024") press(char);
      press("Enter");
    });
    assert.deepStrictEqual(scans, ["8054112300017", "8054112300024"]);
  });

  it("ignores codes shorter than minChars (<4)", () => {
    const { scans } = runScannerSession(({ press }) => {
      for (const char of "12") press(char);
      press("Enter"); // too short — discarded
      for (const char of "8054") press(char);
      press("Enter"); // exactly 4 chars — accepted
    });
    assert.deepStrictEqual(scans, ["8054"]);
  });

  it("findProductByCode resolves known EAN-13 barcodes and internal SKUs", () => {
    const first = catalog.findProductByCode("8054112300017");
    assert.ok(first, "EAN 8054112300017 must resolve");
    assert.strictEqual(first.sku, "ORC-AN-001");

    const second = catalog.findProductByCode("8054112300024");
    assert.ok(second, "EAN 8054112300024 must resolve");
    assert.strictEqual(second.sku, "ORC-AN-002");

    assert.strictEqual(catalog.findProductByCode("ORC-AN-001")?.id, first.id);
    assert.strictEqual(catalog.findProductByCode("   "), undefined);
  });

  it("playPosBeep executes without error, including with a Web Audio context", () => {
    const previousWindow = globalThis.window;
    const window = new FakeWindow();
    globalThis.window = window;
    try {
      assert.doesNotThrow(() => scanner.playPosBeep());

      let started = 0;
      window.AudioContext = class {
        constructor() {
          this.state = "running";
          this.currentTime = 0;
          this.destination = {};
        }
        createOscillator() {
          return {
            type: "",
            frequency: { setValueAtTime() {} },
            connect() {},
            start() {
              started += 1;
            },
            stop() {},
          };
        }
        createGain() {
          return {
            gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
            connect() {},
          };
        }
        resume() {
          return Promise.resolve();
        }
      };

      assert.doesNotThrow(() => scanner.playPosBeep(1450, 0.08));
      assert.strictEqual(started, 1, "the beep oscillator must be started once");
    } finally {
      globalThis.window = previousWindow;
    }
  });
});

/* ===========================================================================
 * 6. POS TICKET & TAX COMPUTATION (R2)
 * ========================================================================= */

registerSuite("6. POS Ticket & Tax Computation (R2)", async () => {
  const posSource = readText("components/admin/CassaTerminal.tsx");

  it("computes subtotal from line items (unitPrice × quantity)", () => {
    const result = computeTicket([
      { unitPrice: 100, quantity: 2 },
      { unitPrice: 50, quantity: 1 },
    ]);
    expect(result.subtotal).toBe(250);
    expect(result.total).toBe(250);
  });

  it("applies a percentage discount (10% on 1000€ ⇒ 100€ off, 900€ total)", () => {
    const result = computeTicket([{ unitPrice: 1000, quantity: 1 }], {
      discountMode: "percent",
      discountValue: 10,
    });
    expect(result.discountAmount).toBe(100);
    expect(result.total).toBe(900);
    assert.match(posSource, /discountMode === "percent"/);
  });

  it("applies a fixed value discount (50€ off 200€ ⇒ 150€ total)", () => {
    const result = computeTicket([{ unitPrice: 200, quantity: 1 }], {
      discountMode: "amount",
      discountValue: 50,
    });
    expect(result.discountAmount).toBe(50);
    expect(result.total).toBe(150);
    assert.match(posSource, /Math\.min\(subtotal, parsedDiscount\)/);
  });

  it("derives the taxable base as Total / 1.22 (Imponibile IVA 22%)", () => {
    const result = computeTicket([{ unitPrice: 122, quantity: 1 }]);
    expect(result.taxableBase).toBe(100);
    assert.match(posSource, /total \/ 1\.22/);
  });

  it("derives the 22% VAT as Total − Imponibile (IVA scorporata)", () => {
    const result = computeTicket([{ unitPrice: 122, quantity: 1 }]);
    expect(result.vatRate).toBe(22);
    expect(result.vatAmount).toBe(22);
    assert.match(posSource, /total - taxableBase/);
  });

  it("computes the cash change (500€ tendered − 450€ total ⇒ 50€ rest)", () => {
    const result = computeTicket([{ unitPrice: 450, quantity: 1 }], { cashTendered: 500 });
    expect(result.total).toBe(450);
    expect(result.changeDue).toBe(50);
    assert.match(posSource, /cashTendered - total/);
  });
});

/* ===========================================================================
 * 7. AXON MICRELEC AURA RT MODAL & PROTOCOL (R2)
 * ========================================================================= */

registerSuite("7. Axon Micrelec Aura RT Modal & Protocol (R2)", async () => {
  const { catalog, auraProtocol } = await loadCore();
  const product =
    catalog.getProductBySlug("solitario-oro-bianco-diamante-050") ?? catalog.getAllProducts()[0];
  const oneLineTicket = () => makeTicket({ items: [makeLine(product, 1)] });

  it("resolves the Ditron department for every macro category", () => {
    expect(auraProtocol.getDepartmentForCategory("gioielli")).toBe(1);
    expect(auraProtocol.getDepartmentForCategory("orologi")).toBe(1);
    expect(auraProtocol.getDepartmentForCategory("accessori")).toBe(2);
    expect(auraProtocol.getDepartmentForCategory("casa")).toBe(3);
    expect(auraProtocol.getDepartmentForCategory("natale")).toBe(4);
    expect(auraProtocol.getDepartmentForCategory(undefined)).toBe(1);

    for (const department of Object.values(auraProtocol.AURA_DEPARTMENTS)) {
      expect(department.vatRate).toBe(22);
    }
  });

  it("sanitizes descriptions by stripping quotes and capping at 24 characters", () => {
    const cleaned = auraProtocol.sanitizeAuraDescription(
      "Anello 'Oro' \"Bianco\" Città 0,50 ct Diamante",
    );
    expect(cleaned).not.toContain("'");
    expect(cleaned).not.toContain('"');
    expect(cleaned).not.toContain("à");
    expect(cleaned.length).toBeLessThanOrEqual(24);
    expect(auraProtocol.sanitizeAuraDescription("A".repeat(40)).length).toBe(24);
  });

  it("emits the Ditron LAN sequence OPER, VEND, SUBT and CHIUS", () => {
    const payload = auraProtocol.generateDitronAuraPayload(oneLineTicket(), "Renato");
    expect(payload.commandLines[0].startsWith("OPER DES=")).toBeTruthy();
    expect(payload.commandLines.some((line) => line.startsWith("VEND REP=1"))).toBeTruthy();
    expect(payload.commandLines).toContain("SUBT");
    expect(payload.commandLines.some((line) => line.startsWith("CHIUS T=1"))).toBeTruthy();
    expect(payload.rawPayload.endsWith("\r\n")).toBeTruthy();
    expect(payload.totalEuro).toBe(product.price);
  });

  it("includes SCONTO S=... when a negotiated discount is applied", () => {
    const ticket = makeTicket({
      items: [makeLine(product, 1)],
      discountMode: "percent",
      discountValue: 10,
    });
    const payload = auraProtocol.generateDitronAuraPayload(ticket, "Renato");
    expect(payload.commandLines).toContain(`SCONTO S=${ticket.discountAmount.toFixed(2)}`);
    const noDiscount = auraProtocol.generateDitronAuraPayload(oneLineTicket(), "Renato");
    expect(noDiscount.commandLines.some((line) => line.startsWith("SCONTO"))).toBeFalsy();
  });

  it("includes LOTTERIA COD=... when an 8-character lottery code is present", () => {
    const ticket = makeTicket({ items: [makeLine(product, 1)], lotteryCode: "8a7b6c5d" });
    const payload = auraProtocol.generateDitronAuraPayload(ticket, "Renato");
    expect(payload.commandLines).toContain("LOTTERIA COD='8A7B6C5D'");

    const shortCode = makeTicket({ items: [makeLine(product, 1)], lotteryCode: "ABC" });
    const noLottery = auraProtocol.generateDitronAuraPayload(shortCode, "Renato");
    expect(noLottery.commandLines.some((line) => line.startsWith("LOTTERIA"))).toBeFalsy();
  });

  it("builds a thermal receipt preview with header, lines, VAT breakdown and San Marzano footer", () => {
    const text = auraProtocol.buildThermalReceiptPreview(
      oneLineTicket(),
      "Renato",
      "001-001",
      "99MEY012480",
    );
    expect(text).toContain("GIOIELLERIA ORO & CO");
    expect(text).toContain("84010 San Marzano sul Sarno (SA)");
    expect(text).toContain("SUBTOTALE");
    expect(text).toContain("di cui IVA 22,00%");
    expect(text).toContain("Totale Imponibile Netto");
    expect(text).toContain("DAL 1992");
    expect(text).toContain(auraProtocol.sanitizeAuraDescription(product.name));
  });
});

/* ===========================================================================
 * 8. SDI 1-CLICK INVOICE MODAL & PROTOCOL (R2)
 * ========================================================================= */

registerSuite("8. SDI 1-Click Invoice Modal & Protocol (R2)", async () => {
  const { catalog, sdiProtocol } = await loadCore();
  const product = catalog.getAllProducts()[0];
  const ticket = makeTicket({
    items: [makeLine(product, 2)],
    paymentMethod: "card",
    cashTendered: 0,
  });

  const baseB2C = {
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
  };

  const baseB2B = {
    customerType: "b2b",
    ragioneSociale: "Boutique Lusso S.r.l.",
    partitaIva: "01234567890",
    codiceFiscale: "01234567890",
    codiceDestinatario: "M5UXCR1",
    pec: "azienda@pec.it",
    indirizzo: "Corso Italia, 45",
    cap: "80100",
    comune: "Napoli",
    provincia: "NA",
    nazione: "IT",
  };

  it("validates B2C fiscal codes (16 characters)", () => {
    expect(sdiProtocol.validateSdiCustomer(baseB2C).isValid).toBeTruthy();

    const invalid = sdiProtocol.validateSdiCustomer({ ...baseB2C, codiceFiscale: "12345" });
    expect(invalid.isValid).toBeFalsy();
    expect(invalid.errors.codiceFiscale).toBeDefined();

    const empty = sdiProtocol.validateSdiCustomer({ ...baseB2C, codiceFiscale: "" });
    expect(empty.errors.codiceFiscale).toBeDefined();
  });

  it("validates B2B VAT numbers (11 digits)", () => {
    expect(sdiProtocol.validateSdiCustomer(baseB2B).isValid).toBeTruthy();

    const invalid = sdiProtocol.validateSdiCustomer({ ...baseB2B, partitaIva: "1234567890" });
    expect(invalid.isValid).toBeFalsy();
    expect(invalid.errors.partitaIva).toBeDefined();

    const letters = sdiProtocol.validateSdiCustomer({ ...baseB2B, partitaIva: "ABCDEFGHIJK" });
    expect(letters.errors.partitaIva).toBeDefined();
  });

  it("requires a 7-character SDI code or a valid PEC for B2B", () => {
    const validPecOnly = sdiProtocol.validateSdiCustomer({
      ...baseB2B,
      codiceDestinatario: "",
    });
    expect(validPecOnly.isValid).toBeTruthy();

    const badSdi = sdiProtocol.validateSdiCustomer({
      ...baseB2B,
      codiceDestinatario: "ABCD",
      pec: "",
    });
    expect(badSdi.isValid).toBeFalsy();
    expect(badSdi.errors.codiceDestinatario).toBeDefined();

    const badPec = sdiProtocol.validateSdiCustomer({
      ...baseB2B,
      codiceDestinatario: "",
      pec: "not-an-email",
    });
    expect(badPec.isValid).toBeFalsy();
    expect(badPec.errors.pec).toBeDefined();
  });

  it("enforces the mandatory address fields (indirizzo, comune, CAP, provincia)", () => {
    expect(sdiProtocol.validateSdiCustomer({ ...baseB2C, indirizzo: "" }).errors.indirizzo).toBeDefined();
    expect(sdiProtocol.validateSdiCustomer({ ...baseB2C, comune: "" }).errors.comune).toBeDefined();
    expect(sdiProtocol.validateSdiCustomer({ ...baseB2C, cap: "123" }).errors.cap).toBeDefined();
    expect(sdiProtocol.validateSdiCustomer({ ...baseB2C, provincia: "S" }).errors.provincia).toBeDefined();
    expect(sdiProtocol.validateSdiCustomer(baseB2C).errors.cap).toBeUndefined();
    expect(sdiProtocol.validateSdiCustomer(baseB2C).errors.indirizzo).toBeUndefined();
  });

  it("generates a FatturaPA v1.2 (FPR12) XML with Oroeco cedente, lines and 22% VAT", () => {
    const xml = sdiProtocol.buildFatturaPaXml(
      "FATT-20260101-001",
      new Date().toISOString(),
      baseB2C,
      ticket,
    );
    expect(xml).toContain('versione="FPR12"');
    expect(xml).toContain("<FormatoTrasmissione>FPR12</FormatoTrasmissione>");
    expect(xml).toContain("<IdCodice>02847580651</IdCodice>");
    expect(xml).toContain("<DettaglioLinee>");
    expect(xml).toContain("<AliquotaIVA>22.00</AliquotaIVA>");
    expect(xml).toContain("<ImponibileImporto>");
    expect(xml).toContain("<Numero>FATT-20260101-001</Numero>");
  });

  it("generateSdiPayload returns a complete payload with invoice number and matching totals", () => {
    const payload = sdiProtocol.generateSdiPayload(baseB2C, ticket, "Renato");
    expect(payload.invoiceNumber).toMatch(/^FATT-\d{8}-\d{3}$/);
    expect(payload.totaleDocumento).toBe(ticket.total);
    expect(payload.imponibileTotale).toBe(ticket.taxBreakdown.taxableBase);
    expect(payload.impostaTotale).toBe(ticket.taxBreakdown.vatAmount);
    expect(payload.summaryLines.length).toBe(ticket.items.length);
    expect(payload.xmlFatturaPA).toContain("GIOIELLERIA ORO & CO");
    expect(payload.xmlFatturaPA).toContain(payload.invoiceNumber);
  });
});

/* ===========================================================================
 * 9. STOCK DEPLETION & INVENTORY (R2)
 * ========================================================================= */

registerSuite("9. Stock Depletion & Inventory (R2)", async () => {
  const { catalog } = await loadCore();
  const { useInventoryStore } = await loadInventory();

  const store = () => useInventoryStore.getState();
  const productA =
    catalog.getProductBySlug("solitario-oro-bianco-diamante-050") ?? catalog.getAllProducts()[0];
  const productB = catalog
    .getAllProducts()
    .find((item) => item.id !== productA.id && item.stockQuantity > 1);

  it("getStock returns the initial catalogue stock", () => {
    store().resetToCatalog();
    expect(store().getStock(productA.barcode)).toBe(productA.stockQuantity);
    expect(store().getStock(productA.id)).toBe(productA.stockQuantity);
    expect(store().getStock(productA.sku)).toBe(productA.stockQuantity);
  });

  it("depleteStock decrements stock and records an inventory transaction", () => {
    store().resetToCatalog();
    const before = productA.stockQuantity;
    const historyBefore = store().getTransactionHistory().length;

    expect(store().depleteStock(productA.barcode, 2, "SALE-TEST", "Renato")).toBeTruthy();
    expect(store().getStock(productA.barcode)).toBe(before - 2);

    const history = store().getTransactionHistory();
    expect(history.length).toBe(historyBefore + 1);
    expect(history[0].changeQuantity).toBe(-2);
    expect(history[0].previousQuantity).toBe(before);
    expect(history[0].newQuantity).toBe(before - 2);
    expect(history[0].movementType).toBe("pos_instore_sale");
    expect(history[0].referenceId).toBe("SALE-TEST");
  });

  it("getStock reflects the depleted quantity across barcode, SKU and id lookups", () => {
    store().resetToCatalog();
    store().depleteStock(productA.sku, 3, "SALE-SKU", "Carmela");
    const expected = productA.stockQuantity - 3;
    expect(store().getStock(productA.barcode)).toBe(expected);
    expect(store().getStock(productA.sku)).toBe(expected);
    expect(store().getStock(productA.id)).toBe(expected);
  });

  it("never decrements stock below zero", () => {
    store().resetToCatalog();
    expect(
      store().depleteStock(productA.barcode, productA.stockQuantity + 100, "SALE-OVER", "Renato"),
    ).toBeTruthy();
    expect(store().getStock(productA.barcode)).toBe(0);
    expect(store().getTransactionHistory()[0].newQuantity).toBe(0);
  });

  it("batchDepleteStock handles multiple receipt lines", () => {
    store().resetToCatalog();
    const beforeA = productA.stockQuantity;
    const beforeB = productB.stockQuantity;

    expect(
      store().batchDepleteStock(
        [
          { barcodeOrSku: productA.barcode, quantity: 1 },
          { barcodeOrSku: productB.barcode, quantity: 2 },
        ],
        "MULTI-SALE",
        "Carmela",
      ),
    ).toBeTruthy();

    expect(store().getStock(productA.barcode)).toBe(beforeA - 1);
    expect(store().getStock(productB.barcode)).toBe(beforeB - 2);

    const recorded = store()
      .getTransactionHistory()
      .filter((transaction) => transaction.referenceId === "MULTI-SALE");
    expect(recorded.length).toBe(2);
    expect(recorded.every((transaction) => transaction.changeQuantity < 0)).toBeTruthy();
  });

  it("resetToCatalog restores every catalogue stock quantity", () => {
    store().resetToCatalog();
    store().depleteStock(productA.barcode, 1, "SALE-RESET", "Renato");
    store().batchDepleteStock(
      [{ barcodeOrSku: productB.barcode, quantity: 1 }],
      "SALE-RESET2",
      "Renato",
    );
    store().resetToCatalog();

    for (const item of catalog.getAllProducts()) {
      expect(store().getStock(item.id)).toBe(item.stockQuantity);
    }
  });
});

/* Keep `describe`/`test` exported API reachable for tooling that introspects tiers. */
void describe;
void test;
