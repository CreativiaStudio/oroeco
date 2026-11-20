require("./_loadEnv");
const fs = require("fs");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
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

const CANVAS_SIZE = 1000;
const TARGET_AREA = 340000;
const MIN_OPTICAL_SIDE = 640;
const MAX_OPTICAL_SIDE = 820;
const MAX_UPSCALE_V4 = 4.25;
const CORE_TRIM_THRESHOLD = 22;
const EDGE_FEATHER_PX = 48;
const ORIG_EDGE_FEATHER_PX = 28;

function computeOpticalTarget(tw, th) {
  const r = Math.max(Math.max(1, tw) / Math.max(1, th), Math.max(1, th) / Math.max(1, tw));
  return Math.max(MIN_OPTICAL_SIDE, Math.min(MAX_OPTICAL_SIDE, Math.round(Math.sqrt(TARGET_AREA * r))));
}

function sampleCorner3x3(data, width, height, cx, cy) {
  let rSum = 0, gSum = 0, bSum = 0, aSum = 0, count = 0;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = Math.min(width - 1, Math.max(0, cx + dx));
      const y = Math.min(height - 1, Math.max(0, cy + dy));
      const idx = (y * width + x) * 4;
      rSum += data[idx]; gSum += data[idx + 1]; bSum += data[idx + 2]; aSum += data[idx + 3]; count++;
    }
  }
  return { r: rSum / count, g: gSum / count, b: bSum / count, a: aSum / count };
}

