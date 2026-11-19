require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { createClient } = require("@supabase/supabase-js");

const PUBLIC_IMAGES_DIR = path.join(process.cwd(), "public", "images");
const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const MEDIA_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg",
  ".gif",
  ".avif",
  ".mp4",
  ".webm",
  ".mov",
]);

const MIME_MAP = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

function walkDir(dir, baseDir = dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (MEDIA_EXTENSIONS.has(ext) && entry.name !== "test_size_l.jpg") {
        const relKey = path
          .relative(baseDir, fullPath)
          .split(path.sep)
          .join("/");
        results.push({ fullPath, key: relKey, ext });
      }
    }
  }
  return results;
}

function toR2Url(val) {
  if (!val || typeof val !== "string") return val;
  const trimmed = val.trim();
  if (trimmed.startsWith("/images/")) {
    const key = trimmed.slice("/images/".length);
    return `${R2_PUBLIC_URL}/${key}`;
  }
  return trimmed;
}

async function main() {
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

  const files = walkDir(PUBLIC_IMAGES_DIR);
  console.log(`📦 Trovati ${files.length} file media in public/images/ da caricare su R2 (${R2_BUCKET})...`);

  let uploaded = 0;
  let failed = 0;
  const CONCURRENCY = 16;

  for (let i = 0; i < files.length; i += CONCURRENCY) {
    const batch = files.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (f) => {
        try {
          const body = fs.readFileSync(f.fullPath);
          await s3.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: f.key,
              Body: body,
              ContentType: MIME_MAP[f.ext] || "application/octet-stream",
              CacheControl: "public, max-age=31536000, immutable",
            })
          );
          uploaded++;
        } catch (err) {
          failed++;
          console.error(`❌ Errore upload ${f.key}:`, err.message);
        }
      })
    );
    if ((i + CONCURRENCY) % 160 === 0 || i + CONCURRENCY >= files.length) {
      console.log(`   Progresso upload: ${Math.min(i + CONCURRENCY, files.length)}/${files.length} (OK: ${uploaded}, Err: ${failed})`);
    }
  }

  if (failed > 0) {
    throw new Error(`Upload incompleto: ${failed} file falliti.`);
  }

  console.log(`\n🔄 Aggiornamento URL su Supabase...`);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. oroeco_products
  const { data: products, error: prodErr } = await supabase
    .from("oroeco_products")
    .select("id, images");
  if (prodErr) throw prodErr;

  let prodUpdated = 0;
  for (const p of products || []) {
    const imgs = Array.isArray(p.images) ? p.images : [];
    const nextImgs = imgs.map(toR2Url);
    if (JSON.stringify(imgs) !== JSON.stringify(nextImgs)) {
      const { error } = await supabase
        .from("oroeco_products")
        .update({ images: nextImgs })
        .eq("id", p.id);
      if (error) throw error;
      prodUpdated++;
    }
  }
  console.log(`   ✅ oroeco_products aggiornati: ${prodUpdated}/${(products || []).length}`);

  // 2. oroeco_brands
  const { data: brands, error: brandErr } = await supabase
    .from("oroeco_brands")
    .select("id, logo_url");
  if (brandErr) throw brandErr;

  let brandUpdated = 0;
  for (const b of brands || []) {
    const nextLogo = toR2Url(b.logo_url);
    if (nextLogo !== b.logo_url) {
      const { error } = await supabase
        .from("oroeco_brands")
        .update({ logo_url: nextLogo })
        .eq("id", b.id);
      if (error) throw error;
      brandUpdated++;
    }
  }
  console.log(`   ✅ oroeco_brands aggiornati: ${brandUpdated}/${(brands || []).length}`);

  // 3. oroeco_categories
  const { data: cats, error: catErr } = await supabase
    .from("oroeco_categories")
    .select("id, hero_image");
  if (catErr) throw catErr;

  let catUpdated = 0;
  for (const c of cats || []) {
    const nextHero = toR2Url(c.hero_image);
    if (nextHero !== c.hero_image) {
      const { error } = await supabase
        .from("oroeco_categories")
        .update({ hero_image: nextHero })
        .eq("id", c.id);
      if (error) throw error;
      catUpdated++;
    }
  }
  console.log(`   ✅ oroeco_categories aggiornati: ${catUpdated}/${(cats || []).length}`);

  // Test HTTP 200 on sample R2 URLs
  const sampleUrls = [
    `${R2_PUBLIC_URL}/hero/hero-main.jpg`,
    `${R2_PUBLIC_URL}/brands/unoaerre.svg`,
    `${R2_PUBLIC_URL}/products/unoaerre/F02786_1.jpg`,
  ];
  for (const url of sampleUrls) {
    const res = await fetch(url, { method: "HEAD" });
    console.log(`   🌐 HEAD ${url} -> ${res.status}`);
  }

  console.log("\n🎉 Migrazione R2 + Supabase completata!");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
