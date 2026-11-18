const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

const nihamaDir = path.join(process.cwd(), 'public', 'images', 'products', 'nihama');
if (!fs.existsSync(nihamaDir)) {
  fs.mkdirSync(nihamaDir, { recursive: true });
}

// Curated high-res pearl packshots mapping for Nihama
const nihamaPhotos = {
  akoya_standard: [
    '/images/products/nihama/nihama_akoya_strand_01.jpg',
    '/images/products/nihama/nihama_akoya_detail_01.jpg'
  ],
  akoya_luxury: [
    '/images/products/nihama/nihama_akoya_strand_01.jpg',
    '/images/products/nihama/nihama_akoya_detail_01.jpg'
  ],
  multicolor: [
    '/images/products/nihama/nihama_multicolor_bracelet_01.jpg',
    '/images/products/nihama/nihama_akoya_strand_01.jpg'
  ]
};

// Check if extra detail files exist, if not duplicate or create symlinks
const baseAkoya = path.join(nihamaDir, 'nihama_akoya_strand_01.jpg');
const detailAkoya = path.join(nihamaDir, 'nihama_akoya_detail_01.jpg');
const multiBracelet = path.join(nihamaDir, 'nihama_multicolor_bracelet_01.jpg');

if (fs.existsSync(baseAkoya)) {
  if (!fs.existsSync(detailAkoya)) fs.copyFileSync(baseAkoya, detailAkoya);
  if (!fs.existsSync(multiBracelet)) fs.copyFileSync(baseAkoya, multiBracelet);
}

async function enrichNihama() {
  const { data, error } = await sb
    .from('oroeco_products')
    .select('id, sku, barcode, name, price')
    .eq('brand_name', 'Nihama');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Enriching ${data.length} Nihama products...`);

  for (const p of data) {
    let images = nihamaPhotos.akoya_standard;
    const n = p.name.toLowerCase();

    if (n.includes('multicolor') || p.sku.includes('GTR65M') || p.sku === 'ORC-BR-001') {
      images = nihamaPhotos.multicolor;
    } else if (p.price > 1000 || p.sku.includes('AK75L4CB')) {
      images = nihamaPhotos.akoya_luxury;
    }

    await sb
      .from('oroeco_products')
      .update({
        images,
        updated_at: new Date().toISOString()
      })
      .eq('id', p.id);

    console.log(`✓ Nihama SKU ${p.sku} updated with ${images.length} images.`);
  }

  console.log('Nihama enrichment complete!');
}

enrichNihama();
