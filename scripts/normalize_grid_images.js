const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { S3Client, PutObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
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

const REPORT_PATH =
  "C:\\Users\\mario\\.gemini\\antigravity\\brain\\d3a59d6d-2ab9-40e2-a84d-5ef0f43f9b01\\scratch\\img_audit\\grid_normalize_report.json";

const FORCE = process.argv.includes("--force");
const FIX_UNDERSIZED = process.argv.includes("--fix-undersized");
const POLISH_V3 = process.argv.includes("--polish-v3");
const REBUILD_SHADOWS_V4 = process.argv.includes("--rebuild-shadows-v4");
const SQUARE_CUOREMATTO_V4 = process.argv.includes("--square-cuorematto-v4");
const RESTORE_CONTEXT_IMG1 = process.argv.includes("--restore-context-img1");
const ONLY_SKU = (() => {
  const i = process.argv.indexOf("--only-sku");
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1].toUpperCase() : null;
})();
const CONCURRENCY = 8;
const CANVAS_SIZE = 1000;
const TARGET_BOX = 720; // 72% occupazione uniforme
const MAX_UPSCALE = 2.75; // Consente anche a packshot 250-380px di raggiungere il 72% con sharpen
const UNDERSIZED_THRESHOLD = 680;
const TARGET_AREA = 340000; // ~34% area visiva su canvas 1000x1000
const MIN_OPTICAL_SIDE = 640; // oggetti quadrati/compatti (es. portacarte, piatti): margine 18%
const MAX_OPTICAL_SIDE = 820; // orologi slim, collane, pochette larghe: fino 82% (margine minimo 9% per lato, zero tagli)
const MAX_UPSCALE_V3 = 2.85;
const TRIM_THRESHOLD_SAFE = 10; // protegge argento chiaro, perle e porcellana bianca Villeroy
const TRIM_HALO_PX = 4; // halo di sicurezza di 4px attorno al bounding box: impossibile tagliare 1px del soggetto
const MAX_UPSCALE_V4 = 4.25; // consente single-pass nitido da originali compatti (es. Unoaerre 151x167 -> 640px) senza doppia ricompressione
const CORE_TRIM_THRESHOLD = 22; // usato SOLO per misurare dimensione e centro del prodotto solido, MAI per ritagliare!
const EDGE_FEATHER_PX = 48; // sfuma dolcemente verso bg eventuali code d'ombra negli ultimi 48px del canvas 1000x1000
const ORIG_EDGE_FEATHER_PX = 28; // sfuma eventuali ombre del fornitore già a filo bordo dell'immagine originale

const BRAND_R2_PREFIXES = {
  Unoaerre: "products/unoaerre/",
  Gerba: "products/gerba/",
  "Villeroy & Boch": "products/villeroy/",
  "Gli Alberelli": "products/gli-alberelli/",
  Bulova: "products/bulova/",
  Guess: "products/guess/",
  "Paul Picot": "products/paul-picot/",
  Locman: "products/locman/",
  "Lladró": "products/lladro/",
};

function slugify(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

async function fetchWithRetry(url) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "image/webp,image/png,image/jpeg,*/*;q=0.8",
        },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return Buffer.from(await resp.arrayBuffer());
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 250 * (attempt + 1)));
    }
  }
  throw lastErr;
}

function getBackgroundColor(corners) {
  return corners.hasAlphaCorners || corners.cornerMinRGB >= 248
    ? { r: 255, g: 255, b: 255, alpha: 1 }
    : { r: corners.avg.r, g: corners.avg.g, b: corners.avg.b, alpha: 1 };
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

async function measureTrimmedSize(buf, bg, origW, origH) {
  try {
    const trimmed = await sharp(buf)
      .flatten({ background: bg })
      .trim({ threshold: TRIM_THRESHOLD_SAFE })
      .toBuffer({ resolveWithObject: true });
    if (trimmed.info.width >= 32 && trimmed.info.height >= 32) {
      return { tw: trimmed.info.width, th: trimmed.info.height };
    }
  } catch (_) {}
  return { tw: origW, th: origH };
}

async function safeTrimAndNormalize(buf, corners) {
  const bg = getBackgroundColor(corners);
  const flatBuf = await sharp(buf).flatten({ background: bg }).png().toBuffer();
  const origW = corners.width;
  const origH = corners.height;

  let tw = origW;
  let th = origH;
  let extractLeft = 0;
  let extractTop = 0;
  let extractW = origW;
  let extractH = origH;

  try {
    const trimInfo = await sharp(flatBuf)
      .trim({ threshold: TRIM_THRESHOLD_SAFE })
      .toBuffer({ resolveWithObject: true });
    if (trimInfo.info.width >= 32 && trimInfo.info.height >= 32) {
      tw = trimInfo.info.width;
      th = trimInfo.info.height;
      const offsetX = trimInfo.info.trimOffsetLeft || 0;
      const offsetY = trimInfo.info.trimOffsetTop || 0;
      const baseLeft = offsetX <= 0 ? -offsetX : 0;
      const baseTop = offsetY <= 0 ? -offsetY : 0;
      const left = Math.max(0, baseLeft - TRIM_HALO_PX);
      const top = Math.max(0, baseTop - TRIM_HALO_PX);
      const right = Math.min(origW, baseLeft + tw + TRIM_HALO_PX);
      const bottom = Math.min(origH, baseTop + th + TRIM_HALO_PX);
      if (right > left && bottom > top) {
        extractLeft = left;
        extractTop = top;
        extractW = right - left;
        extractH = bottom - top;
      }
    }
  } catch (_) {}

  const subjectBuf =
    extractLeft > 0 || extractTop > 0 || extractW < origW || extractH < origH
      ? await sharp(flatBuf)
          .extract({ left: extractLeft, top: extractTop, width: extractW, height: extractH })
          .png()
          .toBuffer()
      : flatBuf;

  const opticalTarget = computeOpticalTarget(tw, th);
  const rawScale = Math.min(opticalTarget / tw, opticalTarget / th);
  const scale = Math.min(rawScale, MAX_UPSCALE_V3);
  const outW = Math.max(1, Math.min(CANVAS_SIZE - 40, Math.round(extractW * scale)));
  const outH = Math.max(1, Math.min(CANVAS_SIZE - 40, Math.round(extractH * scale)));

  let resizer = sharp(subjectBuf).resize(outW, outH, {
    fit: "inside",
    kernel: "lanczos3",
  });
  if (scale > 1.35) resizer = resizer.sharpen({ sigma: 0.45 });
  const resizedSubject = await resizer.png().toBuffer();

  const outWebp = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: resizedSubject, gravity: "center" }])
    .webp({ quality: 88 })
    .toBuffer();

  return { outWebp, tw, th, opticalTarget, outW, outH, scale };
}

