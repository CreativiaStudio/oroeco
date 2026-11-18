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
    const cmd = `${CHROME} --headless=new --disable-gpu --virtual-time-budget=6000 --dump-dom "${searchUrl}"`;
    const dom = execSync(cmd, { encoding: 'utf8', timeout: 20000, stdio: ['pipe', 'pipe', 'ignore'] });

    // Extract product name from dl4Objects or link
    const nameMatch = dom.match(/item_name&quot;:&quot;([^&]+)&quot;/i) ||
                      dom.match(/"item_name":"([^"]+)"/i) ||
                      dom.match(/class="product-item-link[^>]*>([\s\S]*?)<\/a>/i);
    let title = null;
    if (nameMatch) {
      title = nameMatch[1].trim();
    }

    // Extract images
    const imgMatches = dom.match(/https:\/\/www\.unoaerre\.it\/media\/catalog\/product\/[^\s"']+\.(?:jpg|jpeg|png|webp)/gi);
    let images = [];
    if (imgMatches) {
      // Filter out small logos, icons, placeholders
      images = Array.from(new Set(imgMatches)).filter(img => 
        !img.includes('logo') && 
        !img.includes('placeholder') &&
        !img.includes('unoaerre_gioiello_classica_lux') &&
        (img.includes('/product/cache/') || img.includes('/product/'))
      );
    }

    return { title, images };
  } catch (err) {
    return { title: null, images: [], error: err.message };
  }
}

async function runBatch(limit = 10) {
  const { data, error } = await sb
    .from('oroeco_products')
    .select('id, sku, barcode, name, images')
    .eq('brand_name', 'Unoaerre')
    .like('sku', 'F04%')
    .limit(limit);

  if (error) {
    console.error('DB error:', error);
    return;
  }

  console.log(`Processing ${data.length} Unoaerre products...`);

  for (const item of data) {
    const ref = item.sku.replace(/^F0?/, '');
    console.log(`\nQuerying SKU ${item.sku} (Ref: ${ref})...`);

    const result = searchUnoaerreChrome(ref);
    console.log(`  Found Title: ${result.title || 'NONE'}`);
    console.log(`  Found Images (${result.images.length}):`, result.images.slice(0, 2));

    if (result.images.length > 0) {
      const localImages = [];
      for (let i = 0; i < Math.min(result.images.length, 3); i++) {
        const remoteUrl = result.images[i];
        const ext = path.extname(remoteUrl.split('?')[0]) || '.jpg';
        const filename = `${item.sku}_${i + 1}${ext}`;
        const localDest = path.join(unoaerreDir, filename);
        const publicPath = `/images/products/unoaerre/${filename}`;

        try {
          if (!fs.existsSync(localDest)) {
            await downloadFile(remoteUrl, localDest);
          }
          localImages.push(publicPath);
        } catch (e) {
          console.error(`  Download error for ${remoteUrl}: ${e.message}`);
          localImages.push(remoteUrl);
        }
      }

      const newName = result.title 
        ? `Unoaerre — ${result.title} Ref. ${item.sku}`
        : item.name;

      const { error: updErr } = await sb
        .from('oroeco_products')
        .update({
          name: newName,
          images: localImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id);

      if (updErr) {
        console.error(`  Supabase update failed for ${item.sku}:`, updErr);
      } else {
        console.log(`  ✓ Updated ${item.sku} on Supabase with ${localImages.length} images!`);
      }
    } else {
      console.log(`  ⚠ No images found for ${item.sku}.`);
    }
  }
}

runBatch(10);
