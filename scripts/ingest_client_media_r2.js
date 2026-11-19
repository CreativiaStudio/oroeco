require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const SOURCE_ROOT = "C:\\Users\\mario\\Downloads\\VIDEO - FOTO Oroeco\\VIDEO - FOTO";
const LOCAL_PHOTO_DIR = path.join(process.cwd(), "public", "images", "client-media");
const LOCAL_VIDEO_DIR = path.join(process.cwd(), "public", "videos", "client-media");
const MANIFEST_PATH = path.join(process.cwd(), "data", "client_media_r2.json");

const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

function slugifyVideoName(originalName, snapIndex) {
  const ext = path.extname(originalName).toLowerCase();
  const base = path.basename(originalName, path.extname(originalName));
  if (/^snapinsta/i.test(base)) {
    return `instagram-reel-${String(snapIndex).padStart(2, "0")}${ext}`;
  }
  const clean = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${clean}${ext}`;
}

async function main() {
  fs.mkdirSync(LOCAL_PHOTO_DIR, { recursive: true });
  fs.mkdirSync(LOCAL_VIDEO_DIR, { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

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

  const fotoSrcDir = path.join(SOURCE_ROOT, "FOTO");
  const videoSrcDir = path.join(SOURCE_ROOT, "VIDEO");

  const fotoFiles = fs.readdirSync(fotoSrcDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
  const videoFiles = fs.readdirSync(videoSrcDir).filter((f) => /\.(mp4|mov|webm)$/i.test(f)).sort();

  const items = [];

  fotoFiles.forEach((file, idx) => {
    const ext = path.extname(file).toLowerCase();
    const cleanName = `oroeco-foto-${String(idx + 1).padStart(2, "0")}${ext}`;
    const srcPath = path.join(fotoSrcDir, file);
    const localPath = path.join(LOCAL_PHOTO_DIR, cleanName);
    fs.copyFileSync(srcPath, localPath);
    const stats = fs.statSync(localPath);
    items.push({
      type: "photo",
      originalName: file,
      cleanName,
      localPath: `public/images/client-media/${cleanName}`,
      r2Key: `client-media/foto/${cleanName}`,
      r2Url: `${R2_PUBLIC_URL}/client-media/foto/${cleanName}`,
      contentType: ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg",
      sizeBytes: stats.size,
      absPath: localPath,
    });
  });

  let snapCount = 0;
  videoFiles.forEach((file) => {
    if (/^snapinsta/i.test(file)) snapCount++;
    const cleanName = slugifyVideoName(file, snapCount);
    const srcPath = path.join(videoSrcDir, file);
    const localPath = path.join(LOCAL_VIDEO_DIR, cleanName);
    fs.copyFileSync(srcPath, localPath);
    const stats = fs.statSync(localPath);
    items.push({
      type: "video",
      originalName: file,
      cleanName,
      localPath: `public/videos/client-media/${cleanName}`,
      r2Key: `client-media/video/${cleanName}`,
      r2Url: `${R2_PUBLIC_URL}/client-media/video/${cleanName}`,
      contentType: "video/mp4",
      sizeBytes: stats.size,
      absPath: localPath,
    });
  });

  console.log(`📦 Copiati localmente ${fotoFiles.length} foto e ${videoFiles.length} video. Avvio upload su R2 (${R2_BUCKET})...`);

  let uploaded = 0;
  let failed = 0;
  const CONCURRENCY = 6;

  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map(async (item) => {
        try {
          const stream = fs.createReadStream(item.absPath);
          await s3.send(
            new PutObjectCommand({
              Bucket: R2_BUCKET,
              Key: item.r2Key,
              Body: stream,
              ContentLength: item.sizeBytes,
              ContentType: item.contentType,
              CacheControl: "public, max-age=31536000, immutable",
            })
          );
          uploaded++;
          console.log(`✅ [${uploaded}/${items.length}] ${item.r2Key} (${(item.sizeBytes / 1024 / 1024).toFixed(2)} MB)`);
        } catch (err) {
          failed++;
          console.error(`❌ Errore ${item.r2Key}:`, err.message);
        }
      })
    );
  }

  if (failed > 0) {
    throw new Error(`Upload incompleto: ${failed} file falliti.`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: R2_BUCKET,
    publicBaseUrl: R2_PUBLIC_URL,
    summary: {
      total: items.length,
      photos: fotoFiles.length,
      videos: videoFiles.length,
      totalMB: Number((items.reduce((acc, x) => acc + x.sizeBytes, 0) / 1024 / 1024).toFixed(2)),
    },
    photos: items.filter((x) => x.type === "photo").map(({ absPath, ...rest }) => rest),
    videos: items.filter((x) => x.type === "video").map(({ absPath, ...rest }) => rest),
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log(`🎉 Completato! Manifest salvato in ${MANIFEST_PATH}`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
