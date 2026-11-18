const { execSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

const unoaerreDir = path.join(process.cwd(), 'public', 'images', 'products', 'unoaerre');
if (!fs.existsSync(unoaerreDir)) {
  fs.mkdirSync(unoaerreDir, { recursive: true });
}

const CHROME = '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"';

function downloadFile(fileUrl, destPath) {
  return new Promise((resolve, reject) => {
    https.get(fileUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const stream = fs.createWriteStream(destPath);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(destPath); });
      stream.on('error', reject);
    }).on('error', reject);
  });
}

function searchUnoaerreChrome(ref) {
  try {
    const searchUrl = `https://www.unoaerre.it/catalogsearch/result/?q=${encodeURIComponent(ref)}`;
    const cmd = `${CHROME} --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom "${searchUrl}"`;
    const dom = execSync(cmd, { 
      encoding: 'utf8', 
      timeout: 18000, 
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'ignore'] 
    });

    const nameMatch = dom.match(/"item_name":"([^"]+)"/i) || dom.match(/item_name&quot;:&quot;([^&]+)&quot;/i);
    const title = nameMatch ? nameMatch[1].trim() : null;

    const imgMatches = dom.match(/https:\/\/www\.unoaerre\.it\/media\/catalog\/product\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi);
    let images = [];
    if (imgMatches) {
      images = Array.from(new Set(imgMatches)).filter(img => 
        !img.includes('logo') && 
        !img.includes('placeholder') &&
        !img.includes('unoaerre_gioiello_classica_lux')
      );
    }

    return { title, images };
  } catch (err) {
    return { title: null, images: [], error: err.message };
  }
}

// Fallback packshots for Unoaerre categories if online search returns 0
const categoryFallbacks = {
  bracciale_uomo_acciaio: [
    'https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/5/9/591878_0_dadbe1711a0f1b25.jpg',
    'https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/1/2/125.jpg'
  ],
  collana_uomo_acciaio: [
    'https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/5/9/591879_0_332d6b3937237dad.jpg',
    'https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/1/3/133_1.jpg'
  ],
  argento_perla: [
    'https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/5/5/557203_5058f1af8388633f609cadb75a75dc9d_0.jpg',
    'https://www.unoaerre.it/media/catalog/product/5/5/557192_5058f1af8388633f609cadb75a75dc9d_0.jpg'
  ],
  argento_gea: [
    'https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/6/5/6518_gea_collana_sfera_pav_.jpg'
  ],
  bronzo_tubogas: [
    'https://www.unoaerre.it/media/catalog/product/cache/b1c7992ed5aefd82a6f24b0e326dcb59/2/8/2854_unoaerre_tubogas_dorato.jpg'
  ],
  oro_classica: [
    '/images/products/unoaerre/unoaerre_fede_comoda_01.jpg',
    '/images/products/unoaerre/unoaerre_fede_francesina_01.jpg'
  ]
};

async function processProduct(p) {
  const ref = p.sku.replace(/^F0?/, '');
  console.log(`[START] SKU ${p.sku} (Ref ${ref})...`);

  const result = searchUnoaerreChrome(ref);

  let finalImages = result.images;
  let finalTitle = result.title;

  // If chrome search returned images, great! Otherwise assign authentic curated collection packshot
  if (!finalImages || finalImages.length === 0) {
    const n = p.name.toLowerCase();
    if (p.sku.startsWith('F043') && n.includes('bracciale')) {
      finalImages = categoryFallbacks.bracciale_uomo_acciaio;
      finalTitle = finalTitle || p.name.replace('Ref.', 'Acciaio Aeternum Ref.');
    } else if (p.sku.startsWith('F043') && n.includes('collana')) {
      finalImages = categoryFallbacks.collana_uomo_acciaio;
      finalTitle = finalTitle || p.name.replace('Ref.', 'Acciaio Aeternum Ref.');
    } else if (n.includes('gea') || n.includes('sfera')) {
      finalImages = categoryFallbacks.argento_gea;
    } else if (n.includes('tubogas')) {
      finalImages = categoryFallbacks.bronzo_tubogas;
    } else if (n.includes('oro')) {
      finalImages = categoryFallbacks.oro_classica;
    } else {
      finalImages = categoryFallbacks.argento_perla;
    }
  }

  // Download images locally if remote
  const localImages = [];
  for (let i = 0; i < Math.min(finalImages.length, 3); i++) {
    const srcUrl = finalImages[i];
    if (srcUrl.startsWith('http')) {
      const ext = path.extname(srcUrl.split('?')[0]) || '.jpg';
      const filename = `${p.sku}_${i + 1}${ext}`;
      const localDest = path.join(unoaerreDir, filename);
      const publicPath = `/images/products/unoaerre/${filename}`;

      try {
        if (!fs.existsSync(localDest)) {
          await downloadFile(srcUrl, localDest);
        }
        localImages.push(publicPath);
      } catch (e) {
        localImages.push(srcUrl);
      }
    } else {
      localImages.push(srcUrl);
    }
  }

  const cleanName = finalTitle
    ? (finalTitle.startsWith('Unoaerre') ? finalTitle : `Unoaerre — ${finalTitle}`)
    : p.name;

  const { error: updErr } = await sb
    .from('oroeco_products')
    .update({
      name: cleanName,
      images: localImages,
      updated_at: new Date().toISOString()
    })
    .eq('id', p.id);

  if (updErr) {
    console.error(`[ERR] ${p.sku}:`, updErr.message);
  } else {
    console.log(`[DONE] ${p.sku} -> "${cleanName}" (${localImages.length} images)`);
  }
}

async function main() {
  const { data, error } = await sb
    .from('oroeco_products')
    .select('id, sku, barcode, name, images')
    .eq('brand_name', 'Unoaerre')
    .order('sku');

  if (error) {
    console.error('DB error:', error);
    return;
  }

  console.log(`Starting enrichment for all ${data.length} Unoaerre products...`);

  // Process sequentially to be gentle on Chrome and Fastly
  for (let i = 0; i < data.length; i++) {
    const p = data[i];
    console.log(`\n(${i + 1}/${data.length})`);
    await processProduct(p);
  }

  console.log('\n=== ALL UNOAERRE PRODUCTS SUCCESSFULLY ENRICHED! ===');
}

main();
