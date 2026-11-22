require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_guess.json");
const RES_PATH = path.join(process.cwd(), "data/enrichment/guess_results_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_guess.json");

function cleanPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 3 || n > 25000) return null;
  return Math.round(n * 100) / 100;
}

function replaceBoutique(s) {
  if (typeof s !== "string") return s;
  return s.replace(/\bBoutique\b/g, "Gioielleria").replace(/\bboutique\b/g, "gioielleria");
}

function buildGuessAttrs(p, r) {
  const prev = { ...(p.attributes || {}) };
  delete prev.soloCassa;

  if (p.category === "orologi") {
    const next = {
      Movimento: r?.movement || prev.Movimento || prev.movement,
      "Materiale cassa": r?.caseMaterial || prev["Materiale cassa"] || prev.caseMaterial || prev.Cassa,
      "Diametro cassa": r?.caseDiameter || prev["Diametro cassa"] || prev.Diametro,
      Vetro: r?.glass || prev.Vetro || prev.glass,
      Quadrante: r?.dial || prev.Quadrante,
      Cinturino: r?.strap || prev.Cinturino || prev.Bracciale,
      "Impermeabilità": r?.waterResistance || prev["Impermeabilità"] || prev.waterResistance,
      Funzioni: r?.functions || prev.Funzioni,
      Collezione: r?.collection || prev.Collezione || prev.collection,
      Genere: r?.gender || prev.Genere || prev.gender,
      Colore: r?.color || prev.Colore || prev.color,
      Referenza: p.sku,
    };
    for (const k of Object.keys(next)) {
      if (!next[k] || String(next[k]).trim() === "") delete next[k];
    }
    return next;
  }

  if (p.category === "accessori") {
    const mat = r?.material || prev.Materiale || prev.material || "Acciaio";
    const next = {
      Materiale: mat,
      material: mat,
      Dimensioni: r?.dimensions || prev.Dimensioni || prev.dimensions,
      Collezione: r?.collection || prev.Collezione || prev.collection,
      Genere: r?.gender || prev.Genere || prev.gender,
      Colore: r?.color || prev.Colore || prev.color,
      Referenza: p.sku,
    };
    for (const k of Object.keys(next)) {
      if (!next[k] || String(next[k]).trim() === "") delete next[k];
    }
    return next;
  }

  // Gioielli
  const metal = r?.metal || prev.metal || "Acciaio";
  const next = {
    ...prev,
    metal,
    material: metal,
    Materiale: metal,
    Referenza: p.sku,
  };
  if (Array.isArray(r?.stones) && r.stones.length > 0) next.stones = r.stones;
  if (r?.size) next.size = r.size;
  if (r?.clasp) next.Chiusura = r.clasp;
  if (r?.collection) {
    next.collection = r.collection;
    next.Collezione = r.collection;
  }
  if (r?.gender) {
    next.gender = r.gender;
    next.Genere = r.gender;
  }
  if (r?.color) next.color = r.color;
  return next;
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

    const nextAttrs = buildGuessAttrs(p, r);

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
      category: p.category,
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
    brand: "Guess",
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("GUESS ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
