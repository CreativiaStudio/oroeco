const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

async function inspect() {
  const { data: brands, error: bErr } = await sb.from('oroeco_brands').select('*').order('name');
  console.log('--- OROECO_BRANDS (' + (brands ? brands.length : 0) + ') ---');
  if (brands) {
    brands.forEach(b => console.log(b.id, '|', b.name, '|', b.slug));
  }

  const { data: products, error: pErr } = await sb.from('oroeco_products').select('brand_name');
  const counts = {};
  if (products) {
    products.forEach(p => {
      const bn = p.brand_name || '(null)';
      counts[bn] = (counts[bn] || 0) + 1;
    });
  }
  console.log('\n--- PRODUCT COUNTS BY BRAND_NAME in oroeco_products ---');
  console.log(JSON.stringify(counts, null, 2));
}

inspect().catch(console.error);
