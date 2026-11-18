require('./_loadEnv');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://cuztyagbckeyljlhhzvr.supabase.co';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function syncCatalog() {
  const { data: prods } = await supabase.from('oroeco_products').select('sku, images');
  const imageMap = {};
  prods.forEach(p => { imageMap[p.sku] = p.images; });

  let catalogContent = fs.readFileSync('lib/catalog.ts', 'utf8');

  let replacedCount = 0;
  for (const [sku, imgs] of Object.entries(imageMap)) {
    // Regex looking for product with this sku and its images array
    const skuRegex = new RegExp(`sku:\\s*["']${sku}["'][\\s\\S]*?images:\\s*\\[([^\\]]*)\\]`, 'm');
    const match = catalogContent.match(skuRegex);
    if (match) {
      const newImagesStr = JSON.stringify(imgs, null, 6).replace(/\n/g, '\n      ');
      const targetBlock = match[0];
      const replacementBlock = targetBlock.replace(/images:\s*\[[^\\]]*\]/, `images: ${newImagesStr}`);
      if (targetBlock !== replacementBlock) {
        catalogContent = catalogContent.replace(targetBlock, replacementBlock);
        replacedCount++;
      }
    }
  }

  fs.writeFileSync('lib/catalog.ts', catalogContent);
  console.log(`Synced lib/catalog.ts: updated ${replacedCount} product image arrays.`);
}

syncCatalog();
