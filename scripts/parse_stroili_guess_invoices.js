const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const ROOT = process.cwd();
const STROILI_DIR = path.join(ROOT, "Oroeco fatture", "TIMEWAY", "STROILI");
const GUESS_DIR = path.join(ROOT, "Oroeco fatture", "TIMEWAY", "GUESS");
const OUT_FILE = path.join(ROOT, "data", "enrichment", "stroili_guess_delta_20261120.json");

function parseEnv(envPath) {
  const raw = fs.readFileSync(envPath, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    out[k] = v;
  }
  return out;
}

function parseItNumber(str) {
  const s = String(str || "").trim();
  if (!s) return 0;
  // Gestisce sia "1.234,56" che "99,00"
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

async function readPdfText(filePath) {
  const parser = new PDFParse({ data: fs.readFileSync(filePath) });
  try {
    const res = await parser.getText();
    return res.text || "";
  } finally {
    if (typeof parser.destroy === "function") await parser.destroy();
  }
}

function inferCategoryAndSubcategory(desc, ref, isGuess) {
  const d = String(desc || "").toUpperCase();
  const r = String(ref || "").toUpperCase();

  const isWatch =
    /\b(STW|GUW|WATCH|OROL|CHRONO|2H|3H|AUTOMATIC|QUARTZ)\b/.test(d) ||
    (isGuess && /^(GW|W\d|V\d)/i.test(r));

  if (isWatch) {
    let sub = "donna";
    const mmMatch = d.match(/(\d{2}(?:[.,]\d+)?)\s*MM\b/);
    const mm = mmMatch ? parseItNumber(mmMatch[1]) : 0;
    if (/G\d*$/.test(r) || /\b(UOMO|MAN|MENS|MEN)\b/.test(d) || mm >= 38) {
      sub = "uomo";
    }
    return { category: "orologi", subcategory: sub };
  }

  if (/\bPORTAC\b/.test(d) && /\bPELLE\b/.test(d)) {
    return { category: "accessori", subcategory: "pelletteria" };
  }
  if (/\bPORTACHIAVI\b/.test(d)) {
    return { category: "accessori", subcategory: "portachiavi" };
  }

  let sub = "gioielli";
  if (/\b(COLL|GIROC|CATENA|COLLANA|CHOKER)\b/.test(d)) sub = "collane";
  else if (/\b(BRAC|BRACC|BRACCIALE|BANGLE)\b/.test(d)) sub = "bracciali";
  else if (/\b(OREC|ORECC|ORECCH|ORECCHINI|MONACH|LOBO)\b/.test(d)) sub = "orecchini";
  else if (/\b(ANEL|ANELLO|FED|FEDE|SOLIT|VERET)\b/.test(d)) sub = "anelli";
  else if (/\b(CIOND|PEND|PENDENTE|CHARM|CROCE|MEDAGL)\b/.test(d)) sub = "ciondoli";

  return { category: "gioielli", subcategory: sub };
}

function inferMaterialFlags(code, desc) {
  const c = String(code || "").trim();
  const d = String(desc || "").toUpperCase();
  const isGold =
    /^14\d{5}$/.test(c) ||
    /\b(OG|OB|OR|ORO|750|375|9KT|18KT|9K|18K)\b/.test(d);
  const isPearl = /\bPERL[AE]?\b/.test(d);
  const isDiamond = /\b(DIAM|BRILL)/.test(d);
  return { is_gold: isGold, is_pearl: isPearl, is_diamond: isDiamond };
}

function isPackagingOrHeaderLine(row) {
  if (/^(800|850|16805\d{2})/.test(row)) return true;
  // Codici packaging noti senza prezzo (es. "1514336 3 22")
  if (/^\d{7}\s+\d+\s+\d{2}$/.test(row)) return true;
  if (/Recupero spese|BOX |SHOPPER|GARANZIA|ASTUCCIO|ESPOSITORE|SACCHETTO|TRASP\./i.test(row)) {
    return true;
  }
  return false;
}

async function fetchAllSupabaseProducts(url, key) {
  let all = [];
  for (let offset = 0; offset < 5000; offset += 1000) {
    const res = await fetch(
      `${url}/rest/v1/oroeco_products?select=id,sku,barcode,name,brand_name,category,subcategory,approval_status,invoice_ref,stock_quantity,price,attributes&offset=${offset}&limit=1000`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) {
      throw new Error(`Supabase GET oroeco_products failed: ${res.status} ${await res.text()}`);
    }
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    all = all.concat(rows);
    if (rows.length < 1000) break;
  }
  return all;
}

(async () => {
  const env = parseEnv(path.join(ROOT, ".env.local"));
  const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!sbUrl || !sbKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const stroiliFiles = fs
    .readdirSync(STROILI_DIR)
    .filter((f) => /^FC26-I001-.*\.pdf$/i.test(f))
    .sort()
    .map((f) => ({ file: f, folder: "STROILI", fullPath: path.join(STROILI_DIR, f) }));

  const guessFiles = fs
    .readdirSync(GUESS_DIR)
    .filter((f) => /^FC26-I001-.*_guess\.pdf$/i.test(f))
    .sort()
    .map((f) => ({ file: f, folder: "GUESS", fullPath: path.join(GUESS_DIR, f) }));

  const allFiles = [...stroiliFiles, ...guessFiles];
  console.log(`Parsing ${allFiles.length} PDF (${stroiliFiles.length} Stroili + ${guessFiles.length} Guess)...`);

  const stroiliMap = new Map();
  const guessMap = new Map();
  const unmatchedPricedLines = [];
  const invoiceStats = [];

  const ITEM_RE =
    /^(\d{7})\s+(.+?)\s+([A-Z0-9][A-Z0-9._-]{4,18})\s+(\d{11,14})\s+(\d+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s+(\d+)/;

  for (const entry of allFiles) {
    const txt = await readPdfText(entry.fullPath);
    const invMatch = txt.match(/Fattura nr\.\s*\r?\n\s*([A-Z0-9-]+)/i);
    const invoiceNo = invMatch ? invMatch[1].trim() : entry.file.replace(/\.pdf$/i, "");
    const dateMatch =
      txt.match(/\bData\s*\r?\n\s*(\d{2}\/\d{2}\/\d{4})/i) ||
      txt.match(/DDT:[^\n]+Data:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const invoiceDate = dateMatch ? dateMatch[1] : null;

    const pages = txt.split(/--\s*\d+\s+of\s+\d+\s*--/);
    let rowsMatched = 0;

    for (const page of pages) {
      let body = page;
      for (const marker of [
        "Materiali di confezionamento inclusi nel prezzo:",
        "Aspetto dei beni",
        "Collection\t",
      ]) {
        const idx = body.indexOf(marker);
        if (idx !== -1) body = body.slice(0, idx);
      }

      const lines = body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const joined = [];
      for (const l of lines) {
        if (
          /^(Codice Descrizione|DDT:|Timeway|Strada|P\.IVA|Capitale|Tel\.|FATTURA|GIOIELLERIA|VIA\.|84010|SA$|Italia$|Luogo|Data$|Codice cliente|Termini|Metodo|Part\.|Fiscale|Nr\.|Imponibile|I\.V\.A\.|Totale|Esenzione|Annotazioni|ATTENZIONE|Pagina|Riepilogo|Scadenza|Importo|Firma)/i.test(
            l
          )
        ) {
          continue;
        }
        if (/^\d{7}\s+/.test(l)) {
          joined.push(l);
        } else if (
          joined.length > 0 &&
          !/^(SO\d|FC\d|0\d{2}-|C100|CLBSRN|02187|RESO|Ricevuta)/i.test(l)
        ) {
          joined[joined.length - 1] += " " + l;
        }
      }

      for (const row of joined) {
        if (isPackagingOrHeaderLine(row)) continue;
        const m = row.match(ITEM_RE);
        if (!m) {
          if (/,\d{2}\b/.test(row)) {
            unmatchedPricedLines.push({ file: entry.file, invoice_no: invoiceNo, row });
          }
          continue;
        }

        const [, code, rawDesc, rawRef, ean, rawQty, rawListino, rawDisc, rawNet, rawVat] = m;
        const desc = rawDesc.replace(/\s+/g, " ").trim();
        const ref = rawRef.toUpperCase().trim();
        const qty = Number.parseInt(rawQty, 10) || 1;
        const unitPriceListino = parseItNumber(rawListino);
        const discountPct = parseItNumber(rawDisc);
        const netTotal = parseItNumber(rawNet);
        const netCostUnit = qty > 0 ? Math.round((netTotal / qty) * 100) / 100 : netTotal;
        const vatRate = Number.parseInt(rawVat, 10) || 22;

        const isGuessItem =
          entry.folder === "GUESS" ||
          /^(GUW|GUESS|GUJ)\b/i.test(desc) ||
          /^(GW|JUB[A-Z0-9]|U[A-Z]{2}\d|W\d|V\d)/i.test(ref);

        const brand = isGuessItem ? "Guess" : "Stroili";
        const sku = isGuessItem ? ref : code;
        const targetMap = isGuessItem ? guessMap : stroiliMap;
        const catInfo = inferCategoryAndSubcategory(desc, ref, isGuessItem);
        const matFlags = inferMaterialFlags(code, desc);

        rowsMatched++;
        if (!targetMap.has(sku)) {
          targetMap.set(sku, {
            brand,
            sku,
            code,
            reference: ref,
            ean,
            description: desc,
            unit_price_listino: unitPriceListino,
            discount_pct: discountPct,
            net_cost: netCostUnit,
            vat_rate: vatRate,
            total_qty: qty,
            inferred_category: catInfo.category,
            inferred_subcategory: catInfo.subcategory,
            ...matFlags,
            online_eligible: true,
            invoices: [{ invoice_no: invoiceNo, date: invoiceDate, file: entry.file, qty }],
          });
        } else {
          const prev = targetMap.get(sku);
          prev.total_qty += qty;
          if (!prev.invoices.some((iv) => iv.invoice_no === invoiceNo)) {
            prev.invoices.push({ invoice_no: invoiceNo, date: invoiceDate, file: entry.file, qty });
          } else {
            const iv = prev.invoices.find((x) => x.invoice_no === invoiceNo);
            iv.qty += qty;
          }
          // Aggiorna con il listino più recente se disponibile
          if (unitPriceListino > 0) prev.unit_price_listino = unitPriceListino;
          if (netCostUnit > 0) prev.net_cost = netCostUnit;
        }
      }
    }

    invoiceStats.push({
      file: entry.file,
      folder: entry.folder,
      invoice_no: invoiceNo,
      date: invoiceDate,
      rows_matched: rowsMatched,
    });
  }

  // Confronto read-only con Supabase oroeco_products
  const dbRows = await fetchAllSupabaseProducts(sbUrl, sbKey);
  const bySku = new Map();
  const byBarcode = new Map();
  for (const r of dbRows) {
    const s = String(r.sku || "").trim().toUpperCase();
    if (s) bySku.set(s, r);
    const b = String(r.barcode || "").trim();
    if (b) byBarcode.set(b, r);
    const attrRef = String(r.attributes?.reference || r.attributes?.ref || "").trim().toUpperCase();
    if (attrRef && !bySku.has(attrRef)) bySku.set(attrRef, r);
  }

  const findDbMatch = (item) =>
    bySku.get(item.sku.toUpperCase()) ||
    bySku.get(item.reference.toUpperCase()) ||
    bySku.get(item.code.toUpperCase()) ||
    byBarcode.get(item.ean) ||
    null;

  const stroiliNewMissing = [];
  const stroiliExistingInDb = [];
  for (const item of stroiliMap.values()) {
    const match = findDbMatch(item);
    if (match) {
      stroiliExistingInDb.push({
        sku: item.sku,
        code: item.code,
        reference: item.reference,
        ean: item.ean,
        total_qty: item.total_qty,
        invoice_nos: item.invoices.map((x) => x.invoice_no),
        db_id: match.id,
        db_sku: match.sku,
        db_approval_status: match.approval_status,
        db_category: match.category,
        db_subcategory: match.subcategory,
        db_invoice_ref: match.invoice_ref,
      });
    } else {
      stroiliNewMissing.push(item);
    }
  }

  const guessNewMissing = [];
  const guessExistingInDb = [];
  for (const item of guessMap.values()) {
    const match = findDbMatch(item);
    if (match) {
      guessExistingInDb.push({
        sku: item.sku,
        code: item.code,
        reference: item.reference,
        ean: item.ean,
        total_qty: item.total_qty,
        invoice_nos: item.invoices.map((x) => x.invoice_no),
        db_id: match.id,
        db_sku: match.sku,
        db_approval_status: match.approval_status,
        db_category: match.category,
        db_subcategory: match.subcategory,
        db_invoice_ref: match.invoice_ref,
      });
    } else {
      guessNewMissing.push(item);
    }
  }

  const nihamaApprovedToOffline = dbRows
    .filter((r) => /nihama/i.test(r.brand_name || "") && r.approval_status === "approved")
    .map((r) => ({ id: r.id, sku: r.sku, name: r.name, category: r.category, subcategory: r.subcategory }));

  const breakdownByCat = (arr) => {
    const m = {};
    for (const x of arr) {
      const k = `${x.inferred_category}/${x.inferred_subcategory}`;
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  };

  const payload = {
    generated_at: new Date().toISOString(),
    source_invoices_count: allFiles.length,
    unmatched_priced_lines: unmatchedPricedLines,
    summary: {
      stroili_invoices_count: stroiliFiles.length,
      guess_invoices_count: guessFiles.length,
      stroili_unique_skus: stroiliMap.size,
      stroili_already_in_db: stroiliExistingInDb.length,
      stroili_new_missing: stroiliNewMissing.length,
      stroili_new_by_category: breakdownByCat(stroiliNewMissing),
      stroili_new_materials: {
        gold: stroiliNewMissing.filter((x) => x.is_gold).length,
        pearl: stroiliNewMissing.filter((x) => x.is_pearl).length,
        diamond: stroiliNewMissing.filter((x) => x.is_diamond).length,
        watches: stroiliNewMissing.filter((x) => x.inferred_category === "orologi").length,
      },
      guess_unique_skus: guessMap.size,
      guess_already_in_db: guessExistingInDb.length,
      guess_new_missing: guessNewMissing.length,
      db_total_products_checked: dbRows.length,
      nihama_currently_approved_to_move_offline: nihamaApprovedToOffline.length,
    },
    nihama_currently_approved: nihamaApprovedToOffline,
    invoices: invoiceStats,
    stroili_new_missing: stroiliNewMissing,
    stroili_existing_in_db: stroiliExistingInDb,
    guess_new_missing: guessNewMissing,
    guess_existing_in_db: guessExistingInDb,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), "utf8");

  console.log("=== SUMMARY ===");
  console.log(JSON.stringify(payload.summary, null, 2));
  console.log("unmatched_priced_lines:", unmatchedPricedLines.length);
  console.log("Saved to:", OUT_FILE);
})();