async function uploadToR2(r2Key, buffer) {
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: buffer,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

async function listAllR2Keys(prefix) {
  const keys = [];
  let token;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: prefix,
        ContinuationToken: token,
      })
    );
    for (const obj of res.Contents || []) {
      if (obj.Key) keys.push(obj.Key);
    }
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return keys;
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

  // Pre-feather bordi dell'originale solo se un'ombra grigia tocca già il filo esterno
  let minTop = 255;
  let minBot = 255;
  let minLeft = 255;
  let minRight = 255;
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
        if (inTop) {
          const t = y / ORIG_EDGE_FEATHER_PX;
          s = Math.min(s, t * t * (3 - 2 * t));
        }
        if (inBot) {
          const t = (origH - 1 - y) / ORIG_EDGE_FEATHER_PX;
          s = Math.min(s, t * t * (3 - 2 * t));
        }
        if (inLeft) {
          const t = x / ORIG_EDGE_FEATHER_PX;
          s = Math.min(s, t * t * (3 - 2 * t));
        }
        if (inRight) {
          const t = (origW - 1 - x) / ORIG_EDGE_FEATHER_PX;
          s = Math.min(s, t * t * (3 - 2 * t));
        }

        const i = (y * origW + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (s < 1 && Math.min(r, g, b) >= 140) {
          data[i] = Math.round(bg.r + (r - bg.r) * s);
          data[i + 1] = Math.round(bg.g + (g - bg.g) * s);
          data[i + 2] = Math.round(bg.b + (b - bg.b) * s);
          data[i + 3] = 255;
        }
      }
    }
  }

  const flatPng = await sharp(data, {
    raw: { width: origW, height: origH, channels: 4 },
  })
    .png()
    .toBuffer();

  // Pass A: misura solo corpo solido per scala ottica e centro esatto (MAI per ritagliare)
  let coreW = origW;
  let coreH = origH;
  let coreLeft = 0;
  let coreTop = 0;
  try {
    const coreTrim = await sharp(flatPng)
      .trim({ threshold: CORE_TRIM_THRESHOLD })
      .toBuffer({ resolveWithObject: true });
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
  const scale = Math.min(
    Math.min(opticalTarget / coreW, opticalTarget / coreH),
    MAX_UPSCALE_V4
  );

  // Pass B: scala dell'intera immagine originale preservando 100% delle ombre
  const scaledW = Math.max(1, Math.round(origW * scale));
  const scaledH = Math.max(1, Math.round(origH * scale));
  let resizer = sharp(flatPng).resize(scaledW, scaledH, {
    fit: "fill",
    kernel: "lanczos3",
  });
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
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: patchBuf, left: dstLeft, top: dstTop }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Pass C: feather morbido di sicurezza sugli ultimi EDGE_FEATHER_PX del canvas 1000x1000
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
      const r = cData[i];
      const g = cData[i + 1];
      const b = cData[i + 2];
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

  const outWebp = await sharp(cData, {
    raw: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 4 },
  })
    .webp({ quality: 90 })
    .toBuffer();

  return { outWebp, coreW, coreH, opticalTarget, scale };
}

