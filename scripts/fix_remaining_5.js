const fs = require('fs');

const FIX_ASSETS = [
  {
    dest: 'public/images/products/lladro/lladro_my_little_sweetie_01.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_vincolo_damore_01.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_angelo_celestiale_01.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/lladro/lladro_valencia_art_01.jpg',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=85'
  },
  {
    dest: 'public/images/products/luxury/gerba_bracciale_pietre_01.jpg',
    url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=85'
  }
];

async function fix() {
  for (const item of FIX_ASSETS) {
    try {
      const res = await fetch(item.url);
      if (res.status === 200) {
        const buffer = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(item.dest, buffer);
        console.log(`✅ Scaricato: ${item.dest} (${Math.round(buffer.length/1024)} KB)`);
      } else {
        console.error(`❌ HTTP ${res.status}: ${item.url}`);
      }
    } catch (e) {
      console.error(`❌ Errore ${item.dest}: ${e.message}`);
    }
  }
}

fix();
