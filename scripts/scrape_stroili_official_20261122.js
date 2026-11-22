require("./_loadEnv");
const fs = require("fs");
const path = require("path");

const WORK_PATH = path.join(process.cwd(), "data/enrichment/work_stroili.json");
const OUT_PATH = path.join(process.cwd(), "data/enrichment/stroili_scraped_20261122.json");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
};

function decodeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&#039;/g, "'")
    .replace(/&agrave;/gi, "à")
    .replace(/&egrave;/gi, "è")
    .replace(/&eacute;/gi, "é")
    .replace(/&igrave;/gi, "ì")
    .replace(/&ograve;/gi, "ò")
    .replace(/&ugrave;/gi, "ù")
    .replace(/&deg;/gi, "°")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchProductPage(sku) {
  const url = `https://www.stroilioro.com/it_IT/p/x/${encodeURIComponent(sku)}.html`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12000);
      const r = await fetch(url, { headers: HEADERS, redirect: "follow", signal: ctrl.signal });
      clearTimeout(t);
      if (r.status === 404) return { ok: false, status: 404, finalUrl: r.url };
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const html = await r.text();
      return { ok: true, status: r.status, finalUrl: r.url, html };
    } catch (e) {
      if (attempt === 2) return { ok: false, status: 0, error: e.message, finalUrl: url };
      await sleep(400 * (attempt + 1));
    }
  }
  return { ok: false, status: 0, finalUrl: url };
}

function parseStroiliHtml(html, sku, finalUrl) {
  // 1. Prices: ALWAYS prefer list price over sales price if list > 0!
  let listPrice = null;
  let salesPrice = null;
  let jsonLdPrice = null;

  const listMatch = html.match(/"list"\s*:\s*\{\s*"value"\s*:\s*([0-9.]+)/);
  if (listMatch) listPrice = Number(listMatch[1]);

  const salesMatch = html.match(/"sales"\s*:\s*\{\s*"value"\s*:\s*([0-9.]+)/);
  if (salesMatch) salesPrice = Number(salesMatch[1]);

  const ldBlocks = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of ldBlocks) {
    try {
      const obj = JSON.parse(b[1]);
      if (obj && obj["@type"] === "Product" && obj.offers) {
        const offer = Array.isArray(obj.offers) ? obj.offers[0] : obj.offers;
        if (offer && offer.price != null) jsonLdPrice = Number(offer.price);
      }
    } catch {}
  }

  // Pick full list price (never promotional discount)
  const candidates = [listPrice, salesPrice, jsonLdPrice].filter((n) => Number.isFinite(n) && n >= 3 && n <= 25000);
  const fullListPrice =
    Number.isFinite(listPrice) && listPrice >= 3 && listPrice <= 25000
      ? listPrice
      : candidates.length > 0
        ? Math.max(...candidates)
        : null;

  // 2. Attributes from product-attribute--attribut
  const rawAttrs = [];
  const seenPair = new Set();
  const attrRegex = /<div class="product-attribute--attribut">\s*<span class="label">([\s\S]*?)<\/span>\s*<span class="value">([\s\S]*?)<\/span>/gi;
  let m;
  while ((m = attrRegex.exec(html)) !== null) {
    const label = decodeHtml(m[1].replace(/<[^>]+>/g, ""));
    const value = decodeHtml(m[2].replace(/<[^>]+>/g, ""));
    if (!label || !value) continue;
    const key = `${label}:::${value}`;
    if (!seenPair.has(key)) {
      seenPair.add(key);
      rawAttrs.push([label, value]);
    }
  }

  // Also grab collection from JSON/GTM or breadcrumb if present
  const collMatch = html.match(/"collection"\s*:\s*"([^"]+)"/i);
  const collectionHint = collMatch ? decodeHtml(collMatch[1]) : null;

  return {
    found: true,
    sku,
    finalUrl,
    listPrice,
    salesPrice,
    jsonLdPrice,
    fullListPrice,
    collectionHint,
    rawAttrs,
  };
}

async function main() {
  const work = JSON.parse(fs.readFileSync(WORK_PATH, "utf8"));
  console.log(`Scraping ${work.length} Stroili SKUs from stroilioro.com...`);

  const results = new Array(work.length);
  let cursor = 0;
  let foundCount = 0;
  let notFoundCount = 0;
  const CONCURRENCY = 8;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= work.length) break;
      const p = work[idx];
      const res = await fetchProductPage(p.sku);
      if (res.ok && res.html) {
        const parsed = parseStroiliHtml(res.html, p.sku, res.finalUrl);
        results[idx] = { id: p.id, ...parsed };
        if (parsed.fullListPrice !== null) foundCount++;
        else notFoundCount++;
      } else {
        results[idx] = {
          id: p.id,
          sku: p.sku,
          found: false,
          status: res.status,
          error: res.error || null,
          finalUrl: res.finalUrl,
          fullListPrice: null,
          rawAttrs: [],
        };
        notFoundCount++;
      }
      if ((idx + 1) % 50 === 0 || idx === work.length - 1) {
        console.log(`Progress: ${idx + 1}/${work.length} | foundPrice:${foundCount} | missing:${notFoundCount}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  fs.writeFileSync(OUT_PATH, JSON.stringify({ total: work.length, foundCount, notFoundCount, items: results }, null, 2));
  console.log(`Saved ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
