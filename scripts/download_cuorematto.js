const fs = require('fs');
const path = require('path');

const cuorData = JSON.parse(fs.readFileSync('scripts/cuorematto_real_images.json', 'utf8'));

async function downloadFile(url, dest) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return false;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    return true;
  } catch (e) {
    return false;
  }
}

async function runDownload() {
  console.log('=== DOWNLOAD IMMAGINI REALI CUOREMATTO IN LOCALE ===\n');
  let downloaded = 0;

  for (const [sku, info] of Object.entries(cuorData)) {
    const imgUrl = info.images[0];
    if (!imgUrl) continue;

    const ext = path.extname(imgUrl.split('?')[0]) || '.jpg';
    const filename = `${sku}${ext}`;
    const destPath = path.join('public', 'images', 'products', 'cuorematto', filename);

    const ok = await downloadFile(imgUrl, destPath);
    if (ok) {
      downloaded++;
      console.log(`✅ [${sku}] Scaricata: /images/products/cuorematto/${filename} (${fs.statSync(destPath).size} bytes)`);
    } else {
      console.log(`❌ [${sku}] Download fallito: ${imgUrl}`);
    }
  }

  // Also download the official certified Cuorematto solidarity box packaging
  const boxUrl = 'https://lebomboniereonline.it/wp-content/uploads/2024/05/cuorematto.jpg';
  const boxDest = path.join('public', 'images', 'products', 'cuorematto', 'cuorematto_box_solidale.jpg');
  await downloadFile(boxUrl, boxDest);
  console.log(`✅ Scaricato packaging solidale Antoniano: /images/products/cuorematto/cuorematto_box_solidale.jpg`);

  console.log(`\nTotale immagini Cuorematto scaricate: ${downloaded}`);
}

runDownload();
