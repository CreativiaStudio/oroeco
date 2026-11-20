require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");

const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const s3 = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STROILI_BRAND_ID = "1e4ae80c-f9f5-4f14-a0c0-a9b1132abcde";
const DELTA_PATH = path.join(process.cwd(), "data/enrichment/stroili_guess_delta_20261120.json");
const REPORT_PATH = path.join(process.cwd(), "data/enrichment/stroili_import_report_20261120.json");

const CONCURRENCY = 4;
const CANVAS_SIZE = 1000;
const TARGET_AREA = 340000;
const MIN_OPTICAL_SIDE = 640;
const MAX_OPTICAL_SIDE = 820;
const MAX_UPSCALE_V4 = 4.25;
const CORE_TRIM_THRESHOLD = 22;
const EDGE_FEATHER_PX = 48;
const ORIG_EDGE_FEATHER_PX = 28;

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchTextRetry(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, { headers: HEADERS, redirect: "follow" });
      if (r.status === 404) return { ok: false, status: 404, text: "" };
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return { ok: true, status: r.status, text: await r.text(), finalUrl: r.url };
    } catch (e) {
      if (attempt === 2) return { ok: false, status: 0, text: "", error: e.message };
      await sleep(400 * (attempt + 1));
    }
  }
  return { ok: false, status: 0, text: "" };
}

async function fetchImageRetry(url) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        headers: {
          "User-Agent": HEADERS["User-Agent"],
          Accept: "image/webp,image/png,image/jpeg,*/*;q=0.8",
        },
        redirect: "follow",
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const ct = r.headers.get("content-type") || "";
      if (/text\/html/i.test(ct)) throw new Error("HTML instead of image");
      const buf = Buffer.from(await r.arrayBuffer());
      if (buf.length < 3000) throw new Error(`Too small: ${buf.length}B`);
      return { buf, contentType: ct.split(";")[0].trim() || "image/jpeg" };
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await sleep(300 * (attempt + 1));
    }
  }
  throw lastErr;
}

function computeOpticalTarget(tw, th) {
  const safeW = Math.max(1, tw);
  const safeH = Math.max(1, th);
  const r = Math.max(safeW / safeH, safeH / safeW);
  return Math.max(
    MIN_OPTICAL_SIDE,
    Math.min(MAX_OPTICAL_SIDE, Math.round(Math.sqrt(TARGET_AREA * r)))
  );
}

function sampleCorner3x3(data, width, height, cx, cy) {
  let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = Math.min(width - 1, Math.max(0, cx + dx));
      const y = Math.min(height - 1, Math.max(0, cy + dy));
      const idx = (y * width + x) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      aSum += data[idx + 3];
      count++;
    }
  }
  return { r: rSum / count, g: gSum / count, b: bSum / count, a: aSum / count };
}

async function analyzeCorners(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  if (width < 10 || height < 10) {
    return { width, height, hasAlphaCorners: false, cornerMinRGB: 255, avg: { r: 255, g: 255, b: 255 } };
  }
  const pts = [
    sampleCorner3x3(data, width, height, 2, 2),
    sampleCorner3x3(data, width, height, width - 3, 2),
    sampleCorner3x3(data, width, height, 2, height - 3),
    sampleCorner3x3(data, width, height, width - 3, height - 3),
  ];
  const hasAlphaCorners = pts.some((p) => p.a < 20);
  const opaquePts = pts.filter((p) => p.a >= 20);
  if (!opaquePts.length) {
    return { width, height, hasAlphaCorners: true, cornerMinRGB: 255, avg: { r: 255, g: 255, b: 255 } };
  }
  const rs = opaquePts.map((p) => p.r);
  const gs = opaquePts.map((p) => p.g);
  const bs = opaquePts.map((p) => p.b);
  return {
    width,
    height,
    hasAlphaCorners,
    cornerMinRGB: Math.min(...rs, ...gs, ...bs),
    avg: {
      r: Math.round(rs.reduce((a, b) => a + b, 0) / rs.length),
      g: Math.round(gs.reduce((a, b) => a + b, 0) / gs.length),
      b: Math.round(bs.reduce((a, b) => a + b, 0) / bs.length),
    },
  };
}

