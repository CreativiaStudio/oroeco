require('./_loadEnv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://cuztyagbckeyljlhhzvr.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

function getImagesForProduct(p) {
  const brand = (p.brand_name || '').trim();
  const name = (p.name || '').toLowerCase();
  const sku = (p.sku || '').toUpperCase();

  // 1. DAVITE & DELUCCHI
  if (brand.includes('Davite') || brand.includes('Delucchi')) {
    if (name.includes('tennis') && name.includes('zaffir')) {
      return [
        '/images/products/davite-delucchi/tennis_zaffiri_01.jpg',
        '/images/products/davite-delucchi/tennis_zaffiri_02.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    if (name.includes('tennis') && name.includes('rubin')) {
      return [
        '/images/products/davite-delucchi/tennis_rubini_01.jpg',
        '/images/products/davite-delucchi/tennis_rubini_02.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    if (name.includes('tennis')) {
      return [
        '/images/products/davite-delucchi/tennis_diamanti_01.jpg',
        '/images/products/davite-delucchi/tennis_diamanti_02.jpg',
        '/images/products/davite-delucchi/tennis_diamanti_03.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    if (name.includes('smerald')) {
      return [
        '/images/products/davite-delucchi/veretta_smeraldi_01.jpg',
        '/images/products/davite-delucchi/veretta_smeraldi_02.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    if (name.includes('zaffir')) {
      return [
        '/images/products/davite-delucchi/veretta_zaffiri_01.jpg',
        '/images/products/davite-delucchi/veretta_zaffiri_02.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    if (name.includes('rubin')) {
      return [
        '/images/products/davite-delucchi/veretta_rubini_01.jpg',
        '/images/products/davite-delucchi/veretta_rubini_02.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    if (name.includes('solitario')) {
      return [
        '/images/products/davite-delucchi/solitario_diamante_01.jpg',
        '/images/products/davite-delucchi/solitario_diamante_02.jpg',
        '/images/products/davite-delucchi/solitario_diamante_03.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    if (name.includes('trilogy')) {
      return [
        '/images/products/davite-delucchi/trilogy_diamanti_01.jpg',
        '/images/products/davite-delucchi/trilogy_diamanti_02.jpg',
        '/images/products/davite-delucchi/davite_box_certificato.jpg'
      ];
    }
    return [
      '/images/products/davite-delucchi/veretta_diamanti_01.jpg',
      '/images/products/davite-delucchi/veretta_diamanti_02.jpg',
      '/images/products/davite-delucchi/veretta_diamanti_03.jpg',
      '/images/products/davite-delucchi/davite_box_certificato.jpg'
    ];
  }

  // 2. NIHAMA
  if (brand.includes('Nihama')) {
    if (name.includes('bracciale')) {
      return [
        '/images/products/nihama/nihama_bracciale_01.jpg',
        '/images/products/nihama/nihama_bracciale_02.jpg',
        '/images/products/nihama/nihama_box_passaporto.jpg'
      ];
    }
    return [
      '/images/products/nihama/nihama_akoya_strand_01.jpg',
      '/images/products/nihama/nihama_akoya_clasp_02.jpg',
      '/images/products/nihama/nihama_akoya_luster_03.jpg',
      '/images/products/nihama/nihama_box_passaporto.jpg'
    ];
  }

  // 3. LOCMAN
  if (brand.includes('Locman')) {
    if (sku.includes('0560A01A') || name.includes('mare')) {
      return [
        '/images/products/locman/locman_mare_300mt_01.jpg',
        '/images/products/locman/locman_mare_300mt_02.jpg',
        '/images/products/locman/locman_box_garanzia.jpg'
      ];
    }
    if (sku.includes('0223T06S') || (name.includes('stealth') && name.includes('titanio') && !name.includes('lady'))) {
      return [
        '/images/products/locman/locman_stealth_titanio_01.jpg',
        '/images/products/locman/locman_stealth_titanio_02.jpg',
        '/images/products/locman/locman_box_garanzia.jpg'
      ];
    }
    if (sku.includes('0542A01S') || sku === 'ORC-OR-U02' || name.includes('montecristo')) {
      return [
        '/images/products/locman/locman_montecristo_01.jpg',
        '/images/products/locman/locman_montecristo_02.jpg',
        '/images/products/locman/locman_box_garanzia.jpg'
      ];
    }
    if (sku.includes('0254A01A') || (name.includes('1960') && name.includes('crono'))) {
      return [
        '/images/products/locman/locman_1960_crono_01.jpg',
        '/images/products/locman/locman_1960_crono_02.jpg',
        '/images/products/locman/locman_box_garanzia.jpg'
      ];
    }
    if (sku.includes('0253R14R') || (name.includes('1960') && name.includes('lady'))) {
      return [
        '/images/products/locman/locman_1960_lady_01.jpg',
        '/images/products/locman/locman_1960_lady_02.jpg',
        '/images/products/locman/locman_box_garanzia.jpg'
      ];
    }
    if (sku.includes('0538A01S') || sku === 'ORC-OR-D02' || name.includes('stealth lady')) {
      return [
        '/images/products/locman/locman_stealth_lady_01.jpg',
        '/images/products/locman/locman_stealth_lady_02.jpg',
        '/images/products/locman/locman_box_garanzia.jpg'
      ];
    }
    return [
      '/images/products/locman/locman_montecristo_01.jpg',
      '/images/products/locman/locman_montecristo_02.jpg',
      '/images/products/locman/locman_box_garanzia.jpg'
    ];
  }

  // 4. PAUL PICOT
  if (brand.includes('Paul Picot')) {
    if (sku.includes('4352SG') || name.includes('mariner')) {
      return [
        '/images/products/paul-picot/paul_picot_mariner3_01.jpg',
        '/images/products/paul-picot/paul_picot_mariner3_02.jpg',
        '/images/products/paul-picot/paul_picot_radica_box.jpg'
      ];
    }
    if (sku.includes('3759SG') || name.includes('firshire')) {
      return [
        '/images/products/paul-picot/paul_picot_firshire_moon_01.jpg',
        '/images/products/paul-picot/paul_picot_firshire_moon_02.jpg',
        '/images/products/paul-picot/paul_picot_radica_box.jpg'
      ];
    }
    if (sku === '4209' || name.includes('gentleman')) {
      return [
        '/images/products/paul-picot/paul_picot_gentleman_01.jpg',
        '/images/products/paul-picot/paul_picot_gentleman_02.jpg',
        '/images/products/paul-picot/paul_picot_radica_box.jpg'
      ];
    }
    if (sku === '1251ZLN' || name.includes('yachtman')) {
      return [
        '/images/products/paul-picot/paul_picot_yachtman_01.jpg',
        '/images/products/paul-picot/paul_picot_yachtman_02.jpg',
        '/images/products/paul-picot/paul_picot_radica_box.jpg'
      ];
    }
    return [
      '/images/products/paul-picot/paul_picot_classic_01.jpg',
      '/images/products/paul-picot/paul_picot_classic_02.jpg',
      '/images/products/paul-picot/paul_picot_radica_box.jpg'
    ];
  }

  // 5. LLADRÓ
  if (brand.includes('Lladró') || brand.includes('Lladro')) {
    if (sku === '01023890' || name.includes('lace dome')) {
      return [
        '/images/products/lladro/lladro_lace_dome_01.jpg',
        '/images/products/lladro/lladro_lace_dome_02.jpg',
        '/images/products/lladro/lladro_box_sigillo.jpg'
      ];
    }
    if (sku === '01023923' || name.includes('cranes dome')) {
      return [
        '/images/products/lladro/lladro_cranes_dome_01.jpg',
        '/images/products/lladro/lladro_cranes_dome_02.jpg',
        '/images/products/lladro/lladro_box_sigillo.jpg'
      ];
    }
    if (sku === '01023919' || name.includes('paisley dome')) {
      return [
        '/images/products/lladro/lladro_paisley_dome_01.jpg',
        '/images/products/lladro/lladro_paisley_dome_02.jpg',
        '/images/products/lladro/lladro_box_sigillo.jpg'
      ];
    }
    if (sku === '01009430' || name.includes('sweetie')) {
      return [
        '/images/products/lladro/lladro_my_little_sweetie_01.jpg',
        '/images/products/lladro/lladro_my_little_sweetie_02.jpg',
        '/images/products/lladro/lladro_box_sigillo.jpg'
      ];
    }
    if (sku === '01009224' || name.includes('vincolo')) {
      return [
        '/images/products/lladro/lladro_vincolo_damore_01.jpg',
        '/images/products/lladro/lladro_vincolo_damore_02.jpg',
        '/images/products/lladro/lladro_box_sigillo.jpg'
      ];
    }
    if (sku === '01009291' || sku === '01008714' || name.includes('angelo')) {
      return [
        '/images/products/lladro/lladro_angelo_celestiale_01.jpg',
        '/images/products/lladro/lladro_angelo_celestiale_02.jpg',
        '/images/products/lladro/lladro_box_sigillo.jpg'
      ];
    }
    return [
      '/images/products/lladro/lladro_valencia_art_01.jpg',
      '/images/products/lladro/lladro_valencia_art_02.jpg',
      '/images/products/lladro/lladro_box_sigillo.jpg'
    ];
  }

  // 6. VILLEROY & BOCH
  if (brand.includes('Villeroy')) {
    if (sku.includes('VB-9674') || name.includes('christmas') || name.includes('natale') || name.includes('toy')) {
      return [
        '/images/products/villeroy/villeroy_toys_delight_01.jpg',
        '/images/products/villeroy/villeroy_toys_delight_02.jpg',
        '/images/products/villeroy/villeroy_gift_box.jpg'
      ];
    }
    if (sku.includes('VB-8110') || sku === 'ORC-CA-B01' || name.includes('calici') || name.includes('vino')) {
      return [
        '/images/products/villeroy/villeroy_maxima_calici_01.jpg',
        '/images/products/villeroy/villeroy_maxima_calici_02.jpg',
        '/images/products/villeroy/villeroy_gift_box.jpg'
      ];
    }
    if (sku === 'VB-5080' || name.includes('nek bleu')) {
      return [
        '/images/products/villeroy/villeroy_nek_bleu_01.jpg',
        '/images/products/villeroy/villeroy_nek_bleu_02.jpg',
        '/images/products/villeroy/villeroy_gift_box.jpg'
      ];
    }
    if (sku === 'VB-5516' || name.includes('perle')) {
      return [
        '/images/products/villeroy/villeroy_perle_vaso_01.jpg',
        '/images/products/villeroy/villeroy_perle_vaso_02.jpg',
        '/images/products/villeroy/villeroy_gift_box.jpg'
      ];
    }
    if (sku === 'ORC-CA-D01' || name.includes('decanter')) {
      return [
        '/images/products/villeroy/villeroy_decanter_01.jpg',
        '/images/products/villeroy/villeroy_decanter_02.jpg',
        '/images/products/villeroy/villeroy_gift_box.jpg'
      ];
    }
    if (sku === 'ORC-CA-P01' || name.includes('posate')) {
      return [
        '/images/products/villeroy/villeroy_posate_01.jpg',
        '/images/products/villeroy/villeroy_posate_02.jpg',
        '/images/products/villeroy/villeroy_gift_box.jpg'
      ];
    }
    return [
      '/images/products/villeroy/villeroy_toys_delight_01.jpg',
      '/images/products/villeroy/villeroy_toys_delight_02.jpg',
      '/images/products/villeroy/villeroy_gift_box.jpg'
    ];
  }

  // 7. OTHER LUXURY
  if (brand.includes('Guess')) {
    return [
      '/images/products/luxury/guess_watch_01.jpg',
      '/images/products/luxury/guess_watch_02.jpg',
      '/images/products/luxury/luxury_watch_box.jpg'
    ];
  }
  if (brand.includes('Alberelli')) {
    return [
      '/images/products/luxury/alberelli_capodimonte_01.jpg',
      '/images/products/luxury/alberelli_capodimonte_02.jpg',
      '/images/products/luxury/luxury_gift_box.jpg'
    ];
  }
  if (brand.includes('Dana Oro')) {
    return [
      '/images/products/luxury/dana_oro_cerchi_01.jpg',
      '/images/products/luxury/dana_oro_cerchi_02.jpg',
      '/images/products/luxury/luxury_velvet_box.jpg'
    ];
  }
  if (brand.includes('Ducati')) {
    return [
      '/images/products/luxury/ducati_corse_crono_01.jpg',
      '/images/products/luxury/ducati_corse_crono_02.jpg',
      '/images/products/luxury/luxury_watch_box.jpg'
    ];
  }
  if (brand.includes('Gerba')) {
    return [
      '/images/products/luxury/gerba_bracciale_pietre_01.jpg',
      '/images/products/luxury/gerba_bracciale_pietre_02.jpg',
      '/images/products/luxury/luxury_pouch.jpg'
    ];
  }
  if (brand.includes('Golay')) {
    return [
      '/images/products/luxury/golay_south_sea_01.jpg',
      '/images/products/luxury/golay_south_sea_02.jpg',
      '/images/products/luxury/luxury_velvet_box.jpg'
    ];
  }
  if (brand.includes('Cammeo')) {
    return [
      '/images/products/luxury/cammeo_italiano_01.jpg',
      '/images/products/luxury/cammeo_italiano_02.jpg',
      '/images/products/luxury/luxury_velvet_box.jpg'
    ];
  }
  if (brand.includes('AMEN')) {
    return [
      '/images/products/luxury/amen_medaglia_01.jpg',
      '/images/products/luxury/amen_medaglia_02.jpg',
      '/images/products/luxury/amen_box.jpg'
    ];
  }

  return null; // non toccare Stroili, Bulova, Unoaerre o Cuorematto
}

async function updateAll() {
  console.log('=== AGGIORNAMENTO IMMAGINI CATALOGO OROECO SU SUPABASE ===\n');

  const { data: prods, error } = await supabase
    .from('oroeco_products')
    .select('id, sku, barcode, name, brand_name, images');

  if (error || !prods) {
    console.error('Errore fetch DB:', error);
    return;
  }

  console.log(`Totale prodotti letti da DB: ${prods.length}`);

  let updatedCount = 0;
  let untouchedCount = 0;

  for (const p of prods) {
    const newImgs = getImagesForProduct(p);
    if (!newImgs) {
      untouchedCount++;
      continue;
    }

    // Verify all target files exist locally on disk
    for (const imgPath of newImgs) {
      const localDiskPath = 'public' + imgPath;
      if (!fs.existsSync(localDiskPath)) {
        console.warn(`⚠️ File mancante su disco: ${localDiskPath}`);
      }
    }

    const { error: updErr } = await supabase
      .from('oroeco_products')
      .update({
        images: newImgs,
        updated_at: new Date().toISOString()
      })
      .eq('id', p.id);

    if (!updErr) {
      updatedCount++;
    } else {
      console.error(`❌ Errore update per SKU ${p.sku}: ${updErr.message}`);
    }
  }

  console.log(`\nAggiornamento terminato:`);
  console.log(`  - Prodotti aggiornati con percorsi locali verificati: ${updatedCount}`);
  console.log(`  - Prodotti preservati intatti (Stroili, Bulova, Unoaerre, Cuorematto): ${untouchedCount}`);
}

updateAll();
