const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
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

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const KEEP_0_1 = new Set([
  "14-8332-3714",
  "VB-2905",
  "14-8332-3661",
  "14-8332-3660",
  "14-8585-2680",
  "14-8332-3600",
]);

const KEEP_0_2 = new Set([
  "14-8602-6560",
  "14-8585-6165",
  "14-8327-6648",
  "14-8332-6152",
]);

const KEEP_ONLY_0 = new Set([
  "14-8332-2556",
  "14-8327-6696",
  "14-8332-6123",
  "14-8332-3631",
  "14-8332-3718",
  "14-8327-6551",
  "14-8640-6302",
  "35-9391-0004",
  "35-9391-0027",
  "VB-2640",
  "35-9391-0067",
  "14-8585-3884",
  "VB-2642",
]);

async function tinyGray32(url) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  return sharp(buf).resize(32, 32, { fit: "fill" }).grayscale().raw().toBuffer();
}

function mae(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

(async () => {
  const { data: rows, error } = await sb
    .from("oroeco_products")
    .select("id, sku, name, images")
    .ilike("brand_name", "%villeroy%")
    .eq("approval_status", "approved");

  if (error) throw error;
  console.log(`Villeroy & Boch approved totali: ${rows.length}`);

  let updated = 0;
  let kept1 = 0;
  let kept2 = 0;

  for (const p of rows) {
    const imgs = Array.isArray(p.images) ? p.images : [];
    if (imgs.length <= 1) {
      kept1++;
      continue;
    }

    let nextImages = imgs;
    const sku = String(p.sku || "").trim();

    if (KEEP_0_1.has(sku) && imgs.length >= 2) {
      nextImages = [imgs[0], imgs[1]];
    } else if (KEEP_0_2.has(sku) && imgs.length >= 3) {
      nextImages = [imgs[0], imgs[2]];
    } else if (KEEP_ONLY_0.has(sku)) {
      nextImages = [imgs[0]];
    } else if (imgs.length >= 2) {
      // Confronta images[0] con le altre per tenere quella piu diversa (scartando duplicati MAE < 2)
      const baseVec = await tinyGray32(imgs[0]);
      let bestUrl = null;
      let bestMae = -1;
      for (let i = 1; i < imgs.length; i++) {
        try {
          const vec = await tinyGray32(imgs[i]);
          const diff = mae(baseVec, vec);
          if (diff > bestMae) {
            bestMae = diff;
            bestUrl = imgs[i];
          }
        } catch (err) {
          console.warn(`⚠️ ${sku} img[${i}] errore fetch: ${err.message}`);
        }
      }
      if (bestUrl && bestMae >= 2) {
        nextImages = [imgs[0], bestUrl];
      } else {
        nextImages = [imgs[0]];
      }
    }

    if (nextImages.length > 2) {
      nextImages = nextImages.slice(0, 2);
    }

    if (nextImages.length === 1) kept1++;
    else kept2++;

    const changed =
      nextImages.length !== imgs.length ||
      nextImages.some((u, idx) => u !== imgs[idx]);

    if (changed) {
      const { error: upErr } = await sb
        .from("oroeco_products")
        .update({ images: nextImages, updated_at: new Date().toISOString() })
        .eq("id", p.id);
      if (upErr) throw upErr;
      updated++;
      console.log(
        `✅ ${sku}: ${imgs.length} -> ${nextImages.length} [${nextImages.map((u) => path.basename(u)).join(", ")}]`
      );
    }
  }

  console.log(`\nRIEPILOGO VILLEROY: totali=${rows.length}, aggiornati=${updated}, con_1_foto=${kept1}, con_2_foto=${kept2}`);
})();
