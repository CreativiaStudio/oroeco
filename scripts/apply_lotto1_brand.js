require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");

const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function slugify(str) {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function generateBarcode(sku) {
  const s = String(sku || "").trim();
  if (/^\d{13}$/.test(s)) return s;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) % 100000000;
  }
  const body = `8054${String(Math.abs(hash)).padStart(8, "0")}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(body[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

function resolveEnrichmentFile(brandArg, fileArg) {
  if (fileArg) {
    return path.isAbsolute(fileArg) ? fileArg : path.join(process.cwd(), fileArg);
  }
  const dir = path.join(process.cwd(), "data", "enrichment");
  const candidates = [
    path.join(dir, `${brandArg}_lotto1.json`),
    path.join(dir, `${brandArg}_lotto2.json`),
    path.join(dir, `${brandArg}_lotto3.json`),
    path.join(dir, `${brandArg}_lotto4.json`),
    path.join(dir, `${brandArg}.json`),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(`File enrichment non trovato per --brand ${brandArg} (cercato in ${candidates.join(", ")})`);
}

async function downloadAndConvertWebp(url, referer) {
  let rawBuf = null;
  let lastErr = "Download failed";

  if (!/^https?:\/\//i.test(url) && fs.existsSync(url)) {
    rawBuf = fs.readFileSync(url);
  } else {
    const attempts = [
      {
        headers: {
          "User-Agent": "curl/8.5.0",
          Accept: "*/*",
        },
      },
      {
        headers: {
          "User-Agent": UA,
          Accept: "image/webp,image/png,image/jpeg,*/*;q=0.8",
          ...(referer ? { Referer: referer } : {}),
        },
      },
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; OroecoCatalogBot/1.0)",
          Accept: "image/jpeg,image/png,image/webp,*/*",
        },
      },
    ];

    for (const opt of attempts) {
      try {
        const res = await fetch(url, { headers: opt.headers });
        if (!res.ok) {
          lastErr = `HTTP ${res.status} downloading ${url}`;
          continue;
        }
        const ct = (res.headers.get("content-type") || "").toLowerCase();
        if (ct.includes("text/html")) {
          lastErr = `HTML response instead of image: ${url}`;
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 2500) {
          lastErr = `Image too small (${buf.length}B): ${url}`;
          continue;
        }
        rawBuf = buf;
        break;
      } catch (e) {
        lastErr = e.message;
      }
    }
  }

  if (!rawBuf) throw new Error(lastErr);

  const meta = await sharp(rawBuf).metadata();
  if (!meta.width || !meta.height || Math.max(meta.width, meta.height) < 300) {
    throw new Error(`Low resolution (${meta.width}x${meta.height}): ${url}`);
  }

  const webpBuf = await sharp(rawBuf)
    .rotate()
    .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 88, effort: 5 })
    .toBuffer();

  const sha256 = crypto.createHash("sha256").update(webpBuf).digest("hex");
  return { webpBuf, sha256, width: meta.width, height: meta.height };
}

async function main() {
  const brandArg = getArg("brand");
  const fileArg = getArg("file");
  const dryRun = process.argv.includes("--dry-run");
  if (!brandArg && !fileArg) {
    console.error("Usage: node scripts/apply_lotto1_brand.js --brand <slug> [--file <path>] [--dry-run]");
    process.exit(1);
  }

  const jsonPath = resolveEnrichmentFile(brandArg, fileArg);
  const qaBaseName = path.basename(jsonPath, ".json");
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File non trovato: ${jsonPath}`);
  }

  const payload = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
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

  const { data: existingRows, error: fetchErr } = await sb
    .from("oroeco_products")
    .select("*")
    .eq("brand_id", payload.brandId);
  if (fetchErr) throw fetchErr;

  const existingBySku = new Map(
    (existingRows || []).map((r) => [String(r.sku || "").trim().toUpperCase(), r])
  );

  const seenPrimaryHashes = new Set();
  const qaThumbs = [];
  const report = [];

  for (const item of payload.items) {
    const skuKey = String(item.sku).trim().toUpperCase();
    const skuSlug = slugify(item.sku);
    const existing = existingBySku.get(skuKey);

    const r2Urls = [];
    const uploadedErrors = [];
    let firstWebpBuf = null;

    if (item.found && Array.isArray(item.imageUrls) && item.imageUrls.length > 0) {
      let imgIdx = 0;
      const itemHashes = new Set();
      for (const srcUrl of item.imageUrls.slice(0, 4)) {
        try {
          const { webpBuf, sha256, width, height } = await downloadAndConvertWebp(
            srcUrl,
            item.sourceUrl
          );
          if (itemHashes.has(sha256)) continue;
          if (imgIdx === 0 && seenPrimaryHashes.has(sha256) && item.allowSharedImage !== true) {
            throw new Error(`Duplicate primary image hash across products for ${item.sku}`);
          }
          itemHashes.add(sha256);
          if (imgIdx === 0 && item.allowSharedImage !== true) seenPrimaryHashes.add(sha256);

          imgIdx++;
          const key = `products/${payload.brandSlug}/${skuSlug}-${String(imgIdx).padStart(2, "0")}.webp`;
          if (!dryRun) {
            await s3.send(
              new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: webpBuf,
                ContentType: "image/webp",
                CacheControl: "public, max-age=31536000, immutable",
              })
            );
          }
          const publicUrl = `${R2_PUBLIC_URL}/${key}`;
          r2Urls.push(publicUrl);

          if (imgIdx === 1) {
            firstWebpBuf = webpBuf;
          }
          console.log(`  🖼️  ${item.sku} img #${imgIdx}: ${width}x${height} -> ${(webpBuf.length / 1024).toFixed(1)} KB (${key})`);
        } catch (err) {
          uploadedErrors.push(err.message);
          console.warn(`  ⚠️  ${item.sku} img skip: ${err.message}`);
        }
      }
    }

    const stockQty = item.stockQuantity ?? existing?.stock_quantity ?? 1;
    const canApprove =
      Boolean(item.found) &&
      r2Urls.length > 0 &&
      Boolean(item.description && item.description.trim().length > 30) &&
      Number(item.price) > 0 &&
      stockQty > 0 &&
      item.forceOffline !== true;

    if (canApprove && firstWebpBuf) {
      qaThumbs.push({ sku: item.sku, name: item.name, buf: firstWebpBuf });
    }

    const approvalStatus = canApprove ? "approved" : "rejected";

    const cleanText = (s) =>
      String(s || "")
        .replace(/\bBoutique\b/g, "Gioielleria")
        .replace(/\bboutique\b/g, "gioielleria");

    const record = {
      name: cleanText(item.name),
      brand_id: payload.brandId,
      brand_name: payload.brandName,
      category: item.category,
      subcategory: item.subcategory,
      subcategory_label: item.subcategoryLabel,
      price: Number(item.price) || 0,
      compare_at_price: item.compareAtPrice ? Number(item.compareAtPrice) : null,
      vat_rate: 22,
      stock_quantity: stockQty,
      in_stock: stockQty > 0,
      sku: item.sku,
      barcode: item.barcode || existing?.barcode || generateBarcode(item.sku),
      short_description: cleanText(item.shortDescription),
      description: cleanText(item.description),
      images: r2Urls.length > 0 ? r2Urls : existing?.images || [],
      attributes: item.attributes || existing?.attributes || {},
      tags: item.tags || existing?.tags || [],
      supplier_cost: item.supplierCost ?? existing?.supplier_cost ?? null,
      supplier_name: payload.supplierName || existing?.supplier_name || payload.brandName,
      invoice_ref: item.invoiceRef || payload.invoiceRef || existing?.invoice_ref || null,
      approval_status: approvalStatus,
      updated_at: new Date().toISOString(),
    };

    if (!dryRun) {
      if (existing) {
        const { error: updErr } = await sb
          .from("oroeco_products")
          .update(record)
          .eq("id", existing.id);
        if (updErr) throw new Error(`Update error ${item.sku}: ${updErr.message}`);
      } else {
        const baseSlug = slugify(item.name.replace(new RegExp(`^${payload.brandName}\\s*[—-]?\\s*`, "i"), ""));
        const maxBaseLen = Math.max(10, 110 - payload.brandSlug.length - skuSlug.length - 2);
        const slug = `${payload.brandSlug}-${baseSlug.slice(0, maxBaseLen).replace(/-+$/, "")}-${skuSlug}`;
        const { error: insErr } = await sb.from("oroeco_products").insert({
          ...record,
          slug,
          is_featured: false,
          is_new: true,
          is_christmas: false,
        });
        if (insErr) throw new Error(`Insert error ${item.sku}: ${insErr.message}`);
      }
    }

    report.push({
      sku: item.sku,
      action: existing ? "UPDATE" : "INSERT",
      status: approvalStatus,
      price: record.price,
      imagesCount: r2Urls.length,
      r2Urls,
      errors: uploadedErrors,
    });
    console.log(
      `${approvalStatus === "approved" ? "✅" : "⏸️"} [${existing ? "UPD" : "INS"}] ${item.sku} -> ${approvalStatus.toUpperCase()} | €${record.price} | ${r2Urls.length} imgs`
    );
  }

  if (qaThumbs.length > 0) {
    const pageSize = 20;
    const totalPages = Math.ceil(qaThumbs.length / pageSize);
    for (let page = 0; page < totalPages; page++) {
      const pageThumbs = qaThumbs.slice(page * pageSize, (page + 1) * pageSize);
      const cols = Math.min(5, pageThumbs.length);
      const cellW = 280;
      const cellH = 310;
      const rows = Math.ceil(pageThumbs.length / cols);
      const composites = [];
      for (let i = 0; i < pageThumbs.length; i++) {
        const t = pageThumbs[i];
        const thumb = await sharp(t.buf)
          .resize(cellW - 20, cellH - 54, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toBuffer();
        const x = (i % cols) * cellW;
        const y = Math.floor(i / cols) * cellH;
        const label = `${t.sku}`.replace(/[<>&'"]/g, "");
        const svg = `<svg width="${cellW}" height="${cellH}"><rect x="1" y="1" width="${cellW - 2}" height="${cellH - 2}" fill="#fff" stroke="#ddd"/><rect x="1" y="${cellH - 36}" width="${cellW - 2}" height="35" fill="#111"/><text x="${cellW / 2}" y="${cellH - 14}" text-anchor="middle" fill="#fff" font-family="Arial" font-size="14">${label}</text></svg>`;
        composites.push({ input: Buffer.from(svg), left: x, top: y });
        composites.push({ input: thumb, left: x + 10, top: y + 8 });
      }
      const suffix = qaThumbs.length <= pageSize ? "" : `_p${page + 1}`;
      const qaPath = `C:\\Users\\mario\\.gemini\\antigravity\\brain\\af2d2ce4-7a99-485d-a8ad-968594a22598\\scratch\\qa_${qaBaseName}${suffix}.jpg`;
      await sharp({
        create: { width: cols * cellW, height: rows * cellH, channels: 3, background: { r: 245, g: 245, b: 245 } },
      })
        .composite(composites)
        .jpeg({ quality: 88 })
        .toFile(qaPath);
      console.log(`\n📋 QA Contact Sheet salvata: ${qaPath}`);
    }
  }

  const allUrls = report.flatMap((r) => r.r2Urls);
  if (!dryRun && allUrls.length > 0) {
    const statuses = [];
    for (let i = 0; i < allUrls.length; i += 20) {
      const chunk = allUrls.slice(i, i + 20);
      const chunkRes = await Promise.all(
        chunk.map(async (u) => {
          const r = await fetch(u, { method: "HEAD" });
          return { u, status: r.status };
        })
      );
      statuses.push(...chunkRes);
    }
    const bad = statuses.filter((s) => s.status !== 200);
    console.log(`🌐 R2 HEAD Check: ${statuses.length - bad.length}/${statuses.length} HTTP 200`);
    if (bad.length > 0) {
      throw new Error(`Immagini R2 non 200: ${JSON.stringify(bad)}`);
    }
  }

  const approvedCount = report.filter((r) => r.status === "approved").length;
  const offlineCount = report.filter((r) => r.status !== "approved").length;
  console.log(`\n🎉 ${payload.brandName} completato: ${approvedCount} ONLINE (approved), ${offlineCount} OFFLINE (rejected).`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
