require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const LOCAL_VIDEO_DIR = path.join(process.cwd(), "public", "videos", "client-media");
const LOCAL_POSTER_DIR = path.join(process.cwd(), "public", "images", "client-media", "posters");
const PHOTOS_MANIFEST_PATH = path.join(process.cwd(), "data", "client_photos_webp_r2.json");
const MANIFEST_PATH = path.join(process.cwd(), "data", "client_media_r2.json");

const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const VIDEO_LABELS = {
  "anello-dd-02.mp4": { title: "Anello Davite & Delucchi", subtitle: "Alta Gioielleria" },
  "anello-golay-v2.mp4": { title: "Anello Golay", subtitle: "Perle & Luce" },
  "bomboniera.mp4": { title: "Bomboniere d'Autore", subtitle: "Cerimonia & Casa" },
  "bracciali-rosa-rapido.mp4": { title: "Bracciali Oro Rosa", subtitle: "Collezione Atelier" },
  "natale-2025.mp4": { title: "Magia di Natale", subtitle: "Idee Regalo" },
  "rosa-orecchini-rapido.mp4": { title: "Orecchini Oro Rosa", subtitle: "Dettagli Preziosi" },
  "instagram-reel-01.mp4": { title: "L'Arte della Scelta", subtitle: "Dal Banco ORO&CO" },
  "instagram-reel-02.mp4": { title: "Dietro le Quinte", subtitle: "La Maison ORO&CO" },
};

async function main() {
  fs.mkdirSync(LOCAL_POSTER_DIR, { recursive: true });

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

  const videoFiles = fs
    .readdirSync(LOCAL_VIDEO_DIR)
    .filter((f) => /\.mp4$/i.test(f) && !f.endsWith(".web.mp4"))
    .sort();

  const videosManifest = [];
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of videoFiles) {
    const srcPath = path.join(LOCAL_VIDEO_DIR, file);
    const beforeSize = fs.statSync(srcPath).size;
    totalBefore += beforeSize;

    const tmpOut = path.join(LOCAL_VIDEO_DIR, `${file}.web.mp4`);
    const posterBase = file.replace(/\.mp4$/i, "");
    const tmpPosterJpg = path.join(LOCAL_POSTER_DIR, `${posterBase}.tmp.jpg`);
    const posterWebpPath = path.join(LOCAL_POSTER_DIR, `${posterBase}.webp`);

    console.log(`🎬 Ottimizzo ${file} (${(beforeSize / 1024 / 1024).toFixed(2)} MB)...`);

    // 1. Comprimi video per web: 720px max width, H.264, CRF 26, faststart, audio AAC 96k
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i", srcPath,
        "-vf", "scale='min(720,iw)':-2",
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "26",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        "-c:a", "aac",
        "-b:a", "96k",
        "-ac", "2",
        tmpOut,
      ],
      { stdio: "pipe" }
    );

    // Sostituisci il file locale con la versione ottimizzata web
    fs.renameSync(tmpOut, srcPath);
    const afterSize = fs.statSync(srcPath).size;
    totalAfter += afterSize;

    // 2. Estrai poster frame al secondo 1.0 e converti in WebP
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-ss", "00:00:01.000",
        "-i", srcPath,
        "-frames:v", "1",
        "-q:v", "2",
        tmpPosterJpg,
      ],
      { stdio: "pipe" }
    );

    await sharp(tmpPosterJpg)
      .resize({ width: 720, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(posterWebpPath);
    fs.unlinkSync(tmpPosterJpg);

    // 3. Upload video ottimizzato + poster WebP su Cloudflare R2
    const videoKey = `client-media/video/${file}`;
    const posterKey = `client-media/video/posters/${posterBase}.webp`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: videoKey,
        Body: fs.readFileSync(srcPath),
        ContentType: "video/mp4",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: posterKey,
        Body: fs.readFileSync(posterWebpPath),
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const meta = VIDEO_LABELS[file] || { title: posterBase, subtitle: "ORO&CO" };
    videosManifest.push({
      type: "video",
      cleanName: file,
      title: meta.title,
      subtitle: meta.subtitle,
      localPath: `public/videos/client-media/${file}`,
      r2Key: videoKey,
      r2Url: `${R2_PUBLIC_URL}/${videoKey}`,
      posterKey,
      posterUrl: `${R2_PUBLIC_URL}/${posterKey}`,
      contentType: "video/mp4",
      sizeBytes: afterSize,
      originalSizeBytes: beforeSize,
    });

    console.log(
      `✅ ${file}: ${(beforeSize / 1024 / 1024).toFixed(2)} MB -> ${(afterSize / 1024 / 1024).toFixed(2)} MB + poster WebP su R2`
    );
  }

  const photos = fs.existsSync(PHOTOS_MANIFEST_PATH)
    ? JSON.parse(fs.readFileSync(PHOTOS_MANIFEST_PATH, "utf8"))
    : [];

  const manifest = {
    generatedAt: new Date().toISOString(),
    bucket: R2_BUCKET,
    publicBaseUrl: R2_PUBLIC_URL,
    summary: {
      photos: photos.length,
      videos: videosManifest.length,
      photosMB: Number((photos.reduce((a, x) => a + x.sizeBytes, 0) / 1024 / 1024).toFixed(2)),
      videosBeforeMB: Number((totalBefore / 1024 / 1024).toFixed(2)),
      videosAfterMB: Number((totalAfter / 1024 / 1024).toFixed(2)),
    },
    photos,
    videos: videosManifest,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  console.log(
    `🎉 Video ottimizzati e caricati su R2: ${(totalBefore / 1024 / 1024).toFixed(2)} MB -> ${(totalAfter / 1024 / 1024).toFixed(2)} MB. Manifest salvato in ${MANIFEST_PATH}`
  );
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
