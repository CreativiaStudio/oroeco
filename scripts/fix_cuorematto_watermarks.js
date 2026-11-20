const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq).trim();
    const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}

loadEnv();

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

const GROUP_A_10 = [
  "D9113",
  "D9115",
  "D9141",
  "D9162",
  "D9164",
  "D9181",
  "D9182",
  "D9183",
  "D9229",
  "D9237",
];
const GROUP_A_VASO = ["D9163"];
const GROUP_B_REDBOX = ["A4384", "A4385", "A4386"];
const ALL_SKUS = [...GROUP_A_10, ...GROUP_A_VASO, ...GROUP_B_REDBOX];

const AUDIT_SHEET_PATH =
  "C:\\Users\\mario\\.gemini\\antigravity\\brain\\d3a59d6d-2ab9-40e2-a84d-5ef0f43f9b01\\scratch\\img_audit\\cuorematto_cleaned_14.jpg";

function maxContiguousRun(arr) {
  let best = 0;
  let cur = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 0;
    }
  }
  return best;
}

async function detectRedBoxBounds(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;

  const isRed = (x, y) => {
    const idx = (y * width + x) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r > 155 && g < 55 && b < 55;
  };

  // Colonne candidate con pixel rossi verticali contigui (almeno 150px)
  const colScores = [];
  for (let x = 0; x < width; x++) {
    const flags = new Uint8Array(height);
    for (let y = 0; y < height; y++) {
      if (isRed(x, y)) flags[y] = 1;
    }
    const run = maxContiguousRun(flags);
    if (run >= 150) colScores.push({ idx: x, score: run });
  }

  // Righe candidate con pixel rossi orizzontali contigui (almeno 60px)
  const rowScores = [];
  for (let y = 0; y < height; y++) {
    const flags = new Uint8Array(width);
    for (let x = 0; x < width; x++) {
      if (isRed(x, y)) flags[x] = 1;
    }
    const run = maxContiguousRun(flags);
    if (run >= 60) rowScores.push({ idx: y, score: run });
  }

  // Trova le 2 colonne separate di almeno 80px con somma punteggi massima
  let bestCols = null;
  let bestColSum = -1;
  for (let i = 0; i < colScores.length; i++) {
    for (let j = i + 1; j < colScores.length; j++) {
      if (colScores[j].idx - colScores[i].idx < 80) continue;
      const sum = colScores[i].score + colScores[j].score;
      if (sum > bestColSum) {
        bestColSum = sum;
        bestCols = [colScores[i].idx, colScores[j].idx];
      }
    }
  }

  // Trova le 2 righe separate di almeno 150px con somma punteggi massima
  let bestRows = null;
  let bestRowSum = -1;
  for (let i = 0; i < rowScores.length; i++) {
    for (let j = i + 1; j < rowScores.length; j++) {
      if (rowScores[j].idx - rowScores[i].idx < 150) continue;
      const sum = rowScores[i].score + rowScores[j].score;
      if (sum > bestRowSum) {
        bestRowSum = sum;
        bestRows = [rowScores[i].idx, rowScores[j].idx];
      }
    }
  }

  if (!bestCols || !bestRows) {
    throw new Error(
      `Red box non rilevato (colCandidates=${colScores.length}, rowCandidates=${rowScores.length})`
    );
  }

  const [xLeft, xRight] = bestCols;
  const [yTop, yBottom] = bestRows;
  const cropLeft = Math.max(0, xLeft + 5);
  const cropTop = Math.max(0, yTop + 5);
  const cropWidth = xRight - xLeft - 10;
  const cropHeight = yBottom - yTop - 10;

  if (cropWidth < 90 || cropHeight < 150) {
    throw new Error(
      `Red box troppo piccolo (${cropWidth}x${cropHeight} da [${xLeft},${yTop}]-[${xRight},${yBottom}])`
    );
  }

  return {
    left: cropLeft,
    top: cropTop,
    width: cropWidth,
    height: cropHeight,
  };
}