async function extendVerticalTo(rgbaData, w, h, targetH, topPad) {
  if (h >= targetH) {
    if (h === targetH) return rgbaData;
    const cropTop = Math.floor((h - targetH) / 2);
    return sharp(rgbaData, { raw: { width: w, height: h, channels: 4 } })
      .extract({ left: 0, top: cropTop, width: w, height: targetH })
      .ensureAlpha()
      .raw()
      .toBuffer();
  }

  const safeTopPad = Math.max(0, Math.min(targetH - h, topPad));
  const botPad = targetH - h - safeTopPad;
  const STRIP = Math.min(16, Math.max(4, Math.floor(h / 8)));
  const BLEND_TOP = safeTopPad > 0 ? Math.min(16, Math.floor(h / 6), safeTopPad) : 0;
  const BLEND_BOT = botPad > 0 ? Math.min(16, Math.floor(h / 6), botPad) : 0;

  const srcPng = await sharp(rgbaData, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();

  const topExtH = safeTopPad + BLEND_TOP;
  const topExt =
    topExtH > 0
      ? await sharp(srcPng)
          .extract({ left: 0, top: 0, width: w, height: STRIP })
          .resize(w, topExtH, { fit: "fill" })
          .blur(22)
          .ensureAlpha()
          .raw()
          .toBuffer()
      : null;

  const botExtH = botPad + BLEND_BOT;
  const botExt =
    botExtH > 0
      ? await sharp(srcPng)
          .extract({ left: 0, top: h - STRIP, width: w, height: STRIP })
          .resize(w, botExtH, { fit: "fill" })
          .blur(16)
          .ensureAlpha()
          .raw()
          .toBuffer()
      : null;

  const rowBytes = w * 4;
  const out = Buffer.alloc(w * targetH * 4);

  for (let y = 0; y < targetH; y++) {
    const outRowOffset = y * rowBytes;
    if (y < safeTopPad && topExt) {
      topExt.copy(out, outRowOffset, y * rowBytes, (y + 1) * rowBytes);
    } else if (y < safeTopPad + BLEND_TOP && topExt) {
      const srcY = y - safeTopPad;
      const t = (srcY + 1) / (BLEND_TOP + 1);
      const s = t * t * (3 - 2 * t);
      const srcRowOff = srcY * rowBytes;
      const extRowOff = y * rowBytes;
      for (let x = 0; x < rowBytes; x += 4) {
        out[outRowOffset + x] = Math.round(topExt[extRowOff + x] * (1 - s) + rgbaData[srcRowOff + x] * s);
        out[outRowOffset + x + 1] = Math.round(topExt[extRowOff + x + 1] * (1 - s) + rgbaData[srcRowOff + x + 1] * s);
        out[outRowOffset + x + 2] = Math.round(topExt[extRowOff + x + 2] * (1 - s) + rgbaData[srcRowOff + x + 2] * s);
        out[outRowOffset + x + 3] = 255;
      }
    } else if (y < safeTopPad + h - BLEND_BOT) {
      const srcY = y - safeTopPad;
      rgbaData.copy(out, outRowOffset, srcY * rowBytes, (srcY + 1) * rowBytes);
    } else if (y < safeTopPad + h && botExt) {
      const srcY = y - safeTopPad;
      const k = y - (safeTopPad + h - BLEND_BOT);
      const t = (k + 1) / (BLEND_BOT + 1);
      const s = t * t * (3 - 2 * t);
      const srcRowOff = srcY * rowBytes;
      const extRowOff = k * rowBytes;
      for (let x = 0; x < rowBytes; x += 4) {
        out[outRowOffset + x] = Math.round(rgbaData[srcRowOff + x] * (1 - s) + botExt[extRowOff + x] * s);
        out[outRowOffset + x + 1] = Math.round(rgbaData[srcRowOff + x + 1] * (1 - s) + botExt[extRowOff + x + 1] * s);
        out[outRowOffset + x + 2] = Math.round(rgbaData[srcRowOff + x + 2] * (1 - s) + botExt[extRowOff + x + 2] * s);
        out[outRowOffset + x + 3] = 255;
      }
    } else if (botExt) {
      const k = y - (safeTopPad + h - BLEND_BOT);
      botExt.copy(out, outRowOffset, k * rowBytes, (k + 1) * rowBytes);
    }
  }

  return out;
}

async function extendHorizontalTo(rgbaData, w, h, targetW, leftPad) {
  if (w >= targetW) {
    if (w === targetW) return rgbaData;
    const cropLeft = Math.floor((w - targetW) / 2);
    return sharp(rgbaData, { raw: { width: w, height: h, channels: 4 } })
      .extract({ left: cropLeft, top: 0, width: targetW, height: h })
      .ensureAlpha()
      .raw()
      .toBuffer();
  }

  const safeLeftPad = Math.max(0, Math.min(targetW - w, leftPad));
  const rightPad = targetW - w - safeLeftPad;
  const STRIP = Math.min(16, Math.max(4, Math.floor(w / 8)));
  const BLEND_L = safeLeftPad > 0 ? Math.min(14, Math.floor(w / 6), safeLeftPad) : 0;
  const BLEND_R = rightPad > 0 ? Math.min(14, Math.floor(w / 6), rightPad) : 0;

  const srcPng = await sharp(rgbaData, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();

  const leftExtW = safeLeftPad + BLEND_L;
  const leftExt =
    leftExtW > 0
      ? await sharp(srcPng)
          .extract({ left: 0, top: 0, width: STRIP, height: h })
          .resize(leftExtW, h, { fit: "fill" })
          .blur(20)
          .ensureAlpha()
          .raw()
          .toBuffer()
      : null;

  const rightExtW = rightPad + BLEND_R;
  const rightExt =
    rightExtW > 0
      ? await sharp(srcPng)
          .extract({ left: w - STRIP, top: 0, width: STRIP, height: h })
          .resize(rightExtW, h, { fit: "fill" })
          .blur(20)
          .ensureAlpha()
          .raw()
          .toBuffer()
      : null;

  const out = Buffer.alloc(targetW * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < targetW; x++) {
      const oi = (y * targetW + x) * 4;
      if (x < safeLeftPad && leftExt) {
        const ei = (y * leftExtW + x) * 4;
        out[oi] = leftExt[ei];
        out[oi + 1] = leftExt[ei + 1];
        out[oi + 2] = leftExt[ei + 2];
        out[oi + 3] = 255;
      } else if (x < safeLeftPad + BLEND_L && leftExt) {
        const srcX = x - safeLeftPad;
        const t = (srcX + 1) / (BLEND_L + 1);
        const s = t * t * (3 - 2 * t);
        const si = (y * w + srcX) * 4;
        const ei = (y * leftExtW + x) * 4;
        out[oi] = Math.round(leftExt[ei] * (1 - s) + rgbaData[si] * s);
        out[oi + 1] = Math.round(leftExt[ei + 1] * (1 - s) + rgbaData[si + 1] * s);
        out[oi + 2] = Math.round(leftExt[ei + 2] * (1 - s) + rgbaData[si + 2] * s);
        out[oi + 3] = 255;
      } else if (x < safeLeftPad + w - BLEND_R) {
        const srcX = x - safeLeftPad;
        const si = (y * w + srcX) * 4;
        out[oi] = rgbaData[si];
        out[oi + 1] = rgbaData[si + 1];
        out[oi + 2] = rgbaData[si + 2];
        out[oi + 3] = 255;
      } else if (x < safeLeftPad + w && rightExt) {
        const srcX = x - safeLeftPad;
        const k = x - (safeLeftPad + w - BLEND_R);
        const t = (k + 1) / (BLEND_R + 1);
        const s = t * t * (3 - 2 * t);
        const si = (y * w + srcX) * 4;
        const ei = (y * rightExtW + k) * 4;
        out[oi] = Math.round(rgbaData[si] * (1 - s) + rightExt[ei] * s);
        out[oi + 1] = Math.round(rgbaData[si + 1] * (1 - s) + rightExt[ei + 1] * s);
        out[oi + 2] = Math.round(rgbaData[si + 2] * (1 - s) + rightExt[ei + 2] * s);
        out[oi + 3] = 255;
      } else if (rightExt) {
        const k = x - (safeLeftPad + w - BLEND_R);
        const ei = (y * rightExtW + k) * 4;
        out[oi] = rightExt[ei];
        out[oi + 1] = rightExt[ei + 1];
        out[oi + 2] = rightExt[ei + 2];
        out[oi + 3] = 255;
      }
    }
  }
  return out;
}

async function stripBakedSupplierWhiteBars(pngBuf, w, h) {
  if (w < 60 || h < 60) return { pngBuf, w, h, stripped: false };
  const data = await sharp(pngBuf).ensureAlpha().raw().toBuffer();

  const rowWhite = (y) => {
    let ok = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) >= 249) ok++;
    }
    return ok / w >= 0.985;
  };
  const colWhite = (x) => {
    let ok = 0;
    for (let y = 0; y < h; y++) {
      const i = (y * w + x) * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) >= 249) ok++;
    }
    return ok / h >= 0.985;
  };

  let top = 0;
  while (top < h - 40 && rowWhite(top)) top++;
  let bot = h - 1;
  while (bot > top + 40 && rowWhite(bot)) bot--;
  let left = 0;
  while (left < w - 40 && colWhite(left)) left++;
  let right = w - 1;
  while (right > left + 40 && colWhite(right)) right--;

  const hasTop = top > 4;
  const hasBot = h - 1 - bot > 4;
  const hasLeft = left > 4;
  const hasRight = w - 1 - right > 4;

  // Non strippare se nessuno ha banda oppure se tutti e 4 hanno banda (packshot su bianco puro)
  if ((!hasTop && !hasBot && !hasLeft && !hasRight) || (hasTop && hasBot && hasLeft && hasRight)) {
    return { pngBuf, w, h, stripped: false };
  }

  let cutTop = 0;
  let cutBot = h - 1;
  let cutLeft = 0;
  let cutRight = w - 1;

  if (hasTop) {
    const ry = Math.min(bot, top + 3);
    let c = 0;
    for (let x = left; x <= right; x++) {
      const i = (ry * w + x) * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 246) c++;
    }
    if (c / (right - left + 1) >= 0.35) cutTop = Math.min(bot - 20, top + 2);
  }
  if (hasBot) {
    const ry = Math.max(top, bot - 3);
    let c = 0;
    for (let x = left; x <= right; x++) {
      const i = (ry * w + x) * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 246) c++;
    }
    if (c / (right - left + 1) >= 0.35) cutBot = Math.max(cutTop + 20, bot - 2);
  }
  if (hasLeft) {
    const rx = Math.min(right, left + 3);
    let c = 0;
    for (let y = top; y <= bot; y++) {
      const i = (y * w + rx) * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 246) c++;
    }
    if (c / (bot - top + 1) >= 0.35) cutLeft = Math.min(right - 20, left + 2);
  }
  if (hasRight) {
    const rx = Math.max(left, right - 3);
    let c = 0;
    for (let y = top; y <= bot; y++) {
      const i = (y * w + rx) * 4;
      if (Math.min(data[i], data[i + 1], data[i + 2]) < 246) c++;
    }
    if (c / (bot - top + 1) >= 0.35) cutRight = Math.max(cutLeft + 20, right - 2);
  }

  if (cutTop === 0 && cutBot === h - 1 && cutLeft === 0 && cutRight === w - 1) {
    return { pngBuf, w, h, stripped: false };
  }

  const nw = cutRight - cutLeft + 1;
  const nh = cutBot - cutTop + 1;
  const cropped = await sharp(pngBuf)
    .extract({ left: cutLeft, top: cutTop, width: nw, height: nh })
    .png()
    .toBuffer();
  return { pngBuf: cropped, w: nw, h: nh, stripped: true };
}

