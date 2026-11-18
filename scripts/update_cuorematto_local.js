require('./_loadEnv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const url = 'https://cuztyagbckeyljlhhzvr.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function updateCuoremattoLocal() {
  console.log('=== AGGIORNAMENTO IMMAGINI LOCALI CUOREMATTO ===\n');

  const files = fs.readdirSync('public/images/products/cuorematto');
  const fileMap = {};
  files.forEach(f => {
    const sku = path.parse(f).name;
    fileMap[sku] = `/images/products/cuorematto/${f}`;
  });

  const { data: prods } = await supabase.from('oroeco_products')
    .select('id, sku, name, images')
    .eq('brand_name', 'Cuorematto');

  let updated = 0;
  for (const p of prods) {
    const localImg = fileMap[p.sku];
    const boxImg = '/images/products/cuorematto/cuorematto_box_solidale.jpg';
    let newImgs = [];

    if (localImg) {
      newImgs = [localImg, boxImg];
    } else {
      newImgs = [boxImg];
    }

    const { error } = await supabase.from('oroeco_products')
      .update({
        images: newImgs,
        updated_at: new Date().toISOString()
      })
      .eq('id', p.id);

    if (!error) {
      updated++;
      console.log(`✅ [${p.sku}] Aggiornato con: ${newImgs.join(', ')}`);
    } else {
      console.error(`❌ [${p.sku}] Errore update: ${error.message}`);
    }
  }

  console.log(`\nTotale prodotti Cuorematto aggiornati su Supabase: ${updated}/${prods.length}`);
}

updateCuoremattoLocal();