(async () => {
  const { data: rows, error } = await sb
    .from("oroeco_products")
    .select("id, sku, name, images")
    .in("sku", ALL_SKUS);

  if (error) throw error;
  console.log(`Trovati ${rows.length}/${ALL_SKUS.length} SKU Cuorematto target.`);

  const bySku = new Map(rows.map((r) => [r.sku.toUpperCase(), r]));
  const cleanedThumbs = [];

  for (const sku of ALL_SKUS) {
    const row = bySku.get(sku);
    if (!row) {
      throw new Error(`SKU ${sku} non trovato su oroeco_products`);
    }
    const origUrl = Array.isArray(row.images) ? row.images[0] : null;
    if (!origUrl) {
      throw new Error(`SKU ${sku} senza images[0]`);
    }

    const resp = await fetch(origUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} scaricando ${origUrl}`);
    const origBuf = Buffer.from(await resp.arrayBuffer());
    const meta = await sharp(origBuf).metadata();

    let outBuf;
    let infoNote = "";

    if (GROUP_B_REDBOX.includes(sku)) {
      const box = await detectRedBoxBounds(origBuf);
      outBuf = await sharp(origBuf)
        .extract(box)
        .webp({ quality: 92 })
        .toBuffer();
      infoNote = `redbox ${box.width}x${box.height} at (${box.left},${box.top})`;
    } else {
      const ratio = GROUP_A_VASO.includes(sku) ? 0.912 : 0.905;
      const cropH = Math.round(meta.height * ratio);
      outBuf = await sharp(origBuf)
        .extract({ left: 0, top: 0, width: meta.width, height: cropH })
        .webp({ quality: 92 })
        .toBuffer();
      infoNote = `crop bottom ${meta.width}x${cropH} (${ratio})`;
    }

    const r2Key = `products/cuorematto/clean-v1/${sku.toLowerCase()}.webp`;
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: outBuf,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    const newUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    const nextImages = [newUrl, ...(Array.isArray(row.images) ? row.images.slice(1) : [])];

    const { error: upErr } = await sb
      .from("oroeco_products")
      .update({ images: nextImages, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (upErr) throw upErr;

    const cleanMeta = await sharp(outBuf).metadata();
    console.log(`✅ ${sku}: ${infoNote} -> ${cleanMeta.width}x${cleanMeta.height} -> ${newUrl}`);
    cleanedThumbs.push({ sku, buf: outBuf, w: cleanMeta.width, h: cleanMeta.height });
  }

  // Crea contact sheet di verifica visiva
  fs.mkdirSync(path.dirname(AUDIT_SHEET_PATH), { recursive: true });
  const COLS = 4;
  const W = 340;
  const H = 300;
  const composites = [];
  for (let i = 0; i < cleanedThumbs.length; i++) {
    const it = cleanedThumbs[i];
    const col = i % COLS;
    const rw = Math.floor(i / COLS);
    const thumb = await sharp(it.buf)
      .resize(W - 12, H - 30, {
        fit: "contain",
        background: { r: 248, g: 248, b: 248, alpha: 1 },
      })
      .png()
      .toBuffer();
    const lbl = `${it.sku} (${it.w}x${it.h}) CLEAN`;
    const svg = `<svg width="${W}" height="24"><rect width="100%" height="100%" fill="#111"/><text x="6" y="16" font-family="Arial" font-size="13" fill="#fff">${lbl}</text></svg>`;
    composites.push({ input: Buffer.from(svg), left: col * W, top: rw * H });
    composites.push({ input: thumb, left: col * W + 6, top: rw * H + 26 });
  }
  const rowsN = Math.ceil(cleanedThumbs.length / COLS);
  await sharp({
    create: {
      width: COLS * W,
      height: rowsN * H,
      channels: 3,
      background: { r: 230, g: 230, b: 230 },
    },
  })
    .composite(composites)
    .jpeg({ quality: 90 })
    .toFile(AUDIT_SHEET_PATH);

  console.log("AUDIT SHEET:", AUDIT_SHEET_PATH);
})();
