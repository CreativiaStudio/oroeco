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

const REPORT_PATH =
  "C:\\Users\\mario\\.gemini\\antigravity\\brain\\d3a59d6d-2ab9-40e2-a84d-5ef0f43f9b01\\scratch\\img_audit\\grid_normalize_report.json";

const FORCE = process.argv.includes("--force");
const FIX_UNDERSIZED = process.argv.includes("--fix-undersized");
const POLISH_V3 = process.argv.includes("--polish-v3");
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

async function processOne(p) {
  const imgs = Array.isArray(p.images) ? p.images : [];
  const origUrl = imgs[0];
  if (!origUrl) return { status: "skipped_no_img", brand: p.brand_name, sku: p.sku };

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

    if (imgs.length >= 2 && imgs[1] && !imgs[1].includes("/products/grid-v3/")) {
      const buf1 = await fetchWithRetry(imgs[1]);
      const corners1 = await analyzeCorners(buf1);
      const isCaseA1 =
        corners1.hasAlphaCorners ||
        (corners1.cornerMinRGB >= 230 && corners1.cornerMaxDiff <= 14);

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
      origUrl.includes("/products/grid-v3/"))
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
  const targets = allApproved.filter((p) => !/nihama/i.test(p.brand_name || ""));
  console.log(
    `Prodotti approved totali=${allApproved.length}, target non-Nihama=${targets.length}, concurrency=${CONCURRENCY}, force=${FORCE}`
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
        const res = await processOne(p);
        const st = ensureBrandStats(p.brand_name || "NULL");
        if (res.status === "polish_v3") {
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
    mode: POLISH_V3 ? "polish_v3" : FIX_UNDERSIZED ? "fix_undersized" : "initial",
    total_approved: allApproved.length,
    targets_processed: targets.length,
    totals: {
      case_a_normalized: Object.values(statsByBrand).reduce((a, c) => a + c.case_a_normalized, 0),
      case_b_preserved: Object.values(statsByBrand).reduce((a, c) => a + c.case_b_preserved, 0),
      img0_v3: Object.values(statsByBrand).reduce((a, c) => a + c.img0_v3, 0),
      img1_v3_normalized: Object.values(statsByBrand).reduce((a, c) => a + c.img1_v3_normalized, 0),
      img1_case_b_preserved: Object.values(statsByBrand).reduce((a, c) => a + c.img1_case_b_preserved, 0),
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
