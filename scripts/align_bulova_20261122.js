require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_bulova.json");
const SCRAPED_PATH = path.join(process.cwd(), "data/enrichment/bulova_scraped_20261122.json");
const MISSING_PATH = path.join(process.cwd(), "data/enrichment/bulova_missing_results_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_bulova.json");

function cleanPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 3 || n > 25000) return null;
  return Math.round(n * 100) / 100;
}

function replaceBoutique(s) {
  if (typeof s !== "string") return s;
  return s.replace(/\bBoutique\b/g, "Gioielleria").replace(/\bboutique\b/g, "gioielleria");
}

function normalizeWatchAttrs(p) {
  const raw = { ...(p.attributes || {}) };
  const next = {
    Movimento: raw.Movimento || raw.movement,
    Calibro: raw.Calibro || raw.caliber,
    "Materiale cassa": raw["Materiale cassa"] || raw.caseMaterial || raw.Cassa,
    "Diametro cassa": raw["Diametro cassa"] || raw.Diametro,
    "Spessore cassa": raw["Spessore cassa"],
    Vetro: raw.Vetro || raw.glass,
    Quadrante: raw.Quadrante,
    Cinturino: raw.Cinturino || raw.Bracciale || raw.strap,
    "Impermeabilità": raw["Impermeabilità"] || raw.waterResistance,
    Funzioni: raw.Funzioni,
    Collezione: raw.Collezione || raw.collection,
    Genere: raw.Genere || raw.gender,
    Colore: raw.Colore || raw.color,
    Referenza: p.sku,
  };
  for (const k of Object.keys(next)) {
    if (!next[k] || String(next[k]).trim() === "") delete next[k];
  }
  return next;
}

async function main() {
  const work = JSON.parse(fs.readFileSync(WORK_PATH, "utf8"));
  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, "utf8"));
  const missing = JSON.parse(fs.readFileSync(MISSING_PATH, "utf8"));

  const scrapedMap = new Map(scraped.map((x) => [x.sku, x]));
  const missingMap = new Map((missing.items || []).map((x) => [x.sku, x]));

  const audit = [];
  let verifiedCount = 0;
  let priceChangedCount = 0;
  let unverifiedCount = 0;

  for (const p of work) {
    const s = scrapedMap.get(p.sku);
    const m = missingMap.get(p.sku);
    const oldPrice = Number(p.price);

    let parsedPrice = cleanPrice(s?.official_list_price);
    let sourceUrl = s?.targetUrl || null;
    let notes = null;

    if (parsedPrice === null && m && m.status === "verified") {
      parsedPrice = cleanPrice(m.official_list_price);
      sourceUrl = m.sourceUrl || sourceUrl;
      notes = m.notes || null;
    }

    const finalPrice = parsedPrice !== null ? parsedPrice : oldPrice;
    const isVerified = parsedPrice !== null;

    if (isVerified) verifiedCount++;
    else unverifiedCount++;
    if (finalPrice !== oldPrice) priceChangedCount++;

    const nextAttrs = normalizeWatchAttrs(p);

    const patch = {
      price: finalPrice,
      compare_at_price: null,
      attributes: nextAttrs,
      updated_at: new Date().toISOString(),
    };
    if (typeof p.name === "string" && /boutique/i.test(p.name)) patch.name = replaceBoutique(p.name);
    if (typeof p.description === "string" && /boutique/i.test(p.description)) patch.description = replaceBoutique(p.description);

    const { error } = await sb.from("oroeco_products").update(patch).eq("id", p.id);
    if (error) throw error;

    audit.push({
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      status: isVerified ? "verified" : "unverified_out_of_catalog",
      oldPrice,
      newPrice: finalPrice,
      delta: Math.round((finalPrice - oldPrice) * 100) / 100,
      sourceUrl,
      notes,
      attributes: nextAttrs,
    });
  }

  const summary = {
    brand: "Bulova",
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("BULOVA ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
