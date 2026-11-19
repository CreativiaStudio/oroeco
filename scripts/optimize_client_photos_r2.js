require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const LOCAL_PHOTO_DIR = path.join(process.cwd(), "public", "images", "client-media");
const MANIFEST_PATH = path.join(process.cwd(), "data", "client_media_r2.json");

const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

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

  const jpegFiles = fs
    .readdirSync(LOCAL_PHOTO_DIR)
    .filter((f) => /\.(jpe?g|png)$/i.test(f))
    .sort();

  let totalBefore = 0;
  let totalAfter = 0;
  const optimizedPhotos = [];

  for (const file of jpegFiles) {
    const oldPath = path.join(LOCAL_PHOTO_DIR, file);
    const oldSize = fs.statSync(oldPath).size;
    totalBefore += oldSize;

    const webpName = file.replace(/\.(jpe?g|png)$/i, ".webp");
    const newPath = path.join(LOCAL_PHOTO_DIR, webpName);

    const info = await sharp(oldPath)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toFile(newPath);

    totalAfter += info.size;

    const newKey = `client-media/foto/${webpName}`;
    const oldKey = `client-media/foto/${file}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: newKey,
        Body: fs.readFileSync(newPath),
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET,
        Key: oldKey,
      })
    );

    fs.unlinkSync(oldPath);

    optimizedPhotos.push({
      type: "photo",
      cleanName: webpName,
      localPath: `public/images/client-media/${webpName}`,
      r2Key: newKey,
      r2Url: `${R2_PUBLIC_URL}/${newKey}`,
      contentType: "image/webp",
      width: info.width,
      height: info.height,
      sizeBytes: info.size,
      savedBytes: oldSize - info.size,
    });
  }

  const savedPct = totalBefore > 0 ? (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1) : "0.0";
  console.log(
    `✅ Ottimizzate e sostituite su R2 ${optimizedPhotos.length} foto in WebP: ` +
      `${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB (-${savedPct}%)`
  );

  // Salva in un file temporaneo o aggiorna il manifest se già esistente
  const photosManifestPath = path.join(process.cwd(), "data", "client_photos_webp_r2.json");
  fs.writeFileSync(photosManifestPath, JSON.stringify(optimizedPhotos, null, 2), "utf8");

  if (fs.existsSync(MANIFEST_PATH)) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    manifest.photos = optimizedPhotos;
    manifest.generatedAt = new Date().toISOString();
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
    console.log(`📄 Aggiornato anche ${MANIFEST_PATH}`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
