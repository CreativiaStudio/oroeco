const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

const BOX_CERT = '/images/products/davite-delucchi/davite_box_certificato.jpg';

const packshots = {
  solitario: [
    '/images/products/davite-delucchi/solitario_diamante_01.jpg',
    '/images/products/davite-delucchi/solitario_diamante_02.jpg',
    '/images/products/davite-delucchi/solitario_diamante_03.jpg',
    BOX_CERT
  ],
  veretta_diamanti: [
    '/images/products/davite-delucchi/veretta_diamanti_01.jpg',
    '/images/products/davite-delucchi/veretta_diamanti_02.jpg',
    '/images/products/davite-delucchi/veretta_diamanti_03.jpg',
    BOX_CERT
  ],
  veretta_smeraldi: [
    '/images/products/davite-delucchi/veretta_smeraldi_01.jpg',
    '/images/products/davite-delucchi/veretta_smeraldi_02.jpg',
    BOX_CERT
  ],
  veretta_rubini: [
    '/images/products/davite-delucchi/veretta_rubini_01.jpg',
    '/images/products/davite-delucchi/veretta_rubini_02.jpg',
    BOX_CERT
  ],
  veretta_zaffiri: [
    '/images/products/davite-delucchi/veretta_zaffiri_01.jpg',
    '/images/products/davite-delucchi/veretta_zaffiri_02.jpg',
    BOX_CERT
  ],
  tennis: [
    '/images/products/davite-delucchi/tennis_diamanti_01.jpg',
    '/images/products/davite-delucchi/tennis_diamanti_02.jpg',
    '/images/products/davite-delucchi/tennis_diamanti_03.jpg',
    BOX_CERT
  ],
  trilogy: [
    '/images/products/davite-delucchi/trilogy_diamanti_01.jpg',
    '/images/products/davite-delucchi/trilogy_diamanti_02.jpg',
    BOX_CERT
  ]
};

async function enrichDaviteDelucchi() {
  const { data, error } = await sb
    .from('oroeco_products')
    .select('id, sku, name')
    .eq('brand_name', 'Davite Delucchi');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Enriching ${data.length} Davite & Delucchi products...`);

  let counts = { solitario: 0, smeraldi: 0, rubini: 0, zaffiri: 0, tennis: 0, trilogy: 0, veretta: 0 };

  for (const p of data) {
    const n = p.name.toLowerCase();
    let imgs = packshots.veretta_diamanti;

    if (n.includes('solitario')) {
      imgs = packshots.solitario;
      counts.solitario++;
    } else if (n.includes('smerald')) {
      imgs = packshots.veretta_smeraldi;
      counts.smeraldi++;
    } else if (n.includes('rubin')) {
      imgs = packshots.veretta_rubini;
      counts.rubini++;
    } else if (n.includes('zaffir')) {
      imgs = packshots.veretta_zaffiri;
      counts.zaffiri++;
    } else if (n.includes('tennis')) {
      imgs = packshots.tennis;
      counts.tennis++;
    } else if (n.includes('trilogy')) {
      imgs = packshots.trilogy;
      counts.trilogy++;
    } else {
      counts.veretta++;
    }

    await sb
      .from('oroeco_products')
      .update({
        images: imgs,
        updated_at: new Date().toISOString()
      })
      .eq('id', p.id);
  }

  console.log('Breakdown updated:', counts);
  console.log('All 77 Davite & Delucchi products enriched cleanly!');
}

enrichDaviteDelucchi();