async function shadowSafeNormalize(origBuf) {
  const { data: cRaw, info: cInfo } = await sharp(origBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pts = [
    sampleCorner3x3(cRaw, cInfo.width, cInfo.height, 2, 2),
    sampleCorner3x3(cRaw, cInfo.width, cInfo.height, cInfo.width - 3, 2),
    sampleCorner3x3(cRaw, cInfo.width, cInfo.height, 2, cInfo.height - 3),
    sampleCorner3x3(cRaw, cInfo.width, cInfo.height, cInfo.width - 3, cInfo.height - 3),
  ].filter((p) => p.a >= 20);
  const bg =
    !pts.length || Math.min(...pts.map((p) => Math.min(p.r, p.g, p.b))) >= 248
      ? { r: 255, g: 255, b: 255, alpha: 1 }
      : {
          r: Math.round(pts.reduce((a, b) => a + b.r, 0) / pts.length),
          g: Math.round(pts.reduce((a, b) => a + b.g, 0) / pts.length),
          b: Math.round(pts.reduce((a, b) => a + b.b, 0) / pts.length),
          alpha: 1,
        };

  const flatRaw = await sharp(origBuf).flatten({ background: bg }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const origW = flatRaw.info.width, origH = flatRaw.info.height;
  const data = Buffer.from(flatRaw.data);

  let minTop = 255, minBot = 255, minLeft = 255, minRight = 255;
  for (let x = 0; x < origW; x++) {
    const iT = x * 4, iB = ((origH - 1) * origW + x) * 4;
    minTop = Math.min(minTop, data[iT], data[iT + 1], data[iT + 2]);
    minBot = Math.min(minBot, data[iB], data[iB + 1], data[iB + 2]);
  }
  for (let y = 0; y < origH; y++) {
    const iL = y * origW * 4, iR = (y * origW + (origW - 1)) * 4;
    minLeft = Math.min(minLeft, data[iL], data[iL + 1], data[iL + 2]);
    minRight = Math.min(minRight, data[iR], data[iR + 1], data[iR + 2]);
  }
  const fT = 140 < minTop && minTop < 250, fB = 140 < minBot && minBot < 250;
  const fL = 140 < minLeft && minLeft < 250, fR = 140 < minRight && minRight < 250;
  if (fT || fB || fL || fR) {
    for (let y = 0; y < origH; y++) {
      const inT = fT && y < ORIG_EDGE_FEATHER_PX, inB = fB && origH - 1 - y < ORIG_EDGE_FEATHER_PX;
      for (let x = 0; x < origW; x++) {
        const inL = fL && x < ORIG_EDGE_FEATHER_PX, inR = fR && origW - 1 - x < ORIG_EDGE_FEATHER_PX;
        if (!inT && !inB && !inL && !inR) continue;
        let s = 1;
        if (inT) { const t = y / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        if (inB) { const t = (origH - 1 - y) / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        if (inL) { const t = x / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        if (inR) { const t = (origW - 1 - x) / ORIG_EDGE_FEATHER_PX; s = Math.min(s, t * t * (3 - 2 * t)); }
        const i = (y * origW + x) * 4;
        if (s < 1 && Math.min(data[i], data[i + 1], data[i + 2]) >= 140) {
          data[i] = Math.round(bg.r + (data[i] - bg.r) * s);
          data[i + 1] = Math.round(bg.g + (data[i + 1] - bg.g) * s);
          data[i + 2] = Math.round(bg.b + (data[i + 2] - bg.b) * s);
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
      coreW = coreTrim.info.width; coreH = coreTrim.info.height;
      coreLeft = Math.max(0, -(coreTrim.info.trimOffsetLeft || 0));
      coreTop = Math.max(0, -(coreTrim.info.trimOffsetTop || 0));
    }
  } catch (_) {}

  const opticalTarget = computeOpticalTarget(coreW, coreH);
  const scale = Math.min(Math.min(opticalTarget / coreW, opticalTarget / coreH), MAX_UPSCALE_V4);
  const scaledW = Math.max(1, Math.round(origW * scale));
  const scaledH = Math.max(1, Math.round(origH * scale));
  let resizer = sharp(flatPng).resize(scaledW, scaledH, { fit: "fill", kernel: "lanczos3" });
  if (scale > 1.35) resizer = resizer.sharpen({ sigma: scale > 2.2 ? 0.6 : 0.45 });
  const scaledBuf = await resizer.png().toBuffer();

  const pasteX = Math.round(CANVAS_SIZE / 2 - (coreLeft + coreW / 2) * scale);
  const pasteY = Math.round(CANVAS_SIZE / 2 - (coreTop + coreH / 2) * scale);
  const srcLeft = Math.max(0, -pasteX), srcTop = Math.max(0, -pasteY);
  const dstLeft = Math.max(0, pasteX), dstTop = Math.max(0, pasteY);
  const copyW = Math.max(1, Math.min(scaledW - srcLeft, CANVAS_SIZE - dstLeft));
  const copyH = Math.max(1, Math.min(scaledH - srcTop, CANVAS_SIZE - dstTop));
  const patchBuf = await sharp(scaledBuf).extract({ left: srcLeft, top: srcTop, width: copyW, height: copyH }).png().toBuffer();

  const canvasRaw = await sharp({ create: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 4, background: bg } })
    .composite([{ input: patchBuf, left: dstLeft, top: dstTop }])
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cData = Buffer.from(canvasRaw.data);
  for (let y = 0; y < CANVAS_SIZE; y++) {
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const dist = Math.min(x, CANVAS_SIZE - 1 - x, y, CANVAS_SIZE - 1 - y);
      if (dist >= EDGE_FEATHER_PX) {
        if (y >= EDGE_FEATHER_PX && y < CANVAS_SIZE - EDGE_FEATHER_PX && x === EDGE_FEATHER_PX) x = CANVAS_SIZE - EDGE_FEATHER_PX - 1;
        continue;
      }
      const i = (y * CANVAS_SIZE + x) * 4;
      if ((cData[i] !== bg.r || cData[i + 1] !== bg.g || cData[i + 2] !== bg.b) && Math.min(cData[i], cData[i + 1], cData[i + 2]) >= 140) {
        const t = dist / EDGE_FEATHER_PX, s = t * t * (3 - 2 * t);
        cData[i] = Math.round(bg.r + (cData[i] - bg.r) * s);
        cData[i + 1] = Math.round(bg.g + (cData[i + 1] - bg.g) * s);
        cData[i + 2] = Math.round(bg.b + (cData[i + 2] - bg.b) * s);
        cData[i + 3] = 255;
      }
    }
  }
  return sharp(cData, { raw: { width: CANVAS_SIZE, height: CANVAS_SIZE, channels: 4 } }).webp({ quality: 90 }).toBuffer();
}

async function putR2(key, buf, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: buf,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${R2_PUBLIC_URL}/${key}`;
}

async function main() {
  // 1. 01009224 Vincolo d'Amore
  const b9224 = fs.readFileSync("scratch/lladro_check/01009224_1.jpg");
  await putR2("products/lladro/01009224-01.jpg", b9224, "image/jpeg");
  const norm9224 = await shadowSafeNormalize(b9224);
  const gridUrl9224 = await putR2("products/grid-v4/lladro/01009224-01.webp", norm9224, "image/webp");

  const { error: err1 } = await sb
    .from("oroeco_products")
    .update({
      images: [gridUrl9224],
      approval_status: "approved",
      short_description: "Scultura originale Lladró 'Vincolo d'Amore' in porcellana bianca opaca realizzata a mano a Valencia (H 30 cm).",
      description: "Opera originale Lladró della collezione Heritage Sculptures (Cod. 01009224), scolpita da Raúl Rubio e realizzata a mano a Valencia in porcellana bianca opaca su base scura. Un'allegoria intensa dell'amore materno, completa di cofanetto ufficiale Lladró e certificato di autenticità ORO&CO.",
      attributes: {
        Materiale: "Porcellana d'Arte di Valencia",
        material: "Porcellana d'Arte di Valencia",
        collection: "Heritage Sculptures",
        finish: "Bianco Opaco (Matte White)",
        Finitura: "Opaco",
        Colore: "Bianco",
        Scultore: "Raúl Rubio",
        sculptor: "Raúl Rubio",
        Dimensioni: "30 x 16 x 13 cm (H x L x P)",
        dimensions: "30 x 16 x 13 cm",
        "Anno di lancio": "2016",
        Origine: "Valencia, Spagna",
        origin: "Valencia, Spagna",
      },
    })
    .eq("sku", "01009224");
  if (err1) throw err1;

  // 2. 01023890 Lace Dome (1 unlit studio -> grid-v4; 2 lit context -> untouched R2)
  const b3890_1 = fs.readFileSync("scratch/lladro_check/01023890_1.jpg");
  const b3890_2 = fs.readFileSync("scratch/lladro_check/01023890_2.jpg");
  await putR2("products/lladro/01023890-01.jpg", b3890_1, "image/jpeg");
  const norm3890 = await shadowSafeNormalize(b3890_1);
  const gridUrl3890 = await putR2("products/grid-v4/lladro/01023890-01.webp", norm3890, "image/webp");
  const secUrl3890 = await putR2("products/lladro/01023890-02.jpg", b3890_2, "image/jpeg");

  const { error: err2 } = await sb
    .from("oroeco_products")
    .update({
      images: [gridUrl3890, secUrl3890],
      approval_status: "approved",
      short_description: "Lampada da tavolo wireless Lladró 'Lace Dome' in porcellana traslucida litofania incisa a mano con LED ricaricabile.",
      description: "Lampada da tavolo originale Lladró della collezione Dome Lights (Cod. 01023890), realizzata a mano a Valencia in porcellana bianca opaca traslucida con lavorazione litofania a motivi di pizzo. Quando accesa diffonde una luce LED calda e dimmerabile tramite tocco, con ricarica USB inclusa e certificato di autenticità ORO&CO.",
      attributes: {
        Materiale: "Porcellana Traslucida Litofania",
        material: "Porcellana Traslucida Litofania",
        collection: "Dome Lights",
        finish: "Bianco Opaco Traslucido Litofania",
        Finitura: "Opaco con incisione a mano",
        Colore: "Bianco",
        Dimensioni: "Ø 11 x 15 H cm",
        dimensions: "15 x 11 x 11 cm",
        "Sorgente luminosa": "LED integrato ricaricabile USB con dimmer touch",
        Autonomia: "4–7 ore (ricarica USB inclusa)",
        Wireless: "Sì",
        "Anno di lancio": "2017",
        Origine: "Valencia, Spagna",
        origin: "Valencia, Spagna",
      },
    })
    .eq("sku", "01023890");
  if (err2) throw err2;

  console.log("LLADRO 2 FIXED:", { gridUrl9224, gridUrl3890, secUrl3890 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
