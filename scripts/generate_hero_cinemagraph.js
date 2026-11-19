require("./_loadEnv");
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const sharp = require("sharp");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

// Carica FAL_KEY da creativia-video-factory/.env.local se non presente in env
function loadFalKey() {
  if (process.env.FAL_KEY) return process.env.FAL_KEY.trim();
  const candidates = [
    "C:\\Users\\mario\\Progetti Antigravity\\Creativia\\frontend\\.env.local",
    "C:\\Users\\mario\\Progetti Antigravity\\creativia-video-factory\\.env.local",
    "C:\\Users\\mario\\Progetti Antigravity\\isabel-pepe\\.env.local",
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    const raw = fs.readFileSync(p, "utf8");
    const m = raw.match(/^\s*FAL_KEY\s*=\s*(.+)\s*$/m);
    if (m && m[1]) {
      return m[1].trim().replace(/^["']|["']$/g, "");
    }
  }
  throw new Error("FAL_KEY non trovata.");
}

const R2_BUCKET = process.env.R2_BUCKET_NAME || "oroeco-media";
const R2_PUBLIC_URL = (
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  "https://pub-b188305c4a244b49b7f08a50cfc80bd0.r2.dev"
).replace(/\/+$/, "");

const MODEL_ENDPOINT = "fal-ai/kling-video/v2.1/pro/image-to-video";

const PROMPT =
  "Ultra-subtle luxury high-jewelry cinemagraph. Locked-off tripod studio camera, zero camera movement, completely static luminous studio background. The model takes one slow, calm, graceful breath so her shoulders, collarbone, and magenta silk dress rise and fall gently. Her manicured hand resting on her chest glides and shifts very softly by a few millimeters, fingers delicately flexing and tilting slightly so the red marquise ruby ring with gold bezel catches a refined natural gleam of studio light. Soft subtle movement in her dark curls, serene poised lips. Photorealistic luxury commercial, zero distortion, strictly preserve exact ring shape, gemstone, hand, and nails.";

const NEGATIVE_PROMPT =
  "camera movement, zoom, pan, shake, hand distortion, extra fingers, deformed nails, morphing ring, changing jewelry shape, fast movement, talking, mouth opening wide, text, logo, watermark, blur, low quality";

async function falSubmitAndWait(falKey, payload, label) {
  console.log(`🎬 [${label}] Invio a Fal.ai (${MODEL_ENDPOINT})...`);
  const submitRes = await fetch(`https://queue.fal.run/${MODEL_ENDPOINT}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`[${label}] Fal submit error ${submitRes.status}: ${errText}`);
  }

  const submitted = await submitRes.json();
  const statusUrl = submitted.status_url;
  const responseUrl = submitted.response_url;
  console.log(`⏳ [${label}] In coda (request_id=${submitted.request_id})...`);

  for (let attempt = 0; attempt < 90; attempt++) {
    await new Promise((r) => setTimeout(r, 5000));
    const stRes = await fetch(statusUrl, {
      headers: { Authorization: `Key ${falKey}` },
    });
    const st = await stRes.json();
    if (st.status === "COMPLETED") {
      const finRes = await fetch(responseUrl, {
        headers: { Authorization: `Key ${falKey}` },
      });
      const fin = await finRes.json();
      const videoUrl = fin?.video?.url;
      if (!videoUrl) {
        throw new Error(`[${label}] Nessun video.url nella risposta: ${JSON.stringify(fin)}`);
      }
      console.log(`✅ [${label}] Generato! URL: ${videoUrl}`);
      return videoUrl;
    }
    if (st.status === "FAILED") {
      throw new Error(`[${label}] Fal job FAILED: ${JSON.stringify(st)}`);
    }
    if (attempt % 3 === 0) {
      console.log(`   [${label}] Stato: ${st.status} (${(attempt + 1) * 5}s)...`);
    }
  }
  throw new Error(`[${label}] Timeout attesa Fal.ai`);
}

async function main() {
  const falKey = loadFalKey();
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

  const outDir = path.join(process.cwd(), "public", "videos", "hero");
  const qaDir = "C:\\Users\\mario\\.gemini\\antigravity\\brain\\af2d2ce4-7a99-485d-a8ad-968594a22598\\scratch\\hero_qa";
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(qaDir, { recursive: true });

  // Carichiamo le sorgenti JPG pulite su R2 per massima compatibilità Fal.ai
  const deskJpgBuf = await sharp(
    "C:\\Users\\mario\\.gemini\\antigravity\\brain\\af2d2ce4-7a99-485d-a8ad-968594a22598\\oroeco_hero_banner_v2_1795095039023.jpg"
  )
    .resize({ width: 1920, withoutEnlargement: true })
    .modulate({ brightness: 1.03, saturation: 1.08 })
    .jpeg({ quality: 94 })
    .toBuffer();

  const mobJpgBuf = await sharp(
    "C:\\Users\\mario\\.gemini\\antigravity\\brain\\af2d2ce4-7a99-485d-a8ad-968594a22598\\hero_modella_mobile_1795094598400.jpg"
  )
    .resize({ width: 1080, withoutEnlargement: true })
    .modulate({ brightness: 1.08, saturation: 1.12 })
    .jpeg({ quality: 94 })
    .toBuffer();

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: "hero/src-desktop-v2.jpg",
      Body: deskJpgBuf,
      ContentType: "image/jpeg",
    })
  );
  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: "hero/src-mobile-v2.jpg",
      Body: mobJpgBuf,
      ContentType: "image/jpeg",
    })
  );

  const deskSrcUrl = `${R2_PUBLIC_URL}/hero/src-desktop-v2.jpg`;
  const mobSrcUrl = `${R2_PUBLIC_URL}/hero/src-mobile-v2.jpg`;

  // Lancia Desktop 16:9 e Mobile 9:16 in parallelo con first+last frame identici (loop seamless!)
  const [deskRawUrl, mobRawUrl] = await Promise.all([
    falSubmitAndWait(
      falKey,
      {
        prompt: PROMPT,
        negative_prompt: NEGATIVE_PROMPT,
        image_url: deskSrcUrl,
        tail_image_url: deskSrcUrl,
        duration: "5",
        cfg_scale: 0.55,
      },
      "DESKTOP-16:9"
    ),
    falSubmitAndWait(
      falKey,
      {
        prompt: PROMPT,
        negative_prompt: NEGATIVE_PROMPT,
        image_url: mobSrcUrl,
        tail_image_url: mobSrcUrl,
        duration: "5",
        cfg_scale: 0.55,
      },
      "MOBILE-9:16"
    ),
  ]);

  const variants = [
    { name: "desktop", rawUrl: deskRawUrl, scale: "min(1920,iw):-2", r2Key: "hero/hero-modella-desktop.mp4" },
    { name: "mobile", rawUrl: mobRawUrl, scale: "min(1080,iw):-2", r2Key: "hero/hero-modella-mobile.mp4" },
  ];

  for (const v of variants) {
    const rawPath = path.join(outDir, `hero-modella-${v.name}.raw.mp4`);
    const webPath = path.join(outDir, `hero-modella-${v.name}.mp4`);

    const resp = await fetch(v.rawUrl);
    const arrBuf = await resp.arrayBuffer();
    fs.writeFileSync(rawPath, Buffer.from(arrBuf));

    // Comprimi H.264 web-ready muto, faststart, fluidissimo per Hero background
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i", rawPath,
        "-an",
        "-vf", `scale='${v.scale}'`,
        "-c:v", "libx264",
        "-preset", "slow",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        webPath,
      ],
      { stdio: "pipe" }
    );
    fs.unlinkSync(rawPath);

    // Estrai 3 frame QA (1.2s, 2.5s, 3.8s) per ispezione visiva anti-morphing
    for (const [idx, ts] of ["00:00:01.2", "00:00:02.5", "00:00:03.8"].entries()) {
      execFileSync(
        "ffmpeg",
        ["-y", "-ss", ts, "-i", webPath, "-frames:v", "1", "-q:v", "2", path.join(qaDir, `${v.name}_frame_${idx + 1}.jpg`)],
        { stdio: "pipe" }
      );
    }

    const buf = fs.readFileSync(webPath);
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: v.r2Key,
        Body: buf,
        ContentType: "video/mp4",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    console.log(`🚀 Uploaded ${v.r2Key} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
  }

  console.log("🎉 Cinemagraph Desktop + Mobile generati, QA frames estratti e caricati su R2!");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
