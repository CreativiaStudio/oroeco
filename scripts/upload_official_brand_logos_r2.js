require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const SRC_DIR = "C:\\Users\\mario\\.gemini\\antigravity\\brain\\af2d2ce4-7a99-485d-a8ad-968594a22598\\scratch\\brand_logos_official";
const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const BRANDS = [
  { slug: "davite-delucchi", file: "davite-delucchi.jpg", type: "raster" },
  { slug: "stroili", file: "stroili.svg", type: "svg" },
  { slug: "nihama", file: "nihama.svg", type: "svg" },
  { slug: "golay", file: "golay.svg", type: "svg" },
  { slug: "dana-oro-9-kt", file: "dana-oro-9-kt.png", type: "raster" },
  { slug: "cammeo-italiano", file: "cammeo-italiano.png", type: "raster" },
  { slug: "gerba", file: "gerba.png", type: "raster" },
  { slug: "guess", file: "guess.svg", type: "svg" },
  { slug: "bulova", file: "bulova.svg", type: "svg" },
  { slug: "locman", file: "locman.svg", type: "svg" },
  { slug: "paul-picot", file: "paul-picot.png", type: "raster" },
  { slug: "villeroy-boch", file: "villeroy-boch.svg", type: "svg" },
  { slug: "lladro", file: "lladro.svg", type: "svg" },
  { slug: "cuorematto", file: "cuorematto.svg", type: "svg" },
  { slug: "unoaerre", file: "unoaerre.svg", type: "svg" },
  { slug: "gli-alberelli", file: "gli-alberelli.png", type: "raster" },
  { slug: "ducati", file: "ducati.svg", type: "svg" },
  { slug: "amen", file: "amen.png", type: "raster" },
];

(async () => {
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

  const mapping = {};

  for (const b of BRANDS) {
    const srcPath = path.join(SRC_DIR, b.file);
    let body, key, contentType;

    if (b.type === "svg") {
      body = fs.readFileSync(srcPath);
      key = `brands-official/${b.slug}.svg`;
      contentType = "image/svg+xml";
    } else {
      body = await sharp(srcPath)
        .trim({ threshold: 10 })
        .resize({ width: 640, height: 320, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 92, alphaQuality: 100 })
        .toBuffer();
      key = `brands-official/${b.slug}.webp`;
      contentType = "image/webp";
    }

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );

    const url = `${R2_PUBLIC_URL}/${key}`;
    mapping[b.slug] = url;
    console.log(`🚀 ${b.slug.padEnd(18)} -> ${key} (${(body.length / 1024).toFixed(1)} KB)`);
  }

  console.log("\nMAPPING_JSON_START");
  console.log(JSON.stringify(mapping, null, 2));
  console.log("MAPPING_JSON_END");
})();
