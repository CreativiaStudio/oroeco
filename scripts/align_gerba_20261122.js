require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_gerba.json");
const SCRAPED_PATH = path.join(process.cwd(), "data/enrichment/gerba_scraped_20261122.json");
const MISSING_PATH = path.join(process.cwd(), "data/enrichment/gerba_missing_results_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_gerba.json");

function cleanPrice(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 3 || n > 25000) return null;
  return Math.round(n * 100) / 100;
}

function replaceBoutique(s) {
  if (typeof s !== "string") return s;
  return s.replace(/\bBoutique\b/g, "Gioielleria").replace(/\bboutique\b/g, "gioielleria");
}

function inferStonesFromText(txt) {
  const candidates = [
    ["Ossidiana", /ossidiana/i],
    ["Ematite", /ematite/i],
    ["Bronzite", /bronzite/i],
    ["Aulite", /aulite/i],
    ["Occhio di Tigre", /occhio di tigre/i],
    ["Agata", /agata/i],
    ["Sodalite", /sodalite/i],
    ["Labradorite", /labradorite/i],
    ["Onice", /onice/i],
    ["Turchese", /turchese/i],
    ["Lapislazzuli", /lapislazzuli/i],
    ["Diaspro", /diaspro/i],
    ["Malachite", /malachite/i],
    ["Quarzo", /quarzo/i],
    ["Ametista", /ametista/i],
    ["Corallo", /corallo/i],
    ["Perla", /perl[ae]/i],
    ["Murrine", /murrin[ae]/i],
    ["Pietra Lavica", /lavic[ao]/i],
    ["Ceramiche", /ceramic[ae]/i],
  ];
  const found = [];
  for (const [label, re] of candidates) {
    if (re.test(txt)) found.push(label);
  }
  return found;
}

function stripHtml(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const work = JSON.parse(fs.readFileSync(WORK_PATH, "utf8"));
  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, "utf8"));
  const missing = fs.existsSync(MISSING_PATH)
    ? JSON.parse(fs.readFileSync(MISSING_PATH, "utf8"))
    : { items: [] };

  const scrapedMap = new Map(scraped.map((x) => [x.id, x]));
  const missingMap = new Map((missing.items || []).map((x) => [x.id || x.sku, x]));

  const audit = [];
  let verifiedCount = 0;
  let priceChangedCount = 0;
  let unverifiedCount = 0;

  for (const p of work) {
    const s = scrapedMap.get(p.id);
    const m = missingMap.get(p.id) || missingMap.get(p.sku);
    const oldPrice = Number(p.price);

    let parsedPrice = s?.found ? cleanPrice(s.official_list_price) : null;
    let sourceUrl = s?.sourceUrl || null;
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

    const prev = { ...(p.attributes || {}) };
    delete prev.soloCassa;

    let nextAttrs;
    if (p.category === "accessori") {
      const dimMatch = p.name.match(/(\d+(?:[.,]\d+)?\s*[x×]\s*\d+(?:[.,]\d+)?(?:\s*[x×]\s*\d+(?:[.,]\d+)?)?\s*cm)/i);
      const mat =
        m?.material ||
        prev.Materiale ||
        prev.material ||
        "Pelle di vitello saffiano e dettagli in Argento 925";
      nextAttrs = {
        type: /pochette/i.test(p.name)
          ? "Pochette"
          : /porta\s*cart/i.test(p.name)
            ? "Porta carte di credito"
            : /portafogli/i.test(p.name)
              ? "Portafoglio"
              : "Pelletteria",
        Materiale: mat,
        material: mat,
        Dimensioni: m?.dimensions || prev.Dimensioni || prev.dimensions || (dimMatch ? dimMatch[1] : undefined),
        Collezione: m?.collection || prev.Collezione || prev.collection || "Pelletteria",
        Lavorazione: prev.Lavorazione || "Artigianale Made in Italy",
        Genere: prev.Genere || prev.gender || "Unisex",
        Colore: m?.color || prev.Colore || prev.color,
        origin: "Italia",
        Referenza: p.sku,
      };
    } else {
      const textPool = `${p.name} ${stripHtml(s?.body_html)}`;
      const stones =
        Array.isArray(m?.stones) && m.stones.length
          ? m.stones
          : inferStonesFromText(textPool);
      const metal = prev.metal || "Argento 925";
      const mat = prev.Materiale || prev.material || "Argento 925 e pietre naturali";
      nextAttrs = {
        metal,
        material: mat,
        Materiale: mat,
        Taglie: prev.Taglie || prev.size || "S/M 19 cm · M/L 21 cm",
        Lavorazione: prev.Lavorazione || "Artigianale Made in Italy",
        Collezione: m?.collection || prev.Collezione || prev.collection,
        Genere: prev.Genere || prev.gender || "Unisex",
        Colore: m?.color || prev.Colore || prev.color,
        origin: "Italia",
        Referenza: p.sku,
      };
      if (stones.length) nextAttrs.stones = stones;
    }

    for (const k of Object.keys(nextAttrs)) {
      if (nextAttrs[k] === undefined || nextAttrs[k] === null || nextAttrs[k] === "") {
        delete nextAttrs[k];
      }
    }

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
      sourceUrl,
      notes,
      attributes: nextAttrs,
    });
  }

  const summary = {
    brand: "Gerba",
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("GERBA ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