function getBackgroundColor(corners) {
  return corners.hasAlphaCorners || corners.cornerMinRGB >= 248
    ? { r: 255, g: 255, b: 255, alpha: 1 }
    : { r: corners.avg.r, g: corners.avg.g, b: corners.avg.b, alpha: 1 };
}

async function shadowSafeNormalizeFromOriginal(origBuf, corners) {
  const bg = getBackgroundColor(corners);
  const flatRaw = await sharp(origBuf)
    .flatten({ background: bg })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const origW = flatRaw.info.width;
  const origH = flatRaw.info.height;
  const data = Buffer.from(flatRaw.data);

  let minTop = 255, minBot = 255, minLeft = 255, minRight = 255;
  for (let x = 0; x < origW; x++) {
    const iT = x * 4;
    const iB = ((origH - 1) * origW + x) * 4;
    minTop = Math.min(minTop, data[iT], data[iT + 1], data[iT + 2]);
    minBot = Math.min(minBot, data[iB], data[iB + 1], data[iB + 2]);
  }
  for (let y = 0; y < origH; y++) {
    const iL = y * origW * 4;
    const iR = (y * origW + (origW - 1)) * 4;
    minLeft = Math.min(minLeft, data[iL], data[iL + 1], data[iL + 2]);
    minRight = Math.min(minRight, data[iR], data[iR + 1], data[iR + 2]);
  }

  const featherTop = 140 < minTop && minTop < 250;
  const featherBot = 140 < minBot && minBot < 250;
  const featherLeft = 140 < minLeft && minLeft < 250;
  const featherRight = 140 < minRight && minRight < 250;

  if (featherTop || featherBot || featherLeft || featherRight) {
    for (let y = 0; y < origH; y++) {
      const inTop = featherTop && y < ORIG_EDGE_FEATHER_PX;
      const inBot = featherBot && origH - 1 - y < ORIG_EDGE_FEATHER_PX;
      for (let x = 0; x < origW; x++) {
        const inLeft = featherLeft && x < ORIG_EDGE_FEATHER_PX;
        const inRight = featherRight && origW - 1 - x < ORIG_EDGE_FEATHER_PX;
        if (!inTop && !inBot && !inLeft && !inRight) continue;
        let s = 1;
        if (inTop) { const t = y / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        if (inBot) { const t = (origH - 1 - y) / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        if (inLeft) { const t = x / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        if (inRight) { const t = (origW - 1 - x) / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        const i = (y * origW + x) * 4;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (s < 1 && Math.min(r, g, b) >= 140) {
          data[i] = Math.round(bg.r + (r - bg.r) * s);
          data[i + 1] = Math.round(bg.g + (g - bg.g) * s);
          data[i + 2] = Math.round(bg.b + (b - bg.b) * s);
          data[i + 3] = 255;
        }
      }
    }
  }

  const flatPng = await sharp(data, { raw: { width: origW, height: origH, channels: 4 } }).png().toBuffer();

  let coreW = origW, coreH = origH, coreLeft = 0, coreTop = 0;
  try {
    const coreTrim = await sharp(flatPng).trim({ threshold: CORE_TRIM_THRESHOLD }).toBuffer({ resolveWithObject: true });
    if (coreTrim.info.width >= 24 && coreTrim.info.height >= 24) {
      coreW = coreTrim.info.width;
      coreH = coreTrim.info.height;
      coreLeft = Math.max(0, -(coreTrim.info.trimOffsetLeft || 0));
      coreTop = Math.max(0, -(coreTrim.info.trimOffsetTop || 0));
    }
  } catch (_) {}

  const coreCx = coreLeft + coreW / 2;
  const coreCy = coreTop + coreH / 2;
  const opticalTarget = computeOpticalTarget(coreW, coreH);
  const scale = Math.min(Math.min(opticalTarget / coreW, opticalTarget / coreH), MAX_UPSCALE_V4);

  const scaledW = Math.max(1, Math.round(origW * scale));
  const scaledH = Math.max(1, Math.round(origH * scale));
  let resizer = sharp(flatPng).resize(scaledW, scaledH, { fit: "fill", kernel: "lanczos3" });
  if (scale > 2.2) resizer = resizer.sharpen({ sigma: 0.6 });
  else if (scale > 1.35) resizer = resizer.sharpen({ sigma: 0.45 });
  const scaledBuf = await resizer.png().toBuffer();

  const sCoreCx = Math.round(coreCx * scale);
  const sCoreCy = Math.round(coreCy * scale);
  const pasteX = Math.round(CANVAS_SIZE / 2 - sCoreCx);
  const pasteY = Math.round(CANVAS_SIZE / 2 - sCoreCy);
  const srcLeft = Math.max(0, -pasteX);
  const srcTop = Math.max(0, -pasteY);
  const dstLeft = Math.max(0, pasteX);
  const dstTop = Math.max(0, pasteY);
  const copyW = Math.max(1, Math.min(scaledW - srcLeft, CANVAS_SIZE - dstLeft));
  const copyH = Math.max(1, Math.min(scaledH - srcTop, CANVAS_SIZE - dstTop));

  const patchBuf = await sharp(scaledBuf)
    .extract({ left: srcLeft, top: srcTop, width: copyW, height: copyH })
    .png()
    .toBuffer();

  const canvasRaw = await sharp({
    create: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 4, background: bg },
  })
    .composite([{ input: patchBuf, left: dstLeft, top: dstTop }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cData = Buffer.from(canvasRaw.data);
  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const dist = Math.min(x, CANVAS_SIZE - 1 - x, y, CANVAS_SIZE - 1 - y);
      if (dist >= EDGE_FEATHER_PX) {
        if (y >= EDGE_FEATHER_PX && y < CANVAS_SIZE - EDGE_FEATHER_PX && x === EDGE_FEATHER_PX) {
          x = CANVAS_SIZE - EDGE_FEATHER_PX - 1;
        }
        continue;
      }
      const i = (y * CANVAS_SIZE + x) * 4;
      const r = cData[i], g = cData[i + 1], b = cData[i + 2];
      if ((r !== bg.r || g !== bg.g || b !== bg.b) && Math.min(r, g, b) >= 140) {
        const t = dist / EDGE_FEATHER_PX;
        const s = t * t * (3 - 2 * t);
        cData[i] = Math.round(bg.r + (r - bg.r) * s);
        cData[i + 1] = Math.round(bg.g + (g - bg.g) * s);
        cData[i + 2] = Math.round(bg.b + (b - bg.b) * s);
        cData[i + 3] = 255;
      }
    }
  }

  return sharp(cData, { raw: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 4 } })
    .webp({ quality: 90 })
    .toBuffer();
}

async function uploadToR2(r2Key, buffer, contentType = "image/webp") {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${R2_PUBLIC_URL}/${r2Key}`;
}

function parseStroiliHtml(html, sku) {
  const rawH1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ");
  let title = decodeHtml(rawH1).replace(new RegExp(`\\s+${sku}$`), "").trim();
  if (!title) {
    const ldMatch = html.match(/"@type"\s*:\s*"Product"[\s\S]*?"name"\s*:\s*"([^"]+)"/i);
    if (ldMatch) title = decodeHtml(ldMatch[1]);
  }

  // Attributes from product-attribute--attribut
  const pairs = [];
  const seenLabels = new Set();
  for (const m of html.matchAll(
    /<div class="product-attribute--attribut">\s*<span class="label">([\s\S]*?)<\/span>\s*<span class="value">([\s\S]*?)<\/span>/gi
  )) {
    const label = decodeHtml(m[1].replace(/<[^>]+>/g, " "));
    const val = decodeHtml(m[2].replace(/<[^>]+>/g, " "));
    if (!label || !val) continue;
    pairs.push([label, val]);
  }

  // Deduplicate images by basename; prioritize -master, then -view*, then -model*
  const rawImgs = [
    ...html.matchAll(/https:\/\/www\.stroilioro\.com\/dw\/image\/v2\/BCQS_PRD\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi),
  ].map((m) => m[0].split("?")[0]);

  const byFile = new Map();
  for (const u of rawImgs) {
    if (!u.includes("/images/") || !u.includes(sku)) continue;
    const base = path.basename(u).toLowerCase();
    // Skip duplicate /it_IT/v.../ if /default/ already seen
    if (!byFile.has(base) || u.includes("/default/")) {
      byFile.set(base, `${u}?sw=1024&sh=1024`);
    }
  }
  const ordered = Array.from(byFile.entries())
    .sort((a, b) => {
      const rank = (name) =>
        name.includes("-master") ? 0 : name.includes("-view") ? 1 : name.includes("-model") ? 2 : 3;
      return rank(a[0]) - rank(b[0]);
    })
    .map((x) => x[1])
    .slice(0, 4);

  return { title, pairs, imageUrls: ordered };
}

function classifyProduct(item, parsedTitle, pairsMap) {
  const tLower = (parsedTitle || item.description || "").toLowerCase();
  const invCat = item.inferred_category;
  const invSub = item.inferred_subcategory;

  if (
    invCat === "orologi" ||
    tLower.includes("orologio") ||
    tLower.includes("cronografo") ||
    tLower.includes("solo tempo") ||
    pairsMap.has("Meccanismo") ||
    pairsMap.has("Materiale della cassa")
  ) {
    const g = (pairsMap.get("Genere") || "").toLowerCase();
    let sub = invSub === "uomo" ? "uomo" : "donna";
    if (g.includes("uomo") || tLower.includes(" uomo")) sub = "uomo";
    else if (g.includes("donna") || tLower.includes(" donna")) sub = "donna";
    return {
      category: "orologi",
      subcategory: sub,
      subcategoryLabel: sub === "uomo" ? "Orologi Uomo" : "Orologi Donna",
    };
  }

  if (
    tLower.includes("portachiavi") ||
    tLower.includes("portafoglio") ||
    tLower.includes("portacarte") ||
    tLower.includes("pochette") ||
    invCat === "accessori"
  ) {
    const isPortachiavi = tLower.includes("portachiavi") || invSub === "portachiavi";
    return {
      category: "accessori",
      subcategory: isPortachiavi ? "portachiavi" : "pelletteria",
      subcategoryLabel: isPortachiavi ? "Portachiavi" : "Pelletteria",
    };
  }

  let sub = invSub || "gioielli";
  let subLabel = "Gioielli";
  if (/anell|solitari|verett|trilogy|chevalier|fedin/i.test(tLower)) {
    sub = "anelli";
    subLabel = "Anelli";
  } else if (/braccial/i.test(tLower)) {
    sub = "bracciali";
    subLabel = "Bracciali";
  } else if (/collan|catena|girocoll|collier|rosario/i.test(tLower)) {
    sub = "collane";
    subLabel = "Collane";
  } else if (/orecchin|cerchi|lobo|monoorecchin/i.test(tLower)) {
    sub = "orecchini";
    subLabel = "Orecchini";
  } else if (/ciondol|pendent|charm|croce/i.test(tLower)) {
    sub = "ciondoli";
    subLabel = "Ciondoli e Componenti";
  } else {
    const mapLabel = {
      anelli: "Anelli",
      bracciali: "Bracciali",
      collane: "Collane",
      orecchini: "Orecchini",
      ciondoli: "Ciondoli e Componenti",
    };
    subLabel = mapLabel[sub] || "Gioielli";
  }

  return { category: "gioielli", subcategory: sub, subcategoryLabel: subLabel };
}

function humanizeStroiliName(item, parsedTitle, cat) {
  let clean = (parsedTitle || "").trim();
  if (!clean) {
    // Clean abbreviated invoice description cleanly without inventing specs
    clean = String(item.description || "")
      .replace(/^STW\s+/i, "Orologio ")
      .replace(/\bCOLL\.?\b/gi, "Collana")
      .replace(/\bBRAC\.?\b/gi, "Bracciale")
      .replace(/\bORECCH\.?\b|\bOREC\.?\b/gi, "Orecchini")
      .replace(/\bANELLO\b/gi, "Anello")
      .replace(/\bCIOND\.?\b/gi, "Ciondolo")
      .replace(/\bZIRC\.?\b/gi, "Zirconi")
      .replace(/\bDIAM\.?\b/gi, "Diamante")
      .replace(/\bOG\b/g, "Oro Giallo")
      .replace(/\bOB\b/g, "Oro Bianco")
      .replace(/\bOR\b/g, "Oro Rosa")
      .replace(/\bSS\b/g, "Acciaio")
      .replace(/\bWHT\b/gi, "Bianco")
      .replace(/\bBLK\b/gi, "Nero")
      .replace(/\bBRAC\b/g, "Bracciale")
      .replace(/\s+/g, " ")
      .trim();
  }
  return clean.startsWith("Stroili") ? clean : `Stroili — ${clean}`;
}

function buildAttributesAndDesc(item, cat, parsedTitle, pairs) {
  const map = new Map();
  const stoneTypes = [];
  for (const [k, v] of pairs) {
    if (k === "Tipologia di Pietra") {
      if (v && !stoneTypes.includes(v)) stoneTypes.push(v);
    } else if (!map.has(k)) {
      map.set(k, v);
    }
  }
  const tLower = `${parsedTitle || ""} ${item.description || ""}`.toLowerCase();
  const gender = map.get("Genere") || (cat.subcategory === "uomo" ? "Uomo" : "Donna");
  const collectionMatch = (parsedTitle || "").match(
    /(Am[eé]lie|Isabelle|Beverly|Radiance|Love|Classics|L['']homme Or|Elegance|Chic|Romantic Shine|Beads|Silver Pearls|Silver Collection|Silver Baby|Silver Elegance|Moonlight|Bruges|Kyoto|Carrie|Colette|Mon Petit|Man Code|Holy)/i
  );
  const collection = collectionMatch?.[1];
  const ref = map.get("Referenza fornitore");

  if (cat.category === "orologi") {
    const movement = map.get("Meccanismo") || "Al Quarzo";
    const caseMat = map.get("Materiale della cassa") || "Acciaio inossidabile";
    const diam = map.get("Dimensione Cassa (mm)");
    const glass = map.get("Materiale del vetro") || "Minerale";
    const dial = map.get("Colore sfondo cassa");
    const strapMat = map.get("Materiale del cinturino");
    const strapCol = map.get("Colore del cinturino");
    const strap = [strapMat, strapCol].filter(Boolean).join(" ") || undefined;
    const wr = map.get("Impermeabilità");
    const attrs = {
      Movimento: movement,
      "Materiale cassa": caseMat,
      ...(diam ? { "Diametro cassa": `${diam} mm` } : {}),
      Vetro: glass,
      ...(dial ? { Quadrante: dial } : {}),
      ...(strap ? { Cinturino: strap } : {}),
      ...(wr ? { Impermeabilità: wr } : {}),
      ...(collection ? { Collezione: collection } : {}),
      ...(ref ? { Referenza: ref } : {}),
      Genere: gender,
    };
    const descParts = [
      `Orologio originale Stroili${collection ? ` collezione ${collection}` : ""} (Cod. ${item.sku} · EAN ${item.ean || item.sku}).`,
      `Cassa in ${caseMat.toLowerCase()}${diam ? ` da ${diam} mm` : ""}, movimento ${movement.toLowerCase()}, vetro ${glass.toLowerCase()}${wr ? ` e impermeabilità ${wr}` : ""}.`,
      `Corredato di cofanetto e garanzia ufficiale Stroili 24 mesi ORO&CO.`,
    ];
    return {
      attributes: attrs,
      description: descParts.join(" "),
      short_description: `${parsedTitle || item.description} · Orologio Stroili originale con garanzia.`,
      tags: ["stroili", "orologi", cat.subcategory, collection?.toLowerCase()].filter(Boolean),
    };
  }

  if (cat.category === "accessori") {
    const mainMat = map.get("Materiale principale") || (tLower.includes("acciaio") ? "Acciaio 316L" : "Pelle / Metallo");
    const colMat = map.get("Colore del materiale");
    const dim = map.get("Lunghezza (cm)") ? `${map.get("Lunghezza (cm)")} cm` : undefined;
    const attrs = {
      Materiale: colMat ? `${mainMat} (${colMat})` : mainMat,
      material: colMat ? `${mainMat} (${colMat})` : mainMat,
      ...(collection ? { Collezione: collection } : {}),
      ...(dim ? { Dimensioni: dim } : {}),
      Genere: gender,
    };
    return {
      attributes: attrs,
      description: `Accessorio originale Stroili${collection ? ` collezione ${collection}` : ""} (Cod. ${item.sku} · EAN ${item.ean || item.sku}), realizzato in ${mainMat.toLowerCase()}. Consegnato con confezione e garanzia ufficiale Stroili ORO&CO.`,
      short_description: `${parsedTitle || item.description} · Stroili originale con garanzia.`,
      tags: ["stroili", "accessori", cat.subcategory, collection?.toLowerCase()].filter(Boolean),
    };
  }

  // Gioielli
  const mainMat = map.get("Materiale principale") || "";
  const colMat = map.get("Colore del materiale") || "";
  const titleMetal = map.get("Titolo metallo") || "";
  let metal = "";
  let material = "";
  if (/oro/i.test(mainMat) || item.is_gold || /\b375\b|oro\s*(giallo|bianco|rosa)/i.test(tLower)) {
    const tone =
      /bianc|\bob\b/i.test(`${colMat} ${tLower}`)
        ? "bianco"
        : /ros|\bor\b/i.test(`${colMat} ${tLower}`)
          ? "rosa"
          : /bicolor/i.test(`${colMat} ${tLower}`)
            ? "bicolore"
            : "giallo";
    const kt = /750/.test(`${titleMetal} ${tLower}`) ? "18 kt (750‰)" : "9 kt (375‰)";
    metal = `Oro ${tone} ${kt}`;
    material = kt.includes("750") ? "Oro 750‰" : "Oro 375‰";
  } else if (/argento/i.test(mainMat) || /argento|925/i.test(tLower)) {
    const isGoldPlated = /dorat|giall|ros/i.test(`${colMat} ${tLower}`);
    metal = isGoldPlated ? "Argento 925 placcato oro" : "Argento 925 rodiato";
    material = "Argento 925‰";
  } else if (/acciaio/i.test(mainMat) || /acciaio|steel/i.test(tLower)) {
    const isGoldPlated = /dorat|giall|ros/i.test(`${colMat} ${tLower}`);
    metal = isGoldPlated ? "Acciaio inossidabile dorato" : "Acciaio inossidabile 316L";
    material = "Acciaio";
  } else {
    metal = mainMat || "Metallo anallergico";
    material = mainMat || "Metallo";
  }

  if (stoneTypes.length === 0) {
    if (item.is_diamond || /diamant/i.test(tLower)) stoneTypes.push("Diamante");
    if (item.is_pearl || /perl/i.test(tLower)) stoneTypes.push("Perla coltivata");
    if (/zircon/i.test(tLower)) stoneTypes.push("Cubic Zirconia");
  }

  const peso = map.get("Peso netto (gr)");
  const lung = map.get("Lunghezza (cm)");
  const minLung = map.get("Lunghezza minima (cm)");
  const size = minLung && lung ? `${minLung}–${lung} cm` : lung ? `${lung} cm` : undefined;
  const chiusura = map.get("Tipologia di Chiusura");
  const catena = map.get("Tipologia catena");

  const attrs = {
    metal,
    material,
    ...(stoneTypes.length ? { stones: stoneTypes } : {}),
    ...(size ? { size } : {}),
    ...(peso ? { Peso: `${peso} g` } : {}),
    ...(chiusura ? { Chiusura: chiusura } : {}),
    ...(catena ? { Lavorazione: `Maglia ${catena}` } : {}),
    ...(collection ? { collection } : {}),
    gender,
    ...(colMat ? { color: colMat } : {}),
  };

  const collText = collection ? ` della collezione ${collection}` : "";
  const stoneText = stoneTypes.length ? ` con ${stoneTypes.join(" e ")}` : "";
  const sizeText = size ? ` (misura ${size})` : "";
  const description = `Creazione originale Stroili${collText}, referenza ufficiale ${item.sku} (EAN ${item.ean || item.sku}). Prezioso realizzato in ${metal}${stoneText}${sizeText}. Corredato di astuccio e certificato di garanzia ufficiale Stroili ORO&CO.`;

  return {
    attributes: attrs,
    description,
    short_description: `${parsedTitle || item.description} · Stroili originale con garanzia.`,
    tags: ["stroili", "gioielli", cat.subcategory, collection?.toLowerCase(), metal.toLowerCase()].filter(Boolean),
  };
}

async function processSkuItem(item, existingMap, existingSlugs) {
  const sku = String(item.sku);
  let pageRes = await fetchTextRetry(`https://www.stroilioro.com/it_IT/p/${sku}.html`);
  if (!pageRes.ok) {
    const searchRes = await fetchTextRetry(`https://www.stroilioro.com/it_IT/search?q=${encodeURIComponent(sku)}`);
    if (searchRes.ok) {
      const m = searchRes.text.match(new RegExp(`href="(/it_IT/[^"]*${sku}[^"]*\\.html)"`, "i"));
      if (m) pageRes = await fetchTextRetry(`https://www.stroilioro.com${m[1]}`);
    }
  }

  let parsed = { title: "", pairs: [], imageUrls: [] };
  if (pageRes.ok && pageRes.text && !/Client Challenge/i.test(pageRes.text)) {
    parsed = parseStroiliHtml(pageRes.text, sku);
  }

  const pairsMap = new Map(parsed.pairs);
  const cat = classifyProduct(item, parsed.title, pairsMap);
  const name = humanizeStroiliName(item, parsed.title, cat);
  const { attributes, description, short_description, tags } = buildAttributesAndDesc(
    item,
    cat,
    parsed.title,
    parsed.pairs
  );

  // Process & upload images to R2 (normalize ONLY images[0] -> grid-v4, keep images[1..3] raw)
  const uploadedImages = [];
  if (parsed.imageUrls.length > 0) {
    try {
      const img0 = await fetchImageRetry(parsed.imageUrls[0]);
      await uploadToR2(`products/stroili/${sku}-01.jpg`, img0.buf, img0.contentType);
      const corners = await analyzeCorners(img0.buf);
      const normWebp = await shadowSafeNormalizeFromOriginal(img0.buf, corners);
      const gridUrl = await uploadToR2(`products/grid-v4/stroili/${sku}-01.webp`, normWebp, "image/webp");
      uploadedImages.push(gridUrl);

      for (let i = 1; i < parsed.imageUrls.length; i++) {
        try {
          const sec = await fetchImageRetry(parsed.imageUrls[i]);
          const secUrl = await uploadToR2(`products/stroili/${sku}-0${i + 1}.jpg`, sec.buf, sec.contentType);
          uploadedImages.push(secUrl);
        } catch (_) {}
      }
    } catch (e) {
      // failed primary download -> leave empty -> rejected (Solo Cassa)
    }
  }

  const existing = existingMap.get(sku.toUpperCase());
  let slug = existing?.slug;
  if (!slug) {
    const baseSlug = `stroili-${slugify(name.replace(/^Stroili\s+—\s+/i, "").slice(0, 55))}-${sku.toLowerCase()}`;
    slug = baseSlug;
    let c = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${c++}`;
    }
    existingSlugs.add(slug);
  }

  const price = Number(item.unit_price_listino) || 0;
  const cost = item.net_cost ? Number(item.net_cost) : null;
  const row = {
    slug,
    name,
    brand_id: STROILI_BRAND_ID,
    brand_name: "Stroili",
    category: cat.category,
    subcategory: cat.subcategory,
    subcategory_label: cat.subcategoryLabel,
    price,
    compare_at_price: null,
    vat_rate: item.vat_rate || 22,
    stock_quantity: Math.max(1, Number(item.total_qty) || 1),
    in_stock: true,
    barcode: item.ean || sku,
    sku,
    short_description,
    description,
    images: uploadedImages,
    attributes,
    tags,
    is_featured: false,
    is_new: true,
    is_christmas: false,
    supplier_cost: cost,
    markup_multiplier: cost && cost > 0 && price > 0 ? Number((price / cost).toFixed(2)) : null,
    approval_status: uploadedImages.length > 0 ? "approved" : "rejected",
    supplier_name: "Timeway S.r.l.",
    invoice_ref: (item.invoices || []).map((inv) => inv.invoice_no).join(", ") || null,
  };

  if (existing) {
    const { error } = await sb.from("oroeco_products").update(row).eq("id", existing.id);
    if (error) throw error;
    return { sku, action: "updated", status: row.approval_status, category: row.category, subcategory: row.subcategory, imgs: uploadedImages.length };
  } else {
    const { error } = await sb.from("oroeco_products").insert(row);
    if (error) throw error;
    return { sku, action: "inserted", status: row.approval_status, category: row.category, subcategory: row.subcategory, imgs: uploadedImages.length };
  }
}

async function handleRejectedRealStroili(existingMap) {
  const results = [];
  for (const sku of ["1702345", "1705424"]) {
    const row = existingMap.get(sku);
    if (!row || row.approval_status === "approved") continue;
    let imgUrls = (row.images || []).filter((u) => /^https?:\/\//i.test(u));
    if (imgUrls.length === 0) {
      const pageRes = await fetchTextRetry(`https://www.stroilioro.com/it_IT/p/${sku}.html`);
      if (pageRes.ok && pageRes.text && !/Client Challenge/i.test(pageRes.text)) {
        imgUrls = parseStroiliHtml(pageRes.text, sku).imageUrls;
      }
    }
    if (imgUrls.length === 0) {
      results.push({ sku, status: "still_rejected_no_images" });
      continue;
    }
    try {
      const uploaded = [];
      const img0 = await fetchImageRetry(imgUrls[0]);
      await uploadToR2(`products/stroili/${sku}-01.jpg`, img0.buf, img0.contentType);
      const corners = await analyzeCorners(img0.buf);
      const normWebp = await shadowSafeNormalizeFromOriginal(img0.buf, corners);
      uploaded.push(await uploadToR2(`products/grid-v4/stroili/${sku}-01.webp`, normWebp, "image/webp"));
      for (let i = 1; i < Math.min(imgUrls.length, 4); i++) {
        try {
          const sec = await fetchImageRetry(imgUrls[i]);
          uploaded.push(await uploadToR2(`products/stroili/${sku}-0${i + 1}.jpg`, sec.buf, sec.contentType));
        } catch (_) {}
      }
      const { error } = await sb
        .from("oroeco_products")
        .update({ images: uploaded, approval_status: "approved" })
        .eq("id", row.id);
      if (error) throw error;
      results.push({ sku, status: "migrated_and_approved", imgs: uploaded.length });
    } catch (e) {
      results.push({ sku, status: "failed", error: e.message });
    }
  }
  return results;
}

async function main() {
  const delta = JSON.parse(fs.readFileSync(DELTA_PATH, "utf8"));
  const items = delta.stroili_new_missing || [];
  console.log(`Loaded ${items.length} stroili_new_missing items`);

  // Fetch all existing products (for slug uniqueness + existing Stroili SKU check)
  const allRows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await sb
      .from("oroeco_products")
      .select("id,sku,slug,brand_id,approval_status,images")
      .range(from, from + 999);
    if (error) throw error;
    allRows.push(...data);
    if (data.length < 1000) break;
  }

  const existingSlugs = new Set(allRows.map((r) => r.slug));
  const stroiliMap = new Map(
    allRows.filter((r) => r.brand_id === STROILI_BRAND_ID).map((r) => [String(r.sku).toUpperCase(), r])
  );

  // Skip SKUs that were already newly imported on a prior run ONLY if not in delta, wait: idempotent update is safe or skip existing?
  // Note: none of the 289 delta SKUs exist in DB yet on initial run.
  const queue = items.slice();
  const report = {
    started_at: new Date().toISOString(),
    total_delta: items.length,
    inserted: 0,
    updated: 0,
    approved: 0,
    rejected_no_img: 0,
    errors: [],
    by_category: {},
    rejected_skus: [],
    real_rejected_fix: [],
  };

  let done = 0;
  async function worker() {
    while (queue.length > 0) {
      const item = queue.shift();
      try {
        const res = await processSkuItem(item, stroiliMap, existingSlugs);
        if (res.action === "inserted") report.inserted++;
        else report.updated++;
        if (res.status === "approved") report.approved++;
        else {
          report.rejected_no_img++;
          report.rejected_skus.push(res.sku);
        }
        const k = `${res.category}/${res.subcategory}`;
        report.by_category[k] = (report.by_category[k] || 0) + 1;
      } catch (e) {
        report.errors.push({ sku: item.sku, error: e.message });
      }
      done++;
      if (done % 25 === 0 || done === items.length) {
        console.log(
          `Progress ${done}/${items.length} | approved=${report.approved} | rejected=${report.rejected_no_img} | errors=${report.errors.length}`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  report.real_rejected_fix = await handleRejectedRealStroili(stroiliMap);
  report.finished_at = new Date().toISOString();

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log("DONE REPORT:", JSON.stringify({ ...report, errors: report.errors.slice(0, 10) }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