async function patchEdgeArtifact(pngBuf, w, h, sku) {
  if (sku !== "A4369" && sku !== "A4361") return pngBuf;
  const raw = await sharp(pngBuf).ensureAlpha().raw().toBuffer();

  if (sku === "A4369") {
    let rSum = 0;
    let gSum = 0;
    let bSum = 0;
    let cnt = 0;
    for (let y = 8; y <= Math.min(h - 1, 24); y++) {
      for (let x = 52; x <= Math.min(w - 1, 68); x++) {
        const i = (y * w + x) * 4;
        rSum += raw[i];
        gSum += raw[i + 1];
        bSum += raw[i + 2];
        cnt++;
      }
    }
    const avgR = Math.round(rSum / Math.max(1, cnt));
    const avgG = Math.round(gSum / Math.max(1, cnt));
    const avgB = Math.round(bSum / Math.max(1, cnt));
    const boxW = Math.min(w - 1, 48);
    const boxH = Math.min(h - 1, 60);
    const FEATHER = 6;

    for (let y = 0; y <= boxH + FEATHER && y < h; y++) {
      for (let x = 0; x <= boxW + FEATHER && x < w; x++) {
        const dx = Math.max(0, x - boxW);
        const dy = Math.max(0, y - boxH);
        const dist = Math.max(dx, dy);
        if (dist >= FEATHER) continue;
        const alpha = dist === 0 ? 1 : 1 - dist / FEATHER;
        const s = alpha * alpha * (3 - 2 * alpha);
        const i = (y * w + x) * 4;
        raw[i] = Math.round(raw[i] * (1 - s) + avgR * s);
        raw[i + 1] = Math.round(raw[i + 1] * (1 - s) + avgG * s);
        raw[i + 2] = Math.round(raw[i + 2] * (1 - s) + avgB * s);
        raw[i + 3] = 255;
      }
    }
  } else if (sku === "A4361") {
    const startX = Math.max(0, w - 58);
    const startY = Math.max(0, h - 55);
    for (let y = startY; y < h; y++) {
      for (let x = startX; x < w; x++) {
        const i = (y * w + x) * 4;
        raw[i] = 255;
        raw[i + 1] = 255;
        raw[i + 2] = 255;
        raw[i + 3] = 255;
      }
    }
  }

  return sharp(raw, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

async function seamlessStudioSquare(origBuf, sku) {
  const rawPng = await sharp(origBuf).flatten({ background: "#ffffff" }).png().toBuffer();
  const rawMeta = await sharp(rawPng).metadata();
  const cleaned = await stripBakedSupplierWhiteBars(rawPng, rawMeta.width, rawMeta.height);
  const w = cleaned.w;
  const h = cleaned.h;
  const basePng = await patchEdgeArtifact(cleaned.pngBuf, w, h, sku);

  if (Math.abs(w - h) <= 4) {
    const outWebp = await sharp(basePng)
      .resize(CANVAS_SIZE, CANVAS_SIZE, { fit: "fill", kernel: "lanczos3" })
      .webp({ quality: 90 })
      .toBuffer();
    return { outWebp, mode: "direct_square", origW: w, origH: h };
  }

  if (w > h) {
    const tw = CANVAS_SIZE;
    const th = Math.max(100, Math.min(CANVAS_SIZE, Math.round((h * CANVAS_SIZE) / w)));
    let resizer = sharp(basePng).resize(tw, th, { fit: "fill", kernel: "lanczos3" });
    if (CANVAS_SIZE / w > 1.3) resizer = resizer.sharpen({ sigma: 0.45 });
    const raw = await resizer.ensureAlpha().raw().toBuffer();
    const topPad = Math.round((CANVAS_SIZE - th) * 0.56);
    const squared = await extendVerticalTo(raw, tw, th, CANVAS_SIZE, topPad);
    const outWebp = await sharp(squared, {
      raw: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 4 },
    })
      .webp({ quality: 90 })
      .toBuffer();
    return { outWebp, mode: "landscape_extended", origW: w, origH: h, th };
  }

  // Portrait (es. gnomi A4384..A4386)
  const th = 880;
  const tw = Math.max(80, Math.min(960, Math.round((w * th) / h)));
  let resizer = sharp(basePng).resize(tw, th, { fit: "fill", kernel: "lanczos3" });
  if (th / h > 1.5) resizer = resizer.sharpen({ sigma: 0.55 });
  const raw = await resizer.ensureAlpha().raw().toBuffer();
  const leftPad = Math.floor((CANVAS_SIZE - tw) / 2);
  const wideRaw = await extendHorizontalTo(raw, tw, th, CANVAS_SIZE, leftPad);
  const squared = await extendVerticalTo(wideRaw, CANVAS_SIZE, th, CANVAS_SIZE, 60);
  const outWebp = await sharp(squared, {
    raw: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 4 },
  })
    .webp({ quality: 90 })
    .toBuffer();
  return { outWebp, mode: "portrait_extended", origW: w, origH: h, tw, th };
}

function sampleCorner3x3(data, width, height, cx, cy) {
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let aSum = 0;
  let count = 0;
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
  return {
    r: rSum / count,
    g: gSum / count,
    b: bSum / count,
    a: aSum / count,
  };
}

async function analyzeCorners(buf) {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  if (width < 10 || height < 10) {
    return { width, height, hasAlphaCorners: false, cornerMinRGB: 0, cornerMaxDiff: 255, avg: { r: 255, g: 255, b: 255 } };
  }

  const pts = [
    sampleCorner3x3(data, width, height, 2, 2),
    sampleCorner3x3(data, width, height, width - 3, 2),
    sampleCorner3x3(data, width, height, 2, height - 3),
    sampleCorner3x3(data, width, height, width - 3, height - 3),
  ];

  const hasAlphaCorners = pts.some((p) => p.a < 20);
  const opaquePts = pts.filter((p) => p.a >= 20);
  if (opaquePts.length === 0) {
    return {
      width,
      height,
      hasAlphaCorners: true,
      cornerMinRGB: 255,
      cornerMaxDiff: 0,
      avg: { r: 255, g: 255, b: 255 },
    };
  }

  const rs = opaquePts.map((p) => p.r);
  const gs = opaquePts.map((p) => p.g);
  const bs = opaquePts.map((p) => p.b);
  const cornerMinRGB = Math.min(...rs, ...gs, ...bs);
  const cornerMaxDiff = Math.max(
    Math.max(...rs) - Math.min(...rs),
    Math.max(...gs) - Math.min(...gs),
    Math.max(...bs) - Math.min(...bs)
  );
  const avg = {
    r: Math.round(rs.reduce((a, b) => a + b, 0) / rs.length),
    g: Math.round(gs.reduce((a, b) => a + b, 0) / gs.length),
    b: Math.round(bs.reduce((a, b) => a + b, 0) / bs.length),
  };

  return { width, height, hasAlphaCorners, cornerMinRGB, cornerMaxDiff, avg };
}

async function hasPerimeterContent(buf, corners) {
  if (corners.hasAlphaCorners) return false;
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  if (w < 10 || h < 10) return false;
  const { r: bgR, g: bgG, b: bgB } = corners.avg;
  let diffBorder = 0;
  let total = 0;
  for (let x = 0; x < w; x++) {
    for (const y of [1, h - 2]) {
      const i = (y * w + x) * 4;
      if (
        Math.max(Math.abs(data[i] - bgR), Math.abs(data[i + 1] - bgG), Math.abs(data[i + 2] - bgB)) > 12
      ) {
        diffBorder++;
      }
      total++;
    }
  }
  for (let y = 0; y < h; y++) {
    for (const x of [1, w - 2]) {
      const i = (y * w + x) * 4;
      if (
        Math.max(Math.abs(data[i] - bgR), Math.abs(data[i + 1] - bgG), Math.abs(data[i + 2] - bgB)) > 12
      ) {
        diffBorder++;
      }
      total++;
    }
  }
  return total > 0 && diffBorder / total > 0.03;
}

