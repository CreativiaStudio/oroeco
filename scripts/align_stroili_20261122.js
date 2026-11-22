require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_stroili.json");
const SCRAPED_PATH = path.join(process.cwd(), "data/enrichment/stroili_scraped_20261122.json");
const AUDIT_PATH = path.join(process.cwd(), "data/enrichment/audit_20261122_stroili.json");

const MANUAL_VERIFIED = {
  "1691379": {
    price: 34.9,
    sourceUrl: "https://www.verregioielli.com/ (Man Code 1691379)",
    extraAttrs: {
      metal: "Acciaio",
      material: "Acciaio",
      Materiale: "Acciaio",
      stones: ["Labradorite"],
      size: "19+3 cm",
      Genere: "Uomo",
      Collezione: "Man Code",
    },
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

function toMap(rawAttrs) {
  const m = new Map();
  for (const [k, v] of rawAttrs || []) {
    if (!m.has(k)) m.set(k, []);
    const arr = m.get(k);
    if (!arr.includes(v)) arr.push(v);
  }
  return m;
}

function firstVal(m, ...keys) {
  for (const k of keys) {
    const arr = m.get(k);
    if (arr && arr.length) return arr[0];
  }
  return undefined;
}

function allVals(m, ...keys) {
  const out = [];
  for (const k of keys) {
    for (const v of m.get(k) || []) {
      if (!out.includes(v)) out.push(v);
    }
  }
  return out;
}

function buildStroiliAttrs(p, rawAttrs) {
  const prev = { ...(p.attributes || {}) };
  const m = toMap(rawAttrs);
  const collection = prev.collection || prev.Collezione || undefined;

  if (p.category === "orologi") {
    const next = {};
    const movement = firstVal(m, "Meccanismo") || prev.Movimento || prev.movement;
    const movType = firstVal(m, "Tipo di movimento");
    next.Movimento = movement && movType && !movement.toLowerCase().includes(movType.toLowerCase())
      ? `${movement} (${movType})`
      : movement;
    const caseMat = firstVal(m, "Materiale della cassa") || prev["Materiale cassa"] || prev.caseMaterial || prev.Cassa;
    const caseCol = firstVal(m, "Colore della cassa");
    next["Materiale cassa"] = caseMat && caseCol && !caseMat.toLowerCase().includes(caseCol.toLowerCase())
      ? `${caseMat} (${caseCol})`
      : caseMat;
    const diam = firstVal(m, "Dimensione Cassa (mm)");
    next["Diametro cassa"] = diam ? `${diam} mm` : (prev["Diametro cassa"] || prev.Diametro);
    const thick = firstVal(m, "Spessore della cassa (mm)");
    if (thick) next["Spessore cassa"] = `${thick} mm`;
    next.Vetro = firstVal(m, "Materiale del vetro") || prev.Vetro || prev.glass;
    const dialCol = firstVal(m, "Colore sfondo cassa");
    const disp = firstVal(m, "Display orario");
    next.Quadrante = dialCol && disp ? `${dialCol} (${disp})` : (dialCol || prev.Quadrante);
    const strapMat = firstVal(m, "Materiale del cinturino");
    const strapCol = firstVal(m, "Colore del cinturino");
    next.Cinturino = strapMat && strapCol ? `${strapMat} ${strapCol}` : (strapMat || prev.Cinturino || prev.Bracciale);
    next["Impermeabilità"] = firstVal(m, "Impermeabilità") || prev["Impermeabilità"] || prev.waterResistance;
    const fn = firstVal(m, "Datario o multifunzione");
    if (fn && !/solo tempo/i.test(fn)) next.Funzioni = fn;
    else if (prev.Funzioni) next.Funzioni = prev.Funzioni;
    next.Genere = firstVal(m, "Genere") || prev.Genere || prev.gender;
    if (collection) next.Collezione = collection;
    next.Referenza = firstVal(m, "Referenza fornitore") || prev.Referenza || p.sku;

    for (const k of Object.keys(next)) {
      if (!next[k]) delete next[k];
    }
    return next;
  }

  if (p.category === "accessori") {
    const next = {};
    const mats = allVals(m, "Materiale principale", "Materiale");
    const matStr = mats.length ? mats.join(" e ") : (prev.Materiale || prev.material);
    if (matStr) {
      next.Materiale = matStr;
      next.material = matStr;
    }
    const len = firstVal(m, "Lunghezza (cm)");
    if (len) next.Dimensioni = `${len} cm`;
    else if (prev.Dimensioni || prev.dimensions) next.Dimensioni = prev.Dimensioni || prev.dimensions;
    const cols = allVals(m, "Colore del materiale", "Colore");
    if (cols.length) next.Colore = cols.join(", ");
    next.Genere = firstVal(m, "Genere") || prev.Genere || prev.gender;
    if (collection) next.Collezione = collection;
    next.Referenza = p.sku;
    for (const k of Object.keys(next)) {
      if (!next[k]) delete next[k];
    }
    return next;
  }

  // Gioielli
  const next = { ...prev };
  delete next.soloCassa;

  const matMain = firstVal(m, "Materiale principale", "Materiale");
  const matColor = firstVal(m, "Colore del materiale");
  const fineness = firstVal(m, "Titolo metallo");

  if (matMain) {
    let metalStr = matMain;
    if (matColor && !/multicolor/i.test(matColor) && !metalStr.toLowerCase().includes(matColor.toLowerCase())) {
      if (matMain === "Oro" || matMain === "Argento") metalStr = `${matMain} ${matColor}`;
      else if (matColor !== "Bianco" && matColor !== "Grigio" && matColor !== "Silver") metalStr = `${matMain} ${matColor}`;
    }
    if (fineness) {
      if (fineness.includes("375")) {
        metalStr = `${metalStr} 375‰`;
        next.carats = "9 kt (375‰)";
      } else if (fineness.includes("750")) {
        metalStr = `${metalStr} 750‰`;
        next.carats = "18 kt (750‰)";
      } else if (fineness.includes("925")) {
        metalStr = metalStr.includes("925") ? metalStr : `${metalStr} 925`;
      }
    }
    next.metal = metalStr;
    next.material = matMain;
    next.Materiale = matMain;
  }

  const stonesRaw = allVals(m, "Tipologia di Pietra", "Pietra principale")
    .filter((s) => s && !/^senza pietra$/i.test(s));
  if (stonesRaw.length) next.stones = stonesRaw;

  const cut = firstVal(m, "Taglio della pietra o forma della perla");
  if (cut) next.cut = cut;

  const ct = firstVal(m, "Carati (ct)");
  if (ct) next.caratWeight = `${ct} ct`;

  const weight = firstVal(m, "Peso netto (gr)");
  if (weight) next.Peso = `${weight} g`;

  const taglia = firstVal(m, "Taglia");
  const lenMin = firstVal(m, "Lunghezza minima (cm)");
  const lenMax = firstVal(m, "Lunghezza (cm)");
  const diam = firstVal(m, "Diametro");
  if (taglia) next.size = `Misura ${taglia}`;
  else if (lenMin && lenMax && lenMin !== lenMax) next.size = `${lenMin} - ${lenMax} cm`;
  else if (lenMax && Number(lenMax) > 0) next.size = `${lenMax} cm`;
  else if (diam) next.size = `Ø ${diam} mm`;

  const clasp = firstVal(m, "Tipologia di Chiusura");
  if (clasp) next.Chiusura = clasp;

  const lav = allVals(m, "Tipologia catena", "Tipo di incastonatura", "Trattamento").slice(0, 2);
  if (lav.length) next.Lavorazione = lav.join(" · ");

  const gen = firstVal(m, "Genere");
  if (gen) next.Genere = gen;

  const col = firstVal(m, "Colore", "Colore del materiale");
  if (col) next.Colore = col;

  if (collection) next.collection = collection;
  next.Referenza = p.sku;

  return next;
}

async function main() {
  const work = JSON.parse(fs.readFileSync(WORK_PATH, "utf8"));
  const scraped = JSON.parse(fs.readFileSync(SCRAPED_PATH, "utf8"));
  const byId = new Map(scraped.items.map((x) => [x.id, x]));

  const audit = [];
  let verifiedCount = 0;
  let priceChangedCount = 0;
  let unverifiedCount = 0;

  for (const p of work) {
    const s = byId.get(p.id);
    const manual = MANUAL_VERIFIED[p.sku];
    const oldPrice = Number(p.price);

    let newPrice = null;
    let sourceUrl = null;
    let status = "unverified_out_of_catalog";

    if (s && s.fullListPrice !== null) {
      const cp = cleanPrice(s.fullListPrice);
      if (cp !== null) {
        newPrice = cp;
        sourceUrl = s.finalUrl;
        status = "verified";
      }
    } else if (manual) {
      newPrice = manual.price;
      sourceUrl = manual.sourceUrl;
      status = "verified";
    }

    const finalPrice = newPrice !== null ? newPrice : oldPrice;
    if (status === "verified") verifiedCount++;
    else unverifiedCount++;
    if (finalPrice !== oldPrice) priceChangedCount++;

    let nextAttrs = buildStroiliAttrs(p, s ? s.rawAttrs : []);
    if (manual?.extraAttrs) {
      nextAttrs = { ...nextAttrs, ...manual.extraAttrs };
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
      status,
      oldPrice,
      newPrice: finalPrice,
      delta: Math.round((finalPrice - oldPrice) * 100) / 100,
      sourceUrl,
      attributes: nextAttrs,
    });
  }

  const summary = {
    brand: "Stroili",
    totalApproved: work.length,
    verifiedCount,
    unverifiedCount,
    priceChangedCount,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(AUDIT_PATH, JSON.stringify({ summary, items: audit }, null, 2));
  console.log("STROILI ALIGN SUMMARY:", summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
