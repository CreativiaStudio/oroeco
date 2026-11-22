require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_villeroy.json");
const RES_PATH = path.join(process.cwd(), "data/enrichment/villeroy_results_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_villeroy.json");

function cleanPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 3 || n > 25000) return null;
  return Math.round(n * 100) / 100;
}

function replaceBoutique(s) {
  if (typeof s !== "string") return s;
  return s.replace(/\bBoutique\b/g, "Gioielleria").replace(/\bboutique\b/g, "gioielleria");
}

async function main() {
  const work = JSON.parse(fs.readFileSync(WORK_PATH, "utf8"));
  const resRaw = JSON.parse(fs.readFileSync(RES_PATH, "utf8"));
  const byId = new Map();
  const bySku = new Map();
  for (const item of resRaw.items || []) {
    if (item.id) byId.set(item.id, item);
    if (item.sku) bySku.set(item.sku, item);
  }

  const audit = [];
  let verifiedCount = 0;
  let priceChangedCount = 0;
  let unverifiedCount = 0;

  for (const p of work) {
    const r = byId.get(p.id) || bySku.get(p.sku);
    const oldPrice = Number(p.price);
    const parsedPrice = r && r.status === "verified" ? cleanPrice(r.official_list_price) : null;
    const finalPrice = parsedPrice !== null ? parsedPrice : oldPrice;
    const isVerified = parsedPrice !== null;

    if (isVerified) verifiedCount++;
    else unverifiedCount++;
    if (finalPrice !== oldPrice) priceChangedCount++;

    const prevAttrs = { ...(p.attributes || {}) };
    delete prevAttrs.metal;

    const realMat =
      r && r.material && !/Decorazioni Natalizie/i.test(r.material)
        ? r.material
        : prevAttrs.material && !/Decorazioni Natalizie/i.test(prevAttrs.material)
          ? prevAttrs.material
          : "Porcellana Premium";

    const nextAttrs = {
      ...prevAttrs,
      origin: "Mettlach (Germania)",
      articleCode: p.sku,
      material: realMat,
      Materiale: realMat,
    };

    if (r?.type) nextAttrs.type = r.type;
    if (r?.collection) nextAttrs.collection = r.collection;
    if (r?.dimensions) nextAttrs.dimensions = r.dimensions;
    if (r?.capacity) nextAttrs.capacity = r.capacity;
    if (r?.color) nextAttrs.color = r.color;
    if (typeof r?.dishwasherSafe === "boolean") nextAttrs.dishwasherSafe = r.dishwasherSafe;
    if (typeof r?.microwaveSafe === "boolean") nextAttrs.microwaveSafe = r.microwaveSafe;

    const patch = {
      price: finalPrice,
      compare_at_price: null,
      attributes: nextAttrs,
      updated_at: new Date().toISOString(),
    };
    if (typeof p.description === "string" && /boutique/i.test(p.description)) {
      patch.description = replaceBoutique(p.description);
    }
    if (typeof p.name === "string" && /boutique/i.test(p.name)) {
      patch.name = replaceBoutique(p.name);
    }

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
      sourceUrl: r?.sourceUrl || null,
      notes: r?.notes || null,
      attributes: nextAttrs,
    });
  }

  const summary = {
    brand: "Villeroy & Boch",
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("VILLEROY ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
