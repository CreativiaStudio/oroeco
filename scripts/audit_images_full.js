require('./_loadEnv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://cuztyagbckeyljlhhzvr.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function runAudit() {
  console.log('=== AUDIT DIAGNOSTICO COMPLETO FOTOGRAFIE OROECO ===\n');

  const { data: allProducts, error } = await supabase
    .from('oroeco_products')
    .select('id, sku, barcode, name, brand_name, category, images');

  if (error || !allProducts) {
    console.error('Errore lettura DB:', error);
    return;
  }

  console.log(`Totale prodotti analizzati: ${allProducts.length}\n`);

  const brandAudit = {};

  for (const p of allProducts) {
    const brand = p.brand_name || 'Sconosciuto';
    if (!brandAudit[brand]) {
      brandAudit[brand] = {
        total: 0,
        withImages: 0,
        withoutImages: 0,
        domains: new Set(),
        sampleUrls: [],
        verified200: 0,
        failedUrls: 0,
        imageSources: new Set(),
      };
    }

    const b = brandAudit[brand];
    b.total++;

    const imgs = p.images || [];
    if (imgs.length === 0) {
      b.withoutImages++;
    } else {
      b.withImages++;
      imgs.forEach((u) => {
        try {
          const parsed = new URL(u);
          b.domains.add(parsed.hostname);
        } catch (e) {
          b.domains.add('invalid-url');
        }
      });
      if (b.sampleUrls.length < 3) {
        b.sampleUrls.push({ sku: p.sku, url: imgs[0] });
      }
    }
  }

  // Now test HTTP status for sample URLs from each brand
  console.log('--- TEST RISOLUZIONE HTTP DEI DOMINI IMMAGINE ---\n');

  const report = [];

  for (const [brand, info] of Object.entries(brandAudit)) {
    let domainStatus = 'NON TESTATO';
    let sampleTest = null;

    if (info.sampleUrls.length > 0) {
      const target = info.sampleUrls[0].url;
      try {
        const res = await fetch(target, {
          method: 'HEAD',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        });
        sampleTest = { url: target, status: res.status, ok: res.ok };
      } catch (err) {
        sampleTest = { url: target, status: 'ERROR', error: err.message, ok: false };
      }
    }

    const domainsArr = [...info.domains];
    const isWorking = sampleTest?.ok === true;

    report.push({
      brand,
      total: info.total,
      domains: domainsArr,
      sampleTest,
      status: isWorking ? '✅ FUNZIONANTE (200 OK)' : '❌ ROTTO / NON ESISTE (404/ERR)',
    });

    console.log(`Brand: ${brand.padEnd(20)} | Totale: ${String(info.total).padStart(3)} | Stato: ${isWorking ? '✅ 200 OK' : '❌ ' + (sampleTest?.status || 'ERR')}`);
    console.log(`  Domini usati: ${domainsArr.join(', ')}`);
    console.log(`  Esempio URL: ${sampleTest?.url || 'nessuno'}`);
    if (!isWorking && sampleTest?.error) console.log(`  Dettaglio errore: ${sampleTest.error}`);
    console.log('');
  }

  fs.writeFileSync('scripts/audit_images_report.json', JSON.stringify(report, null, 2));
  console.log('Report dettagliato salvato in scripts/audit_images_report.json');
}

runAudit();
