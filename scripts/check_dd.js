const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

async function checkDD() {
  const { data } = await sb
    .from('oroeco_products')
    .select('sku, barcode, name, price, supplier_cost, attributes')
    .eq('brand_name', 'Davite Delucchi')
    .limit(20);

  console.log(JSON.stringify(data, null, 2));
}

checkDD();
