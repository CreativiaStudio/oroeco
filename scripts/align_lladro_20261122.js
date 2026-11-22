require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BRAND = "Lladró";
const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_lladro.json");
const RES_PATH = path.join(process.cwd(), "data/enrichment/small3_results_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_lladro.json");

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
  const items = (resRaw.by_brand && resRaw.by_brand[BRAND]) || [];
  const byId = new Map(items.map((x) => [x.id, x]));
  const bySku = new Map(items.map((x) => [x.sku, x]));

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

    const nextAttrs = {
      ...(p.attributes || {}),
      ...(r?.attributes_patch || {}),
      Origine: "Valencia, Spagna",
      origin: "Valencia, Spagna",
      articleCode: p.sku,
    };
    delete nextAttrs.metal;
    delete nextAttrs.soloCassa;

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
    brand: BRAND,
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("LLADRO ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
