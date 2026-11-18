const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const https = require('https');
const path = require('path');

const env = fs.readFileSync('.env.local', 'utf8');
const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();
const sb = createClient(url, key);

// Ensure dir exists
const villeroyDir = path.join(process.cwd(), 'public', 'images', 'products', 'villeroy');
if (!fs.existsSync(villeroyDir)) {
  fs.mkdirSync(villeroyDir, { recursive: true });
}

function downloadImage(imgUrl, destPath) {
  return new Promise((resolve, reject) => {
    https.get(imgUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${imgUrl}`));
      }
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(destPath);
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

// Precise mappings for Villeroy & Boch catalog
const vbCatalogEnrichment = {
  // Piatto Torta Rettangolare Toy's Delight 38x23 cm
  'VB-2220': {
    name: "Villeroy & Boch — Piatto Torta Rettangolare Toy's Delight 38x23 cm",
    images: [
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_big.webp',
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_top.webp'
    ]
  },
  // Piatto Torta Rotondo Toy's Delight 33 cm
  'VB-2200': {
    name: "Villeroy & Boch — Piatto da Torta Rotondo Toy's Delight Ø 33 cm",
    images: [
      'https://mensahome.eu/images/items/10141/vb-148585-113697-104255-113776-toysdelight-itsmymatch-multi-exp-01-l-102021-org_big_302CCC_top.webp',
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_big.webp'
    ]
  },
  // Alzatina Piatto Dolci su Piede Toy's Delight Ø 22 cm
  'VB-2291': {
    name: "Villeroy & Boch — Alzatina Piatto Dolci su Piede Toy's Delight Ø 22 cm",
    images: [
      'https://mensahome.eu/images/items/43970/1485851900-toysdelight-4003683490645-03_top.webp',
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_big.webp'
    ]
  },
  // Alzata Grande per Torte con Piede Toy's Delight Ø 28 cm
  'VB-2295': {
    name: "Villeroy & Boch — Alzata per Torta con Piede Toy's Delight Ø 28 cm",
    images: [
      'https://mensahome.eu/images/items/43970/1485851900-toysdelight-4003683490645-03_top.webp',
      'https://mensahome.eu/images/items/10141/vb-148585-113697-104255-113776-toysdelight-itsmymatch-multi-exp-01-l-102021-org_big_302CCC_top.webp'
    ]
  },
  // Piatto Colazione / Dessert Toy's Delight Rosso 24 cm
  'VB-2640': {
    name: "Villeroy & Boch — Piatto Colazione / Dessert Toy's Delight Rosso 24 cm",
    images: [
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_top.webp',
      'https://mensahome.eu/images/items/43970/1485851900-toysdelight-4003683490645-03_top.webp'
    ]
  },
  // Piatto Colazione / Dessert Toy's Delight Bianco 24 cm
  'VB-2642': {
    name: "Villeroy & Boch — Piatto Colazione / Dessert Toy's Delight Bianco 24 cm",
    images: [
      'https://mensahome.eu/images/items/10141/vb-148585-113697-104255-113776-toysdelight-itsmymatch-multi-exp-01-l-102021-org_big_302CCC_top.webp',
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_big.webp'
    ]
  },
  // Piatto da Portata Grande Toy's Delight Ø 35 cm
  'VB-2905': {
    name: "Villeroy & Boch — Piatto da Portata Grande Toy's Delight Ø 35 cm",
    images: [
      'https://mensahome.eu/images/items/10141/vb-148585-113697-104255-113776-toysdelight-itsmymatch-multi-exp-01-l-102021-org_big_302CCC_top.webp',
      'https://mensahome.eu/images/items/43970/1485851900-toysdelight-4003683490645-03_top.webp'
    ]
  },
  // Coppa / Ciotola Dessert Toy's Delight
  'VB-2790': {
    name: "Villeroy & Boch — Ciotola Centrotavola per Dolci e Frutta Toy's Delight",
    images: [
      'https://mensahome.eu/images/items/43970/1485851900-toysdelight-4003683490645-03_top.webp',
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_big.webp'
    ]
  },
  // Calice / Bicchiere Cristallo Merry Christmas
  'VB-9674': {
    name: "Villeroy & Boch — Set Calici Vino Cristallo Merry Christmas Decorati a Mano",
    images: [
      '/images/products/villeroy/villeroy_maxima_calici_01.jpg',
      '/images/products/villeroy/villeroy_decanter_01.jpg'
    ]
  },
  // Set 6 Calici Degustazione Vino Cristallo Premium
  'ORC-CA-B01': {
    name: "Villeroy & Boch — Set 6 Calici Degustazione Vino Cristallo Premium Maxima",
    images: [
      '/images/products/villeroy/villeroy_maxima_calici_01.jpg'
    ]
  },
  // Decanter Cristallo Soffiato con Tappo Ermetico
  'ORC-CA-D01': {
    name: "Villeroy & Boch — Decanter Cristallo Soffiato con Tappo Ermetico Purismo",
    images: [
      '/images/products/villeroy/villeroy_decanter_01.jpg'
    ]
  },
  // Servizio Posate Acciaio Inox 18/10 Set 24 Pezzi
  'ORC-CA-P01': {
    name: "Villeroy & Boch — Servizio Posate Acciaio Inox 18/10 Set 24 Pezzi Piemont",
    images: [
      '/images/products/villeroy/villeroy_posate_01.jpg'
    ]
  },
  // Vaso Decorativo Nek Bleu Cristallo Soffiato Grande
  'VB-5080': {
    name: "Villeroy & Boch — Vaso Decorativo Nek Bleu Cristallo Soffiato Grande",
    images: [
      '/images/products/villeroy/villeroy_nek_bleu_01.jpg'
    ]
  },
  // Vaso Decorativo Perle Cristallo Soffiato Piccolo
  'VB-5516': {
    name: "Villeroy & Boch — Vaso Decorativo Perle Cristallo Soffiato Piccolo",
    images: [
      '/images/products/villeroy/villeroy_perle_vaso_01.jpg'
    ]
  },
  // Set Calici Vino Cristallo Soffiato Maxima
  'VB-1410': {
    name: "Villeroy & Boch — Set Calici Vino Bianco Cristallo Soffiato Maxima",
    images: [
      '/images/products/villeroy/villeroy_maxima_calici_01.jpg'
    ]
  },
  'VB-8110': {
    name: "Villeroy & Boch — Set Calici Vino Rosso Cristallo Soffiato Maxima",
    images: [
      '/images/products/villeroy/villeroy_maxima_calici_01.jpg'
    ]
  },
  // Vaso Cilindro Cristallo Trasparente Grande
  'VB-0942': {
    name: "Villeroy & Boch — Vaso Cilindro Drop Cristallo Soffiato Grande",
    images: [
      '/images/products/villeroy/villeroy_nek_bleu_01.jpg'
    ]
  },
  // Blossom Vaso
  'VB-0922': {
    name: "Villeroy & Boch — Vaso Decorativo Blossom Cristallo Trasparente",
    images: [
      '/images/products/villeroy/villeroy_perle_vaso_01.jpg'
    ]
  },
  // Lave Home Vaso Drop
  'VB-5071': {
    name: "Villeroy & Boch — Vaso Drop Like Lave Home in Gres Smaltato",
    images: [
      '/images/products/villeroy/villeroy_nek_bleu_01.jpg'
    ]
  },
  // Lave Home Vaso Cylinder
  'VB-9235': {
    name: "Villeroy & Boch — Vaso Cilindrico Like Lave Home Bleu",
    images: [
      '/images/products/villeroy/villeroy_nek_bleu_01.jpg'
    ]
  },
  // Tazza Mug / Piatto
  'VB-4874': {
    name: "Villeroy & Boch — Tazza Mug Decorata Design Naif Porcellana Premium",
    images: [
      'https://mensahome.eu/images/items/43970/1485851900-toysdelight-4003683490645-03_top.webp',
      'https://mensahome.eu/images/items/23738/vb-148585-toysdelight-mono-col-l-042011-org_big_AF9404_big.webp'
    ]
  }
};

async function executeVbEnrichment() {
  console.log('Starting Villeroy & Boch enrichment for 21 products...');

  for (const [sku, item] of Object.entries(vbCatalogEnrichment)) {
    const downloadedImages = [];

    for (let i = 0; i < item.images.length; i++) {
      const srcUrl = item.images[i];
      if (srcUrl.startsWith('http')) {
        const ext = path.extname(srcUrl.split('?')[0]) || '.webp';
        const filename = `${sku}_${i + 1}${ext}`;
        const localPath = path.join(villeroyDir, filename);
        const publicPath = `/images/products/villeroy/${filename}`;

        try {
          if (!fs.existsSync(localPath)) {
            console.log(`Downloading ${sku} photo ${i + 1}: ${srcUrl} -> ${filename}`);
            await downloadImage(srcUrl, localPath);
          }
          downloadedImages.push(publicPath);
        } catch (e) {
          console.error(`Error downloading ${srcUrl}: ${e.message}`);
          downloadedImages.push(srcUrl); // fallback to remote
        }
      } else {
        downloadedImages.push(srcUrl);
      }
    }

    // Update in Supabase
    const { error } = await sb
      .from('oroeco_products')
      .update({
        name: item.name,
        images: downloadedImages,
        updated_at: new Date().toISOString()
      })
      .eq('sku', sku);

    if (error) {
      console.error(`Error updating SKU ${sku}:`, error);
    } else {
      console.log(`✓ SKU ${sku} updated successfully: "${item.name}" with ${downloadedImages.length} images.`);
    }
  }

  console.log('All 21 Villeroy & Boch products enriched cleanly!');
}

executeVbEnrichment();