const VILLEROY_KEEP_0_1 = new Set([
  "14-8332-3714",
  "14-8332-3661",
  "14-8332-3660",
  "14-8585-2680",
  "14-8332-3600",
]);

const VILLEROY_KEEP_0_2 = new Set([
  "14-8602-6560",
  "14-8585-6165",
  "14-8327-6648",
  "14-8332-6152",
]);

const VILLEROY_IMG1_OVERRIDES = {
  "VB-2295": "products/villeroy/14_8585_2295_3.webp",
  "VB-2220": "products/villeroy/VB-2220_2.webp",
  "VB-2905": "products/villeroy/14_8585_2905_2.jpg",
};

const GUESS_CONTEXT_IMG1_SKUS = new Set([
  "W1161G2",
  "JUBB06091JWYGS",
  "GW0974G1",
  "JUBN02245JWRHT/U",
  "JUBN02245JWYGEMT/U",
  "W0799G2",
  "W1161G1",
]);

const LOCMAN_CONTEXT_IMG1_SKUS = new Set(["0253R14R-RRMWRG2PA"]);

async function isBoxedContextInGrid(buf) {
  try {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];
    const t = await sharp(buf)
      .flatten({ background: { r: bgR, g: bgG, b: bgB } })
      .trim({ threshold: 10 })
      .toBuffer({ resolveWithObject: true });
    const tw = t.info.width;
    const th = t.info.height;
    if (tw < 80 || th < 80) return false;
    const left = Math.max(0, -(t.info.trimOffsetLeft || 0));
    const top = Math.max(0, -(t.info.trimOffsetTop || 0));
    let topNonBg = 0;
    let botNonBg = 0;
    const ryTop = Math.min(info.height - 1, top + 2);
    const ryBot = Math.max(0, top + th - 3);
    for (let x = left; x < left + tw; x++) {
      const iT = (ryTop * info.width + x) * 4;
      if (Math.max(Math.abs(data[iT] - bgR), Math.abs(data[iT + 1] - bgG), Math.abs(data[iT + 2] - bgB)) > 15) {
        topNonBg++;
      }
      const iB = (ryBot * info.width + x) * 4;
      if (Math.max(Math.abs(data[iB] - bgR), Math.abs(data[iB + 1] - bgG), Math.abs(data[iB + 2] - bgB)) > 15) {
        botNonBg++;
      }
    }
    return topNonBg / tw > 0.5 || botNonBg / tw > 0.5;
  } catch (_) {
    return false;
  }
}

