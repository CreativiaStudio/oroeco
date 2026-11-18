require('./_loadEnv');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://cuztyagbckeyljlhhzvr.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanCatalogTs() {
  const { data: prods } = await supabase.from('oroeco_products').select('sku, images');
  const skuMap = {};
  prods.forEach(p => { if (p.images && p.images.length > 0) skuMap[p.sku] = p.images; });

  let file = fs.readFileSync('lib/catalog.ts', 'utf8');

  // Replace each product's images in lib/catalog.ts by SKU
  for (const [sku, imgs] of Object.entries(skuMap)) {
    const skuIndex = file.indexOf(`sku: "${sku}"`);
    if (skuIndex !== -1) {
      // Find the surrounding product object
      const startObj = file.lastIndexOf('{', skuIndex);
      const endObj = file.indexOf('},', skuIndex);
      if (startObj !== -1 && endObj !== -1) {
        let block = file.slice(startObj, endObj);
        const imagesRegex = /images:\s*\[[\s\S]*?\],/;
        if (imagesRegex.test(block)) {
          const formattedImgs = JSON.stringify(imgs, null, 6)
            .split('\n')
            .map((line, i) => i === 0 ? line : '    ' + line)
            .join('\n');
          const newBlock = block.replace(imagesRegex, `images: ${formattedImgs},`);
          file = file.slice(0, startObj) + newBlock + file.slice(endObj);
        }
      }
    }
  }

  // Also replace any remaining img(...) function definition with a fallback to local image
  file = file.replace(
    /function img\(id: string, width = 1400\): string \{[\s\S]*?\}/,
    `function img(id: string, width = 1400): string {\n  return "/images/products/davite-delucchi/veretta_diamanti_01.jpg";\n}`
  );

  fs.writeFileSync('lib/catalog.ts', file);
  console.log('Successfully updated lib/catalog.ts with local images!');
}

cleanCatalogTs();
