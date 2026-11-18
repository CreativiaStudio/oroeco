const fs = require('fs');

async function inspectStroili(sku) {
  const url = `https://www.stroilioro.com/it/it/prodotti/bracciale-radiance-acciaio-dorato-${sku}.html`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const html = await res.text();
  
  // Extract JSON-LD structured data
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLdMatches) {
    try {
      const data = JSON.parse(m[1].trim());
      console.log('JSON-LD:', JSON.stringify(data, null, 2));
    } catch(e) {}
  }

  // Extract meta tags
  const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1];
  const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i)?.[1];
  const ogPrice = html.match(/<meta property="product:price:amount" content="([^"]+)"/i)?.[1];
  const ogCurrency = html.match(/<meta property="product:price:currency" content="([^"]+)"/i)?.[1];
  const metaDesc = html.match(/<meta name="description" content="([^"]+)"/i)?.[1];
  
  console.log('\n--- META TAGS ---');
  console.log({ ogTitle, ogDesc, ogPrice, ogCurrency, metaDesc });
}

inspectStroili('1694774');
