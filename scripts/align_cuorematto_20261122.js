require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_cuorematto.json");
const RES_PATH = path.join(process.cwd(), "data/enrichment/cuorematto_results_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_cuorematto.json");

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
    delete prevAttrs.soloCassa;

    const mat = r?.material || prevAttrs.material || prevAttrs.Materiale || "Porcellana e Ceramica";
    const nextAttrs = {
      ...prevAttrs,
      material: mat,
      Materiale: mat,
      solidale: "Supporta il Centro Terapeutico dell'Antoniano di Bologna ONLUS",
      origin: prevAttrs.origin || "Italia",
      articleCode: p.sku,
    };

    const cleanVal = (v) =>
      typeof v === "string" && v.trim() && !/non specificat|non disponibil|n\/d|sconosciut/i.test(v)
        ? v.trim()
        : null;

    if (cleanVal(r?.type)) nextAttrs.type = cleanVal(r.type);
    if (cleanVal(r?.dimensions)) nextAttrs.dimensions = cleanVal(r.dimensions);
    if (cleanVal(r?.color)) nextAttrs.color = cleanVal(r.color);
    if (cleanVal(r?.collection)) nextAttrs.collection = cleanVal(r.collection);
    if (cleanVal(r?.occasion)) nextAttrs.occasion = cleanVal(r.occasion);

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
      sourceUrl: r?.sourceUrl || null,
      notes: r?.notes || null,
      attributes: nextAttrs,
    });
  }

  const summary = {
    brand: "Cuorematto",
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("CUOREMATTO ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
