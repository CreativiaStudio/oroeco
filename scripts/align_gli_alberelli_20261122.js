require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_gli_alberelli.json");
const SCRAPED_PATH = path.join(process.cwd(), "data/enrichment/gli_alberelli_scraped_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_gli_alberelli.json");

const MANUAL_VERIFIED = {
  AL1LFV: {
    price: 26.5,
    sourceUrl: "https://www.bonbonstore.it/ (Alberello Allegro Limoni e Fiori Decoro Positano AL1LFV)",
    notes: "Articolo 404 su glialberelli.it; prezzo pieno rilevato su rivenditori ufficiali (23-27 €; allineato a 26,50 € come gli altri Alberelli Allegro Mignon).",
  },
};

function cleanPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 3 || n > 25000) return null;
  return Math.round(n * 100) / 100;
}

function replaceBoutique(s) {
  if (typeof s !== "string") return s;
  return s.replace(/\bBoutique\b/g, "Gioielleria").replace(/\bboutique\b/g, "gioielleria");
}

function inferTipologia(name) {
  const n = name.toLowerCase();
  if (/profumatore|profumina|profumotta/.test(n)) return "Profumatore d'ambiente";
  if (/corno/.test(n)) return "Corno portafortuna";
  if (/lampada/.test(n)) return "Lampada da tavolo";
  if (/alberello/.test(n)) return "Alberello decorativo";
  if (/pianta|piantina/.test(n)) return "Pianta decorativa in porcellana";
  if (/scatola|contenitore/.test(n)) return "Scatola contenitore";
  if (/svuotatasche|centrotavola|piatto/.test(n)) return "Complemento d'arredo";
  return "Scultura in porcellana";
}

function inferColore(name) {
  const matches = [];
  const colors = [
    ["Bianco", /\bbianc[oa]\b/i],
    ["Nero", /\bner[oa]\b/i],
    ["Rosso", /\bross[oa]\b/i],
    ["Verde", /\bverd[ei]\b/i],
    ["Blu", /\bbl[uù]\b/i],
    ["Celeste", /\bcelest[ei]\b/i],
    ["Giallo", /\bgiall[oa]\b/i],
    ["Rosa", /\bros[ae]\b/i],
    ["Lilla", /\blilla\b/i],
    ["Indaco", /\bindaco\b/i],
    ["Arancio", /\baranci[oa]\b/i],
    ["Oro", /\bor[oa]\b|\bdorat[oa]\b/i],
    ["Argento", /\bargent[oa]\b/i],
    ["Turchese", /\bturchese\b/i],
  ];
  for (const [label, re] of colors) {
    if (re.test(name)) matches.push(label);
  }
  if (/limon[ei]/i.test(name) && !matches.includes("Giallo")) matches.push("Giallo Limone");
  if (/aranc[ei]/i.test(name) && !matches.includes("Arancio")) matches.push("Arancio");
  if (/peperoncin/i.test(name) && !matches.includes("Rosso")) matches.push("Rosso");
  if (/positano/i.test(name) && matches.length === 0) matches.push("Multicolore Decoro Positano");
  return matches.length ? matches.join(", ") : "Multicolore";
}

function inferDimensioni(name, dimFromVar) {
  if (dimFromVar) {
    const cleaned = dimFromVar.replace(/^(Piccola|Media|Grande)\s*-\s*/i, "").trim();
    if (cleaned) return `${cleaned} cm`;
  }
  const m1 = name.match(/\(([^)]*(?:cm|ø|h\s*\d)[^)]*)\)/i);
  if (m1) return m1[1].trim();
  const m2 = name.match(/[–—-]\s*(ø\s*\d+[\s\S]*)$/i);
  if (m2) return `${m2[1].trim()} cm`;
  const m3 = name.match(/(\d+\s*[×x]\s*\d+(?:\s*[×x]\s*\d+)?\s*cm|\bcm\s*\d+)/i);
  if (m3) return m3[1].trim();
  return undefined;
}

function inferCollection(name) {
  if (/positano/i.test(name)) return "Decoro Positano";
  if (/allegro/i.test(name)) return "Alberelli Allegri";
  if (/piant[ae]\s+natura|piantina/i.test(name)) return "Piante Natura";
  if (/profumina|profumotta|profumatore/i.test(name)) return "Profumatori d'Ambiente";
  if (/corno/i.test(name)) return "Corni Portafortuna";
  return "Capodimonte";
}

async function main() {
  const work = JSON.parse(fs.readFileSync(WORK_PATH, "utf8"));
  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, "utf8"));
  const byId = new Map(scraped.map((x) => [x.id, x]));

  const audit = [];
  let verifiedCount = 0;
  let priceChangedCount = 0;
  let unverifiedCount = 0;

  for (const p of work) {
    const s = byId.get(p.id);
    const manual = MANUAL_VERIFIED[p.sku];
    const oldPrice = Number(p.price);

    let parsedPrice = cleanPrice(s?.official_list_price);
    let sourceUrl = s?.url || null;
    let notes = null;

    if (parsedPrice === null && manual) {
      parsedPrice = manual.price;
      sourceUrl = manual.sourceUrl;
      notes = manual.notes;
    }

    const finalPrice = parsedPrice !== null ? parsedPrice : oldPrice;
    const isVerified = parsedPrice !== null;

    if (isVerified) verifiedCount++;
    else unverifiedCount++;
    if (finalPrice !== oldPrice) priceChangedCount++;

    const prevAttrs = { ...(p.attributes || {}) };
    delete prevAttrs.metal;
    delete prevAttrs.soloCassa;

    const mat = /ceramica/i.test(p.name)
      ? "Ceramica artistica di Capodimonte"
      : "Porcellana artistica di Capodimonte";
    const dims = inferDimensioni(p.name, s?.dimFromVar) || prevAttrs.dimensions || prevAttrs.Dimensioni;

    const nextAttrs = {
      type: inferTipologia(p.name),
      material: mat,
      Materiale: mat,
      collection: inferCollection(p.name),
      finish: "Lavorata e dipinta a mano",
      color: inferColore(p.name),
      origin: "Capodimonte, Napoli (Italia)",
      articleCode: p.sku,
    };
    if (dims) nextAttrs.dimensions = dims;

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
    brand: "Gli Alberelli",
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("GLI ALBERELLI ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
