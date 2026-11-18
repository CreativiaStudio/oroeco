const fs = require('fs');

const cuorSkus = [
  'D9084', 'G3753', 'D6837', 'D9053', 'T2108', 'D9013', 'D9083', 'D9091', 'D9059',
  'D9049', 'D9043', 'D9042', 'D9024', 'T3104', 'A4271', 'D6842', 'D6779', 'D6778',
  'D9012', 'D9163', 'D9181', 'D9182', 'D9229', 'D9141', 'G3737', 'G3674', 'D9115',
  'D9014', 'D9051', 'D9087', 'D6867', 'D6746', 'D9056', 'D9026', 'D9041', 'D9046',
  'D9025', 'D9022', 'D9021', 'D9011', 'D6851', 'H3142', 'A4141', 'A4140', 'A4361',
  'T2302', 'H3144', 'D9237', 'E3536', 'D9162', 'D9164', 'D9183', 'D9112', 'D9117',
  'D9113'
];

async function checkCuorematto() {
  const results = {};
  for (const sku of cuorSkus) {
    const url = `https://lebomboniereonline.it/?s=${sku}&post_type=product`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const html = await res.text();
      const productLink = html.match(/href="(https:\/\/lebomboniereonline\.it\/prodotto\/[^"]+)"/i)?.[1];
      if (productLink) {
        const prodRes = await fetch(productLink, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const prodHtml = await prodRes.text();
        const imgs = [...prodHtml.matchAll(/(https:\/\/lebomboniereonline\.it\/wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/gi)].map(m => m[1]);
        const clean = [...new Set(imgs)].filter(u => u.includes(sku) || (u.includes('uploads/20') && !u.includes('logo') && !u.includes('300x300') && !u.includes('150x150')));
        results[sku] = { link: productLink, images: clean.slice(0, 4) };
        console.log(`✅ [${sku}] Found ${clean.length} images: ${clean[0] || 'none'}`);
      } else {
        console.log(`❌ [${sku}] No product page found`);
      }
    } catch(e) {
      console.log(`⚠️ [${sku}] Error: ${e.message}`);
    }
  }
  fs.writeFileSync('scripts/cuorematto_real_images.json', JSON.stringify(results, null, 2));
}

checkCuorematto();