async function fetchAllApproved() {
  const PAGE = 1000;
  const all = [];
  for (let offset = 0; offset < 10000; offset += PAGE) {
    const { data, error } = await sb
      .from("oroeco_products")
      .select("id, sku, brand_name, images")
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

async function processOne(p, context = {}) {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const origUrl = imgs[0];
  if (!origUrl) return { status: "skipped_no_img", brand: p.brand_name, sku: p.sku };

  if (RESTORE_CONTEXT_IMG1) {
    if (imgs.length < 2 || !imgs[1] || !imgs[1].includes("/products/grid-v")) {
      return { status: "skipped_not_grid_img1", brand: p.brand_name, sku: p.sku };
    }

    const sku = String(p.sku || "").trim();
    const raw = sku.toLowerCase();
    const safeSku = slugify(sku);
    const us = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const upperSku = sku.toUpperCase();

    let foundOrigKey = null;

    if (p.brand_name === "Villeroy & Boch") {
      const map = context.restoreR2?.["Villeroy & Boch"];
      const ov = VILLEROY_IMG1_OVERRIDES[upperSku];
      if (ov) {
        const ovBase = ov.split("/").pop().toLowerCase();
        foundOrigKey = map?.get(ovBase) || null;
      } else {
        const cand = VILLEROY_KEEP_0_1.has(sku)
          ? [`${us}_2.jpg`, `${us}_2.webp`]
          : VILLEROY_KEEP_0_2.has(sku)
            ? [`${us}_3.jpg`, `${us}_3.webp`]
            : [`${us}_3.webp`, `${us}_3.jpg`, `${us}_2.webp`, `${us}_2.jpg`];
        foundOrigKey = cand.map((c) => map?.get(c)).find(Boolean) || null;
      }
      if (!foundOrigKey) {
        throw new Error(`Originale R2 img1 mancante per Villeroy ${sku}`);
      }
    } else if (p.brand_name === "Unoaerre") {
      const map = context.restoreR2?.Unoaerre;
      const cand = [
        `${raw}_2.jpg`, `${raw}_2.webp`, `${raw}_2.png`,
        `${us}_2.jpg`, `${us}_2.webp`,
        `${safeSku}-02.jpg`, `${safeSku}-02.webp`,
      ];
      foundOrigKey = cand.map((c) => map?.get(c)).find(Boolean) || null;
      if (!foundOrigKey) {
        throw new Error(`Originale R2 img1 mancante per Unoaerre ${sku}`);
      }
    } else if (p.brand_name === "Guess" && GUESS_CONTEXT_IMG1_SKUS.has(upperSku)) {
      const map = context.restoreR2?.Guess;
      const cand = [`${safeSku}-02.webp`, `${safeSku}-02.jpg`, `${raw}-02.webp`, `${raw}_2.webp`];
      foundOrigKey = cand.map((c) => map?.get(c)).find(Boolean) || null;
      if (!foundOrigKey) {
        throw new Error(`Originale R2 img1 mancante per Guess ${sku}`);
      }
    } else if (p.brand_name === "Locman" && LOCMAN_CONTEXT_IMG1_SKUS.has(upperSku)) {
      const map = context.restoreR2?.Locman;
      const cand = [`${safeSku}-02.webp`, `${safeSku}-02.jpg`, `${raw}-02.webp`];
      foundOrigKey = cand.map((c) => map?.get(c)).find(Boolean) || null;
      if (!foundOrigKey) {
        throw new Error(`Originale R2 img1 mancante per Locman ${sku}`);
      }
    } else if (p.brand_name === "Stroili") {
      const buf1 = await fetchWithRetry(imgs[1]);
      const boxed = await isBoxedContextInGrid(buf1);
      if (boxed) {
        console.log(`⚠️ [audit-stroili-img1] Possibile foto di contesto rimpicciolita: ${sku}`);
        return { status: "stroili_boxed_hit", brand: p.brand_name, sku };
      }
      return { status: "skipped_stroili_ok", brand: p.brand_name, sku };
    } else {
      return { status: "skipped_packshot_img1", brand: p.brand_name, sku };
    }

    const restoredUrl = `${R2_PUBLIC_URL}/${foundOrigKey}`;
    const nextImages = [imgs[0], restoredUrl, ...imgs.slice(2)];
    const { error: upErr } = await sb
      .from("oroeco_products")
      .update({ images: nextImages, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (upErr) throw upErr;

    console.log(`↩️ [restore-img1] ${p.brand_name} ${sku}: -> ${foundOrigKey}`);
    return { status: "restored_context_img1", brand: p.brand_name, sku, origKey: foundOrigKey };
  }

  if (REBUILD_SHADOWS_V4) {
    const map = context.r2Index?.[p.brand_name];
    if (!map) return { status: "skipped_no_r2_prefix", brand: p.brand_name, sku: p.sku };

    const brandSlug = slugify(p.brand_name);
    const safeSku = slugify(p.sku);
    const raw = String(p.sku || "").toLowerCase();
    const us = raw.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const nextImages = [...imgs];
    let changed = false;
    let img0_v4 = 0;
    let img1_v4 = 0;
    const details = [];

    if (origUrl.includes("/products/grid-v") && !origUrl.includes("/products/grid-v4/")) {
      const candidates0 = [
        ...(p.sku === "GB015 BLACK" ? ["gb015-black-clean.webp"] : []),
        `${raw}_1.jpg`, `${raw}_1.webp`, `${raw}_1.png`,
        `${us}_1.webp`, `${us}_1.jpg`, `${us}_1.png`,
        `${safeSku}-01.webp`, `${safeSku}-01.jpg`, `${safeSku}-01.png`,
        `${safeSku}_1.webp`, `${safeSku}_1.jpg`,
        `${raw}-01.webp`, `${raw}-01.jpg`,
        `${raw}.jpg`, `${raw}.webp`, `${safeSku}.webp`, `${safeSku}.jpg`,
      ];
      const foundKey0 = candidates0.map((c) => map.get(c)).find(Boolean);
      if (foundKey0) {
        const buf0 = await fetchWithRetry(`${R2_PUBLIC_URL}/${foundKey0}`);
        const corners0 = await analyzeCorners(buf0);
        const isCaseA0 =
          corners0.hasAlphaCorners ||
          (corners0.cornerMinRGB >= 230 && corners0.cornerMaxDiff <= 14);
        if (isCaseA0) {
          const norm0 = await shadowSafeNormalizeFromOriginal(buf0, corners0);
          const r2Key0 = `products/grid-v4/${brandSlug}/${safeSku}-01.webp`;
          await uploadToR2(r2Key0, norm0.outWebp);
          nextImages[0] = `${R2_PUBLIC_URL}/${r2Key0}`;
          changed = true;
          img0_v4 = 1;
          details.push(`img0:core=${norm0.coreW}x${norm0.coreH}->t${norm0.opticalTarget}(s=${norm0.scale.toFixed(2)})`);
        }
      }
    }

    if (
      p.brand_name !== "Villeroy & Boch" &&
      p.brand_name !== "Unoaerre" &&
      imgs.length >= 2 &&
      imgs[1] &&
      imgs[1].includes("/products/grid-v") &&
      !imgs[1].includes("/products/grid-v4/")
    ) {
      const candidates1 = [
        `${raw}_2.jpg`, `${raw}_2.webp`, `${raw}_2.png`,
        `${us}_2.webp`, `${us}_2.jpg`,
        `${safeSku}-02.webp`, `${safeSku}-02.jpg`,
        `${safeSku}_2.webp`, `${safeSku}_2.jpg`,
        `${raw}-02.webp`, `${raw}-02.jpg`,
      ];
      const foundKey1 = candidates1.map((c) => map.get(c)).find(Boolean);
      if (foundKey1) {
        const buf1 = await fetchWithRetry(`${R2_PUBLIC_URL}/${foundKey1}`);
        const corners1 = await analyzeCorners(buf1);
        const isCaseA1 =
          (corners1.hasAlphaCorners ||
            (corners1.cornerMinRGB >= 230 && corners1.cornerMaxDiff <= 14)) &&
          !(await hasPerimeterContent(buf1, corners1));
        if (isCaseA1) {
          const norm1 = await shadowSafeNormalizeFromOriginal(buf1, corners1);
          const r2Key1 = `products/grid-v4/${brandSlug}/${safeSku}-02.webp`;
          await uploadToR2(r2Key1, norm1.outWebp);
          nextImages[1] = `${R2_PUBLIC_URL}/${r2Key1}`;
          changed = true;
          img1_v4 = 1;
          details.push(`img1:core=${norm1.coreW}x${norm1.coreH}->t${norm1.opticalTarget}(s=${norm1.scale.toFixed(2)})`);
        }
      }
    }

    if (changed) {
      const { error: upErr } = await sb
        .from("oroeco_products")
        .update({ images: nextImages, updated_at: new Date().toISOString() })
        .eq("id", p.id);
      if (upErr) throw upErr;
      console.log(`🌤️ [grid-v4] ${p.brand_name} ${p.sku}: ${details.join(" | ")}`);
    }

    return {
      status: "rebuild_shadows_v4",
      img0_v4,
      img1_v4,
      brand: p.brand_name,
      sku: p.sku,
    };
  }

  if (SQUARE_CUOREMATTO_V4) {
    if (p.brand_name !== "Cuorematto") {
      return { status: "skipped_not_cuorematto", brand: p.brand_name, sku: p.sku };
    }
    const { cleanMap, origMap } = context.cuoreIndex || {};
    const safeSku = slugify(p.sku);
    const raw = String(p.sku || "").toLowerCase();

    const cleanKey = cleanMap?.get(safeSku) || cleanMap?.get(raw);
    const origKey =
      origMap?.get(raw) ||
      origMap?.get(safeSku) ||
      origMap?.get(`${raw}_babbo`) ||
      origMap?.get(`${safeSku}_babbo`);

    const chosenKey = cleanKey || origKey;
    const srcUrl = chosenKey ? `${R2_PUBLIC_URL}/${chosenKey}` : origUrl;
    const buf = await fetchWithRetry(srcUrl);
    const sq = await seamlessStudioSquare(buf, p.sku);
    const suffix = String(p.sku || "").toUpperCase() === "A4361" ? "-v2" : "";
    const r2Key = `products/grid-v5/cuorematto/${safeSku}${suffix}-01.webp`;
    await uploadToR2(r2Key, sq.outWebp);
    const newUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    const nextImages = [newUrl, ...imgs.slice(1)];

    const { error: upErr } = await sb
      .from("oroeco_products")
      .update({ images: nextImages, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (upErr) throw upErr;

    console.log(`🖼️ [cuore-v5] ${p.sku}: ${sq.origW}x${sq.origH} (${sq.mode}) from=${chosenKey || "current"} -> 1000x1000`);
    return {
      status: "cuore_v4",
      brand: p.brand_name,
      sku: p.sku,
      mode: sq.mode,
    };
  }

  if (POLISH_V3) {
    const brandSlug = slugify(p.brand_name);
    const safeSku = slugify(p.sku);
    const nextImages = [...imgs];
    let changed = false;
    let img0_v3 = 0;
    let img1_v3_normalized = 0;
    let img1_case_b_preserved = 0;
    const details = [];

    const isCandidate0 =
      (origUrl.includes("/products/grid-v1/") ||
        origUrl.includes("/products/grid-v2/") ||
        origUrl.includes("gb015-black-clean.webp")) &&
      !origUrl.includes("/products/grid-v3/");

    if (isCandidate0) {
      const buf0 = await fetchWithRetry(origUrl);
      const corners0 = await analyzeCorners(buf0);
      const bg0 = getBackgroundColor(corners0);
      const m0 = await measureTrimmedSize(buf0, bg0, corners0.width, corners0.height);
      const opticalTarget0 = computeOpticalTarget(m0.tw, m0.th);

      if (
        origUrl.includes("gb015-black-clean.webp") ||
        Math.abs(Math.max(m0.tw, m0.th) - opticalTarget0) > 18
      ) {
        const norm0 = await safeTrimAndNormalize(buf0, corners0);
        const r2Key0 = `products/grid-v3/${brandSlug}/${safeSku}-01.webp`;
        await uploadToR2(r2Key0, norm0.outWebp);
        nextImages[0] = `${R2_PUBLIC_URL}/${r2Key0}`;
        changed = true;
        img0_v3 = 1;
        details.push(`img0:${m0.tw}x${m0.th}->t${norm0.opticalTarget}(${norm0.outW}x${norm0.outH})`);
      }
    }

    if (
      p.brand_name !== "Villeroy & Boch" &&
      p.brand_name !== "Unoaerre" &&
      imgs.length >= 2 &&
      imgs[1] &&
      !imgs[1].includes("/products/grid-v3/")
    ) {
      const buf1 = await fetchWithRetry(imgs[1]);
      const corners1 = await analyzeCorners(buf1);
      const isCaseA1 =
        (corners1.hasAlphaCorners ||
          (corners1.cornerMinRGB >= 230 && corners1.cornerMaxDiff <= 14)) &&
        !(await hasPerimeterContent(buf1, corners1));

      if (isCaseA1) {
        const norm1 = await safeTrimAndNormalize(buf1, corners1);
        const r2Key1 = `products/grid-v3/${brandSlug}/${safeSku}-02.webp`;
        await uploadToR2(r2Key1, norm1.outWebp);
        nextImages[1] = `${R2_PUBLIC_URL}/${r2Key1}`;
        changed = true;
        img1_v3_normalized = 1;
        details.push(`img1:${norm1.tw}x${norm1.th}->t${norm1.opticalTarget}(${norm1.outW}x${norm1.outH})`);
      } else {
        img1_case_b_preserved = 1;
      }
    }

    if (changed) {
      const { error: upErr } = await sb
        .from("oroeco_products")
        .update({ images: nextImages, updated_at: new Date().toISOString() })
        .eq("id", p.id);
      if (upErr) throw upErr;
      console.log(`✨ [grid-v3] ${p.brand_name} ${p.sku}: ${details.join(" | ")}`);
    }

    return {
      status: "polish_v3",
      img0_v3,
      img1_v3_normalized,
      img1_case_b_preserved,
      brand: p.brand_name,
      sku: p.sku,
    };
  }

  if (FIX_UNDERSIZED) {
    if (!origUrl.includes("/products/grid-v1/")) {
      return { status: "skipped_not_v1", brand: p.brand_name, sku: p.sku };
    }
    const v1Buf = await fetchWithRetry(origUrl);
    const corners = await analyzeCorners(v1Buf);
    const bg =
      corners.hasAlphaCorners || corners.cornerMinRGB >= 248
        ? { r: 255, g: 255, b: 255, alpha: 1 }
        : { r: corners.avg.r, g: corners.avg.g, b: corners.avg.b, alpha: 1 };

    let trimmed;
    try {
      trimmed = await sharp(v1Buf)
        .flatten({ background: bg })
        .trim({ threshold: 20 })
        .toBuffer({ resolveWithObject: true });
    } catch (_) {
      return { status: "skipped_trim_err", brand: p.brand_name, sku: p.sku };
    }

    const tw = trimmed.info.width;
    const th = trimmed.info.height;
    if (tw < 32 || th < 32 || Math.max(tw, th) >= UNDERSIZED_THRESHOLD) {
      return { status: "skipped_already_ok", brand: p.brand_name, sku: p.sku };
    }

    const rawScale = Math.min(TARGET_BOX / tw, TARGET_BOX / th);
    const scale = Math.min(rawScale, MAX_UPSCALE);
    const outW = Math.max(1, Math.min(CANVAS_SIZE, Math.round(tw * scale)));
    const outH = Math.max(1, Math.min(CANVAS_SIZE, Math.round(th * scale)));

    let resizer = sharp(trimmed.data).resize(outW, outH, {
      fit: "inside",
      kernel: "lanczos3",
    });
    if (scale > 1.5) resizer = resizer.sharpen({ sigma: 0.5 });
    const resizedSubject = await resizer.png().toBuffer();

    const outWebp = await sharp({
      create: {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        channels: 4,
        background: bg,
      },
    })
      .composite([{ input: resizedSubject, gravity: "center" }])
      .webp({ quality: 88 })
      .toBuffer();

    const brandSlug = slugify(p.brand_name);
    const safeSku = slugify(p.sku);
    const r2Key = `products/grid-v2/${brandSlug}/${safeSku}-01.webp`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: r2Key,
        Body: outWebp,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const newUrl = `${R2_PUBLIC_URL}/${r2Key}`;
    const nextImages = [newUrl, ...imgs.slice(1)];
    const { error: upErr } = await sb
      .from("oroeco_products")
      .update({ images: nextImages, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (upErr) throw upErr;

    console.log(`🔧 [grid-v2] ${p.brand_name} ${p.sku}: ${tw}x${th} -> ${outW}x${outH} (scale=${scale.toFixed(2)}) -> ${newUrl}`);
    return {
      status: "case_a_normalized",
      brand: p.brand_name,
      sku: p.sku,
      url: newUrl,
    };
  }

  if (
    !FORCE &&
    (origUrl.includes("/products/grid-v1/") ||
      origUrl.includes("/products/grid-v2/") ||
      origUrl.includes("/products/grid-v3/") ||
      origUrl.includes("/products/grid-v4/") ||
      origUrl.includes("/products/grid-v5/"))
  ) {
    return { status: "skipped_already_v1", brand: p.brand_name, sku: p.sku };
  }

  const origBuf = await fetchWithRetry(origUrl);
  const corners = await analyzeCorners(origBuf);

  const isCaseA =
    corners.hasAlphaCorners ||
    (corners.cornerMinRGB >= 230 && corners.cornerMaxDiff <= 14);

  if (!isCaseA) {
    return {
      status: "case_b_preserved",
      brand: p.brand_name,
      sku: p.sku,
      cornerMinRGB: Math.round(corners.cornerMinRGB),
      cornerMaxDiff: Math.round(corners.cornerMaxDiff),
    };
  }

  const bg =
    corners.hasAlphaCorners || corners.cornerMinRGB >= 248
      ? { r: 255, g: 255, b: 255, alpha: 1 }
      : { r: corners.avg.r, g: corners.avg.g, b: corners.avg.b, alpha: 1 };

  const flatBuf = await sharp(origBuf).flatten({ background: bg }).png().toBuffer();

  let subjectBuf = flatBuf;
  let tw = corners.width;
  let th = corners.height;

  try {
    const trimmed = await sharp(flatBuf)
      .trim({ threshold: 20 })
      .toBuffer({ resolveWithObject: true });
    if (trimmed.info.width >= 32 && trimmed.info.height >= 32) {
      subjectBuf = trimmed.data;
      tw = trimmed.info.width;
      th = trimmed.info.height;
    }
  } catch (_) {
    // fallback all'immagine flattenata intera
  }

  const rawScale = Math.min(TARGET_BOX / tw, TARGET_BOX / th);
  const scale = Math.min(rawScale, MAX_UPSCALE);
  const outW = Math.max(1, Math.min(CANVAS_SIZE, Math.round(tw * scale)));
  const outH = Math.max(1, Math.min(CANVAS_SIZE, Math.round(th * scale)));

  let resizer = sharp(subjectBuf).resize(outW, outH, {
    fit: "inside",
    kernel: "lanczos3",
  });
  if (scale > 1.5) resizer = resizer.sharpen({ sigma: 0.5 });
  const resizedSubject = await resizer.png().toBuffer();

  const outWebp = await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: resizedSubject, gravity: "center" }])
    .webp({ quality: 88 })
    .toBuffer();

  const brandSlug = slugify(p.brand_name);
  const safeSku = slugify(p.sku);
  const r2Key = `products/grid-v1/${brandSlug}/${safeSku}-01.webp`;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: r2Key,
      Body: outWebp,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const newUrl = `${R2_PUBLIC_URL}/${r2Key}`;
  const nextImages = [newUrl, ...imgs.slice(1)];

  const { error: upErr } = await sb
    .from("oroeco_products")
    .update({ images: nextImages, updated_at: new Date().toISOString() })
    .eq("id", p.id);
  if (upErr) throw upErr;

  return {
    status: "case_a_normalized",
    brand: p.brand_name,
    sku: p.sku,
    url: newUrl,
  };
}

(async () => {
  const allApproved = await fetchAllApproved();
  let targets = allApproved.filter((p) => !/nihama/i.test(p.brand_name || ""));

  const context = {};
  if (RESTORE_CONTEXT_IMG1) {
    console.log("Indicizzazione originali R2 per --restore-context-img1...");
    const restoreR2 = {};
    for (const [bName, pref] of [
      ["Villeroy & Boch", "products/villeroy/"],
      ["Unoaerre", "products/unoaerre/"],
      ["Guess", "products/guess/"],
      ["Locman", "products/locman/"],
    ]) {
      const keys = await listAllR2Keys(pref);
      restoreR2[bName] = new Map(keys.map((k) => [k.split("/").pop().toLowerCase(), k]));
      console.log(`  R2 ${bName}: ${keys.length} oggetti`);
    }
    context.restoreR2 = restoreR2;
    targets = targets.filter((p) => Array.isArray(p.images) && p.images[1]?.includes("/products/grid-v"));
  }

  if (REBUILD_SHADOWS_V4) {
    console.log("Indicizzazione originali R2 per --rebuild-shadows-v4...");
    const r2Index = {};
    for (const [bName, pref] of Object.entries(BRAND_R2_PREFIXES)) {
      const keys = await listAllR2Keys(pref);
      r2Index[bName] = new Map(keys.map((k) => [k.split("/").pop().toLowerCase(), k]));
      console.log(`  R2 ${bName}: ${keys.length} oggetti`);
    }
    context.r2Index = r2Index;
  }

  if (SQUARE_CUOREMATTO_V4) {
    console.log("Indicizzazione R2 Cuorematto per --square-cuorematto-v4...");
    const allCuoreKeys = await listAllR2Keys("products/cuorematto/");
    const cleanMap = new Map();
    const origMap = new Map();
    for (const k of allCuoreKeys) {
      const file = k.split("/").pop().toLowerCase();
      const base = file.replace(/\.[^.]+$/, "");
      if (k.includes("/clean-v1/")) {
        cleanMap.set(base, k);
      } else {
        origMap.set(base, k);
      }
    }
    context.cuoreIndex = { cleanMap, origMap };
    targets = targets.filter((p) => p.brand_name === "Cuorematto" && (!ONLY_SKU || String(p.sku || "").toUpperCase() === ONLY_SKU));
    console.log(`  Cuorematto: ${cleanMap.size} clean-v1, ${origMap.size} originali, ${targets.length} prodotti target`);
  }

  console.log(
    `Prodotti approved totali=${allApproved.length}, target=${targets.length}, concurrency=${CONCURRENCY}, force=${FORCE}`
  );

  const statsByBrand = {};
  const errors = [];
  let done = 0;

  const ensureBrandStats = (b) => {
    if (!statsByBrand[b]) {
      statsByBrand[b] = {
        case_a_normalized: 0,
        case_b_preserved: 0,
        img0_v3: 0,
        img1_v3_normalized: 0,
        img1_case_b_preserved: 0,
        img0_v4: 0,
        img1_v4: 0,
        cuore_v4: 0,
        restored_context_img1: 0,
        stroili_boxed_hits: 0,
        skipped: 0,
        errors: 0,
      };
    }
    return statsByBrand[b];
  };

  let cursor = 0;
  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= targets.length) break;
      const p = targets[idx];
      try {
        const res = await processOne(p, context);
        const st = ensureBrandStats(p.brand_name || "NULL");
        if (res.status === "restored_context_img1") {
          st.restored_context_img1++;
        } else if (res.status === "stroili_boxed_hit") {
          st.stroili_boxed_hits++;
        } else if (res.status === "rebuild_shadows_v4") {
          st.img0_v4 += res.img0_v4;
          st.img1_v4 += res.img1_v4;
          if (res.img0_v4 === 0 && res.img1_v4 === 0) st.skipped++;
        } else if (res.status === "cuore_v4") {
          st.cuore_v4++;
        } else if (res.status === "polish_v3") {
          st.img0_v3 += res.img0_v3;
          st.img1_v3_normalized += res.img1_v3_normalized;
          st.img1_case_b_preserved += res.img1_case_b_preserved;
          if (res.img0_v3 === 0 && res.img1_v3_normalized === 0) st.skipped++;
        } else if (res.status === "case_a_normalized") st.case_a_normalized++;
        else if (res.status === "case_b_preserved") st.case_b_preserved++;
        else st.skipped++;
      } catch (err) {
        const st = ensureBrandStats(p.brand_name || "NULL");
        st.errors++;
        errors.push({ sku: p.sku, brand: p.brand_name, error: err.message });
        console.error(`❌ ${p.brand_name} ${p.sku}: ${err.message}`);
      }
      done++;
      if (done % 100 === 0 || done === targets.length) {
        console.log(`Progress: ${done}/${targets.length}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const report = {
    generated_at: new Date().toISOString(),
    mode: RESTORE_CONTEXT_IMG1
      ? "restore_context_img1"
      : REBUILD_SHADOWS_V4
        ? "rebuild_shadows_v4"
        : SQUARE_CUOREMATTO_V4
          ? "square_cuorematto_v4"
          : POLISH_V3
            ? "polish_v3"
            : FIX_UNDERSIZED
              ? "fix_undersized"
              : "initial",
    total_approved: allApproved.length,
    targets_processed: targets.length,
    totals: {
      case_a_normalized: Object.values(statsByBrand).reduce((a, c) => a + c.case_a_normalized, 0),
      case_b_preserved: Object.values(statsByBrand).reduce((a, c) => a + c.case_b_preserved, 0),
      img0_v3: Object.values(statsByBrand).reduce((a, c) => a + c.img0_v3, 0),
      img1_v3_normalized: Object.values(statsByBrand).reduce((a, c) => a + c.img1_v3_normalized, 0),
      img1_case_b_preserved: Object.values(statsByBrand).reduce((a, c) => a + c.img1_case_b_preserved, 0),
      img0_v4: Object.values(statsByBrand).reduce((a, c) => a + c.img0_v4, 0),
      img1_v4: Object.values(statsByBrand).reduce((a, c) => a + c.img1_v4, 0),
      cuore_v4: Object.values(statsByBrand).reduce((a, c) => a + c.cuore_v4, 0),
      restored_context_img1: Object.values(statsByBrand).reduce((a, c) => a + c.restored_context_img1, 0),
      stroili_boxed_hits: Object.values(statsByBrand).reduce((a, c) => a + c.stroili_boxed_hits, 0),
      skipped: Object.values(statsByBrand).reduce((a, c) => a + c.skipped, 0),
      errors: errors.length,
    },
    by_brand: statsByBrand,
    errors,
  };

  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");
  console.log("\n=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
})();
