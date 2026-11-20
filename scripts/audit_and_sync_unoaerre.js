require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");
const { createClient } = require("@supabase/supabase-js");

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const UNOAERRE_BRAND_ID = "4fb9c86a-bd41-4dc9-8008-82e82dce3604";
const PDF_DIR = path.join(process.cwd(), "Oroeco fatture/UNOAERRE - URIGOLD");
const REPORT_PATH = path.join(process.cwd(), "data/enrichment/unoaerre_audit_20261120.json");

function slugify(str) {
  return (
    String(str || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function titleCase(str) {
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      if (["in", "con", "ed", "e", "da", "di", "a"].includes(w)) return w;
      if (w === "1ar") return "1AR";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function parseStoneAndColor(name) {
  const stones = [];
  if (/ossidiana/i.test(name)) stones.push("Ossidiana");
  if (/diaspro/i.test(name)) stones.push("Diaspro");
  if (/ematite/i.test(name)) stones.push("Ematite");
  if (/perla nera/i.test(name)) stones.push("Perla Nera Naturale");
  if (/agata/i.test(name)) stones.push("Agata");
  if (/sodalite/i.test(name)) stones.push("Sodalite Blu");
  if (/malachite/i.test(name)) stones.push("Malachite");
  if (/occhio di tigre/i.test(name)) stones.push("Occhio di Tigre");
  return stones;
}

function buildAeternumDescription(p, stones) {
  const itemLabel = p.subcategory === "collane" ? "Collana" : "Bracciale";
  const cleanTitle = p.name.replace(/^Unoaerre\s+—\s+/i, "");
  const stonePhrase = stones.length ? ` impreziosito da ${stones.join(" e ")}` : "";
  return `${cleanTitle} della Maison Unoaerre (Cod. ${p.sku} · EAN ${p.barcode || p.sku}), ${itemLabel.toLowerCase()} da uomo della collezione Aeternum realizzato in acciaio inossidabile 316L ipoallergenico${stonePhrase}. Manifattura orafa aretina (1AR), consegnato con astuccio originale e garanzia ufficiale Unoaerre ORO&CO.`;
}

function inferMissingUnoaerreMetadata(item) {
  const desc = item.desc.replace(/\s+\d+,\d{2}\s+\d+,\d{2}\s+PZ.*$/i, "").replace(/\bUNOAERRE\b/gi, "").replace(/\s+/g, " ").trim();
  const dUp = desc.toUpperCase();

  let subcategory = "bracciali";
  let subcategory_label = "Bracciali";
  if (/^ANELLO/.test(dUp)) {
    subcategory = "anelli";
    subcategory_label = "Anelli";
  } else if (/^COLLANA|^FUNETTA/.test(dUp)) {
    subcategory = "collane";
    subcategory_label = "Collane";
  } else if (/^ORECCHIN/.test(dUp)) {
    subcategory = "orecchini";
    subcategory_label = "Orecchini";
  } else if (/^CROCE|^GEMELL|^SPILLA/.test(dUp)) {
    subcategory = "ciondoli";
    subcategory_label = "Ciondoli e Componenti";
  } else if (/^BRACCIAL|^TENNIS/.test(dUp)) {
    subcategory = "bracciali";
    subcategory_label = "Bracciali";
  }

  let metal = "Bronzo Bagno Oro";
  let material = "Bronzo";
  if (/9\s*CARATI/.test(dUp) || item.sku.startsWith("M")) {
    metal = "Oro giallo 9 kt (375‰)";
    material = "Oro 375‰";
  } else if (/ARGENTO/.test(dUp)) {
    metal = /GIALL/i.test(dUp) ? "Argento 925 placcato oro" : "Argento 925 rodiato";
    material = "Argento 925‰";
  } else if (/ACCIAIO/.test(dUp)) {
    metal = "Acciaio inossidabile 316L";
    material = "Acciaio 316L";
  } else if (/BRONZO/.test(dUp)) {
    metal = /BIANC/i.test(dUp) ? "Bronzo Argentato" : "Bronzo Bagno Oro";
    material = "Bronzo";
  }

  let collection = "Classica";
  if (/TUBOGAS/.test(dUp)) collection = "Tubogas";
  else if (/LUXURY/.test(dUp)) collection = "Luxury";
  else if (/CHICCO/.test(dUp)) collection = "Chicco";
  else if (/ACCIAIO/.test(dUp) && item.sku.startsWith("F043")) collection = "Aeternum";

  const isUomo = /^GEMELL/.test(dUp) || /F04304/i.test(item.sku);
  const gender = isUomo ? "Uomo" : "Donna";

  let cleanName = titleCase(desc);
  if (/^TENNIS/i.test(desc)) cleanName = `Bracciale ${cleanName}`;
  const fullName = `Unoaerre — ${cleanName} (Ref. ${item.sku})`;

  const attrs = {
    metal,
    material,
    Materiale: material,
    collection,
    Collezione: collection,
    Referenza: item.sku,
    gender,
    Genere: gender,
    origin: "Arezzo, Italia (1AR)",
  };
  if (/TENNIS/i.test(dUp)) {
    attrs.stones = ["Cubic Zirconia"];
  }

  return {
    name: fullName,
    subcategory,
    subcategory_label,
    attributes: attrs,
    short_description: `${cleanName} · Unoaerre originale (Solo Cassa in attesa foto B2B).`,
    description: `Creazione originale Unoaerre collezione ${collection} (Cod. ${item.sku}), realizzata ad Arezzo (1AR) in ${metal}. Articolo da fattura URIGOLD S.r.l., attualmente gestito in Solo Cassa in attesa delle immagini ufficiali dal catalogo B2B Unoaerre.`,
    tags: ["unoaerre", "gioielli", subcategory, collection.toLowerCase(), isUomo ? "uomo" : "donna", ...( /^GEMELL/.test(dUp) ? ["gemelli"] : [] )],
  };
}

async function main() {
  const allRows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error: fetchErr } = await sb
      .from("oroeco_products")
      .select("*")
      .range(from, from + 999);
    if (fetchErr) throw fetchErr;
    allRows.push(...data);
    if (data.length < 1000) break;
  }

  const existingSlugs = new Set(allRows.map((r) => r.slug));
  const unoRows = allRows.filter((r) => r.brand_id === UNOAERRE_BRAND_ID);
  const unoBySku = new Map(unoRows.map((r) => [String(r.sku).toUpperCase(), r]));

  // 1. Fix 20 approved Aeternum Uomo Acciaio 316L products
  const aeternumTargets = unoRows.filter(
    (r) =>
      r.approval_status === "approved" &&
      (/^F043/i.test(r.sku) || /aeternum/i.test(r.name))
  );
  const fixedAeternum = [];
  for (const p of aeternumTargets) {
    const stones = parseStoneAndColor(p.name);
    const updatedAttrs = {
      ...(p.attributes || {}),
      metal: "Acciaio inossidabile 316L",
      material: "Acciaio 316L",
      Materiale: "Acciaio 316L",
      collection: "Aeternum",
      Collezione: "Aeternum",
      gender: "Uomo",
      Genere: "Uomo",
      origin: "Arezzo, Italia (1AR)",
      ...(stones.length ? { stones } : {}),
    };
    const updatedDesc = buildAeternumDescription(p, stones);
    const newTags = Array.from(
      new Set([...(Array.isArray(p.tags) ? p.tags : []), "unoaerre", "uomo", "aeternum", "acciaio"])
    );
    const { error } = await sb
      .from("oroeco_products")
      .update({
        attributes: updatedAttrs,
        description: updatedDesc,
        tags: newTags,
      })
      .eq("id", p.id);
    if (error) throw error;
    fixedAeternum.push(p.sku);
  }

  // 2. Parse the 10 Urigold PDFs & insert missing SKUs in Solo Cassa (rejected, images: [])
  const files = fs.readdirSync(PDF_DIR).filter((f) => f.endsWith(".pdf"));
  const pdfSkus = new Map();
  for (const f of files) {
    const buf = fs.readFileSync(path.join(PDF_DIR, f));
    const parser = new PDFParse({ data: buf });
    const res = await parser.getText();
    await parser.destroy();
    const lines = (res.text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^([FM]\d{4,6}(?:-\d+)?)\s+(.+)$/);
      if (m) {
        const sku = m[1].toUpperCase();
        const desc = m[2];
        const win = lines.slice(i, i + 4).join(" ");
        const pm = win.match(/(\d+,\d{2})\s+(\d+,\d{2})\s+PZ/);
        const price = pm ? parseFloat(pm[2].replace(",", ".")) : 0;
        if (!pdfSkus.has(sku)) {
          pdfSkus.set(sku, { sku, desc, price, files: [f] });
        } else {
          pdfSkus.get(sku).files.push(f);
        }
      }
    }
  }

  const insertedMissing = [];
  const skippedExisting = [];
  for (const [sku, item] of pdfSkus.entries()) {
    if (unoBySku.has(sku)) {
      skippedExisting.push(sku);
      continue;
    }
    const meta = inferMissingUnoaerreMetadata(item);
    let slug = `unoaerre-${slugify(meta.name.replace(/^Unoaerre\s+—\s+/i, "").slice(0, 50))}-${sku.toLowerCase()}`;
    let c = 2;
    while (existingSlugs.has(slug)) {
      slug = `unoaerre-${slugify(meta.name.slice(0, 45))}-${sku.toLowerCase()}-${c++}`;
    }
    existingSlugs.add(slug);

    const price = item.price || 0;
    const cost = price > 0 ? Number((price * 0.5).toFixed(2)) : null;

    const { error } = await sb.from("oroeco_products").insert({
      slug,
      name: meta.name,
      brand_id: UNOAERRE_BRAND_ID,
      brand_name: "Unoaerre",
      category: "gioielli",
      subcategory: meta.subcategory,
      subcategory_label: meta.subcategory_label,
      price,
      compare_at_price: null,
      vat_rate: 22,
      stock_quantity: 1,
      in_stock: true,
      barcode: sku,
      sku,
      short_description: meta.short_description,
      description: meta.description,
      images: [],
      attributes: meta.attributes,
      tags: meta.tags,
      is_featured: false,
      is_new: false,
      is_christmas: false,
      supplier_cost: cost,
      markup_multiplier: cost && cost > 0 && price > 0 ? 2 : null,
      approval_status: "rejected", // Brand Vault: Solo Cassa fino a foto ufficiali B2B Unoaerre
      supplier_name: "URIGOLD SRL",
      invoice_ref: item.files.join(", "),
    });
    if (error) throw error;
    insertedMissing.push({ sku, name: meta.name, price, gender: meta.attributes.Genere, metal: meta.attributes.metal });
  }

  // Final Unoaerre DB counts
  const { data: finalUno } = await sb
    .from("oroeco_products")
    .select("sku,approval_status,attributes")
    .eq("brand_id", UNOAERRE_BRAND_ID);

  const report = {
    generated_at: new Date().toISOString(),
    pdf_files_parsed: files.length,
    pdf_unique_skus: pdfSkus.size,
    aeternum_uomo_fixed: fixedAeternum,
    missing_skus_inserted_solo_cassa: insertedMissing.length,
    inserted_details: insertedMissing,
    final_db_unoaerre_total: finalUno.length,
    final_db_unoaerre_approved: finalUno.filter((x) => x.approval_status === "approved").length,
    final_db_unoaerre_rejected: finalUno.filter((x) => x.approval_status !== "approved").length,
    final_db_unoaerre_uomo_approved: finalUno.filter(
      (x) =>
        x.approval_status === "approved" &&
        String(x.attributes?.gender || x.attributes?.Genere || "").toLowerCase() === "uomo"
    ).length,
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log("UNOAERRE AUDIT COMPLETE:", JSON.stringify({ ...report, inserted_details: `[${insertedMissing.length} items]` }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
