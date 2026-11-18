const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

async function run() {
  console.log('=== FIX BRAND NAMES IN SUPABASE ===\n');

  // 1. Update oroeco_brands
  console.log('1. Updating oroeco_brands...');
  const { data: b1, error: e1 } = await sb
    .from('oroeco_brands')
    .update({ name: 'Davite & Delucchi', slug: 'davite-delucchi' })
    .eq('slug', 'davide-delucchi')
    .select();
  if (e1) console.error('Error updating Davite & Delucchi in oroeco_brands:', e1);
  else console.log('Updated in oroeco_brands (Davite & Delucchi):', b1);

  const { data: b2, error: e2 } = await sb
    .from('oroeco_brands')
    .update({ name: 'Villeroy & Boch', slug: 'villeroy-boch' })
    .eq('slug', 'villeroy')
    .select();
  if (e2) console.error('Error updating Villeroy & Boch in oroeco_brands:', e2);
  else console.log('Updated in oroeco_brands (Villeroy & Boch):', b2);

  // 2. Update oroeco_products for Davite & Delucchi
  console.log('\n2. Updating products for Davite & Delucchi...');
  const { data: p1, error: ep1 } = await sb
    .from('oroeco_products')
    .update({ brand_name: 'Davite & Delucchi' })
    .in('brand_name', ['Davite Delucchi', 'Davide Delucchi'])
    .select('id, sku, brand_name');
  if (ep1) console.error('Error updating products to Davite & Delucchi:', ep1);
  else console.log(`Updated ${p1 ? p1.length : 0} products to 'Davite & Delucchi'.`);

  // 3. Update oroeco_products for Villeroy & Boch
  console.log('\n3. Updating products for Villeroy & Boch...');
  const { data: p2, error: ep2 } = await sb
    .from('oroeco_products')
    .update({ brand_name: 'Villeroy & Boch' })
    .eq('brand_name', 'Villeroy')
    .select('id, sku, brand_name');
  if (ep2) console.error('Error updating products to Villeroy & Boch:', ep2);
  else console.log(`Updated ${p2 ? p2.length : 0} products to 'Villeroy & Boch'.`);

  // 4. Verify counts
  console.log('\n4. Verifying new counts...');
  const { data: allProds } = await sb.from('oroeco_products').select('brand_name');
  const counts = {};
  allProds.forEach(p => {
    counts[p.brand_name] = (counts[p.brand_name] || 0) + 1;
  });
  console.log(JSON.stringify(counts, null, 2));

  const { data: allBrands } = await sb.from('oroeco_brands').select('name, slug').order('name');
  console.log('\nAll Brands in DB:');
  allBrands.forEach(b => console.log(`- ${b.name} (${b.slug})`));
}

run().catch(console.error);
