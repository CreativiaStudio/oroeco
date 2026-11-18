require('./_loadEnv');
const { createClient } = require('@supabase/supabase-js');

const url = 'https://cuztyagbckeyljlhhzvr.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

const SKU_TO_PHOTO = {
  'G3737': '/images/products/cuorematto/D9011.jpeg',
  'G3753': '/images/products/cuorematto/D9012.jpeg',
  'G3674': '/images/products/cuorematto/D9013.jpeg',
  'D9059': '/images/products/cuorematto/D9229.jpeg',
  'T2108': '/images/products/cuorematto/D9021.jpeg',
  'T3104': '/images/products/cuorematto/D9022.jpg',
  'T2302': '/images/products/cuorematto/D9024.jpg',
  'E3536': '/images/products/cuorematto/D9025.jpeg',
  'D6842': '/images/products/cuorematto/D6867.jpeg',
  'D6837': '/images/products/cuorematto/D6779.jpeg',
  'D6778': '/images/products/cuorematto/D6746.jpeg',
  'D6851': '/images/products/cuorematto/D9041.jpeg',
  'D9091': '/images/products/cuorematto/D9087.jpeg',
  'A4140': '/images/products/cuorematto/D9181.jpeg',
  'A4141': '/images/products/cuorematto/D9182.jpeg',
  'A4271': '/images/products/cuorematto/D9163.jpeg',
  'A4361': '/images/products/cuorematto/D9164.jpeg',
  'ORC-CA-SO01': '/images/products/cuorematto/D9183.jpeg',
  'ORC-NA-D02': '/images/products/villeroy/villeroy_toys_delight_01.jpg',
  'ORC-CA-F01': '/images/products/cuorematto/D9162.jpeg'
};

async function updateCuoremattoPackshots() {
  console.log('=== ENRICH CUOREMATTO ZERO-PLACEHOLDER PACKSHOTS ===\n');

  const { data: prods, error } = await supabase
    .from('oroeco_products')
    .select('id, sku, name, images')
    .ilike('brand_name', '%Cuorematto%');

  if (error || !prods) {
    console.error(error);
    return;
  }

  let updated = 0;
  for (const p of prods) {
    if (SKU_TO_PHOTO[p.sku]) {
      const primaryPhoto = SKU_TO_PHOTO[p.sku];
      const boxPhoto = '/images/products/cuorematto/cuorematto_box_solidale.jpg';
      const newImages = [primaryPhoto, boxPhoto];

      const { error: updErr } = await supabase
        .from('oroeco_products')
        .update({
          images: newImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', p.id);

      if (!updErr) {
        console.log(`✅ [${p.sku}] ${p.name.slice(0, 40)} -> ${primaryPhoto}`);
        updated++;
      } else {
        console.error(`❌ [${p.sku}] Errore: ${updErr.message}`);
      }
    }
  }

  console.log(`\nAggiornati ${updated} prodotti Cuorematto con foto packshot reale!`);
}

updateCuoremattoPackshots();
