const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

async function findPlaceholders() {
  const { data, error } = await sb
    .from('oroeco_products')
    .select('id, sku, barcode, name, brand_name, images, supplier_name');

  if (error) {
    console.error(error);
    return;
  }

  const byBrand = {};
  const imageCounts = {};

  for (const p of data) {
    const firstImg = p.images && p.images[0] ? p.images[0] : 'NO_IMAGE';
    imageCounts[firstImg] = (imageCounts[firstImg] || 0) + 1;

    if (!byBrand[p.brand_name]) {
      byBrand[p.brand_name] = { total: 0, items: [] };
    }
    byBrand[p.brand_name].total++;
    byBrand[p.brand_name].items.push({
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      firstImg,
      imagesCount: p.images ? p.images.length : 0
    });
  }

  // Find images repeated across multiple products (>3 times)
  const repeatedImages = Object.entries(imageCounts)
    .filter(([img, count]) => count > 3)
    .sort((a, b) => b[1] - a[1]);

  console.log('--- REPEATED IMAGES (>3 products) ---');
  for (const [img, count] of repeatedImages) {
    console.log(`${count} products share: ${img}`);
  }

  console.log('\n--- BREAKDOWN BY BRAND ---');
  for (const [brand, info] of Object.entries(byBrand)) {
    // Check if brand has suspicious images (e.g. Unsplash, logo, or all identical)
    const distinctImages = new Set(info.items.map(i => i.firstImg));
    const hasUnsplash = info.items.some(i => i.firstImg.includes('unsplash'));
    const hasLogo = info.items.some(i => i.firstImg.toLowerCase().includes('logo') || i.firstImg.toLowerCase().includes('placeholder'));
    
    console.log(`Brand: "${brand}" | Total: ${info.total} | Distinct First Images: ${distinctImages.size} | Has Unsplash: ${hasUnsplash} | Has Logo/Placeholder: ${hasLogo}`);
  }
}

findPlaceholders();
