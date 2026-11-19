const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

const ROOT = path.join(process.cwd(), "Oroeco fatture", "TIMEWAY");
const OUT = "C:\\Users\\mario\\.gemini\\antigravity\\brain\\af2d2ce4-7a99-485d-a8ad-968594a22598\\scratch\\guess_parsed_inventory.json";

async function readPdf(p) {
  const parser = new PDFParse({ data: fs.readFileSync(p) });
  try { return (await parser.getText()).text || ""; }
  finally { if (typeof parser.destroy === "function") await parser.destroy(); }
}

(async () => {
  // 1. Estrai tutte le fatture e note di credito Guess in TIMEWAY/
  const invMap = new Map(); // normalized desc -> { ean, desc, listPrice, netCost, qty, invoiceRefs }
  for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith(".pdf")).sort()) {
    const t = await readPdf(path.join(ROOT, f));
    if (!/\bguess\b|GUW\s|GW\d{4}/i.test(t)) continue;
    const isCredit = /TD04|nota di credito/i.test(t);
    const invM = t.match(/TD0[14][^\r\n]*?\)\s+([A-Z0-9-]+)\s+(\d{2}-\d{2}-\d{4})/);
    const invRef = invM ? `${invM[1]} (${invM[2]})` : f;

    const lines = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(\d{10,13})\s+(.+)$/);
      if (!m) continue;
      let desc = m[2];
      let j = i + 1;
      while (j < lines.length && !/^Dest\.Merci/i.test(lines[j]) && !/^\d+,\d{2}\s+[\d.,]+\s+PZ/i.test(lines[j])) {
        desc += " " + lines[j];
        j++;
      }
      if (!/GUW|GUESS|IMPRINT|SUGAR|FRONTIER/i.test(desc)) continue;
      let priceLine = "";
      for (let k = j; k < Math.min(lines.length, j + 5); k++) {
        if (/^\d+,\d{2}\s+[\d.,]+\s+PZ/i.test(lines[k])) { priceLine = lines[k]; break; }
      }
      const pm = priceLine.match(/^(\d+,\d{2})\s+([\d.,]+)\s+PZ\s+(-?[\d.,]+)?\s*(?:22,00|N2\.2)?\s*([\d.,]+)?/);
      const qty = pm ? parseFloat(pm[1].replace(",", ".")) : 1;
      const listPrice = pm ? parseFloat(pm[2].replace(/\./g, "").replace(",", ".")) : null;
      const netTotal = pm && pm[4] ? parseFloat(pm[4].replace(/\./g, "").replace(",", ".")) : null;
      const ean = m[1].replace(/^0+/, "").padStart(12, "0");

      const key = ean;
      const cur = invMap.get(key) || {
        ean,
        desc: desc.replace(/\s+/g, " ").trim(),
        listPrice,
        netCost: netTotal ? Number((netTotal / qty).toFixed(2)) : null,
        qty: 0,
        refs: [],
      };
      cur.qty += isCredit ? -qty : qty;
      cur.refs.push(`${isCredit ? "RESO " : ""}${invRef}`);
      invMap.set(key, cur);
    }
  }

  // 2. Estrai ordini 082-000840, 082-000849, 082-000908 (orologi) e 082-001103 (gioielli)
  const ordWatches = new Map();
  const ordJewels = new Map();

  for (const f of ["order_082-000840-20260310.pdf", "order_082-000849-20260315.pdf", "order_082-000908-20260630.pdf"]) {
    const t = await readPdf(path.join(ROOT, "GUESS", f));
    const lines = t.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    for (const line of lines) {
      // Cerca descrizioni orologi (GUW / GUESS / IMPRINT / FRONTIER / SUGAR)
      const cleaned = line.replace(/\t+/g, " | ");
      if (/(?:GUW|GUESS\s+(?:CONNOISSEUR|MELODY)|IMPRINT|FRONTIER|SUGAR)/i.test(cleaned)) {
        const parts = cleaned.split("|").map((s) => s.trim()).filter(Boolean);
        for (const p of parts) {
          const mm = p.match(/(?:^|\b)(\d{7})?\s*((?:GUW|GUESS|IMPRINT|FRONTIER|SUGAR).+?)(?:\s*-\s*(GW\w+))?$/i);
          if (mm) {
            const title = mm[2].replace(/\s+/g, " ").trim();
            const gw = mm[3] || null;
            const k = gw || title.toUpperCase();
            if (!ordWatches.has(k)) ordWatches.set(k, { timewayCode: mm[1] || null, gwCode: gw, desc: title, orderFile: f });
          }
        }
      }
    }
  }

  // Gioielli JUB* in order_082-001103-20260315.pdf
  const jText = await readPdf(path.join(ROOT, "GUESS", "order_082-001103-20260315.pdf"));
  const jSkus = [...new Set([...jText.matchAll(/\b(JUB[A-Z]\d{4,5}[A-Z0-9/]+)\b/g)].map((m) => m[1]))];

  const out = {
    invoiceWatches: [...invMap.values()],
    orderWatches: [...ordWatches.values()],
    orderJewelSkus: jSkus.sort(),
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8");
  console.log(`Invoice Watches (con EAN & Listino esatto): ${out.invoiceWatches.length}`);
  console.log(`Order Watches (unici da PDF ordine): ${out.orderWatches.length}`);
  console.log(`Order Jewel SKUs (JUB* da 082-001103): ${out.orderJewelSkus.length}`);
  console.log("\n--- Gioielli Guess JUB* ---");
  console.log(out.orderJewelSkus.join(", "));
})();
