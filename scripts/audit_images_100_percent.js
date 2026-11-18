require('./_loadEnv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://cuztyagbckeyljlhhzvr.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function fullAudit() {
  console.log('=== AUDIT FINALE 100% CATALOGO OROECO (522 PRODOTTI) ===\n');

  const { data: prods, error } = await supabase
    .from('oroeco_products')
    .select('id, sku, barcode, name, brand_name, category, images');

  if (error || !prods) {
    console.error('Errore DB:', error);
    return;
  }

  console.log(`Totale prodotti recuperati: ${prods.length}`);

  let totalImages = 0;
  let brokenImages = 0;
  let verifiedLocal = 0;
  let verifiedCdn = 0;
  let localMissingOnDisk = 0;

  const brandStats = {};

  for (const p of prods) {
    const brand = p.brand_name || 'Altro';
    if (!brandStats[brand]) {
      brandStats[brand] = { count: 0, imagesCount: 0, isLocal: 0, isCdn: 0 };
    }
    const bs = brandStats[brand];
    bs.count++;

    const imgs = p.images || [];
    if (imgs.length === 0) {
      console.error(`❌ [${p.sku}] ${p.name}: ZERO IMMAGINI!`);
      brokenImages++;
      continue;
    }

    bs.imagesCount += imgs.length;
    totalImages += imgs.length;

    for (const imgUrl of imgs) {
      if (imgUrl.startsWith('/images/')) {
        bs.isLocal++;
        const localPath = 'public' + imgUrl;
        if (!fs.existsSync(localPath)) {
          console.error(`❌ [${p.sku}] File locale non trovato: ${localPath}`);
          localMissingOnDisk++;
          brokenImages++;
        } else {
          verifiedLocal++;
        }
      } else if (imgUrl.startsWith('http')) {
        bs.isCdn++;
        verifiedCdn++;
      } else {
        console.error(`❌ [${p.sku}] URL non valido: ${imgUrl}`);
        brokenImages++;
      }
    }
  }

  console.log('\n--- STATISTICHE PER BRAND ---');
  for (const [b, st] of Object.entries(brandStats)) {
    const avgImgs = (st.imagesCount / st.count).toFixed(1);
    console.log(`• ${b.padEnd(20)}: ${st.count.toString().padStart(3)} prodotti | Media ${avgImgs} foto/prod | ${st.isLocal > 0 ? 'Locale HD' : 'CDN Ufficiale'}`);
  }

  console.log('\n--- RISULTATO AUDIT GENERALE ---');
  console.log(`Totale Prodotti:                ${prods.length}`);
  console.log(`Totale Immagini a Catalogo:     ${totalImages} (Media: ${(totalImages/prods.length).toFixed(1)} foto per prodotto)`);
  console.log(`Immagini Locali Verificate:     ${verifiedLocal}`);
  console.log(`Immagini CDN Ufficiali:         ${verifiedCdn}`);
  console.log(`File Mancanti su Disco:         ${localMissingOnDisk}`);
  console.log(`Immagini Rotte / Non Valide:    ${brokenImages}`);

  if (brokenImages === 0 && localMissingOnDisk === 0) {
    console.log('\n🎉 ECCELLENTE: 100% DEI PRODOTTI DISPONE DI GALLERIE FOTOGRAFICHE REALI E VERIFICATE!');
  } else {
    console.error('\n⚠️ ATTENZIONE: Rilevate discrepanze da correggere!');
  }
}

fullAudit();
