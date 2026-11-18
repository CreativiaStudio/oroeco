async function searchCuorematto() {
  const skus = ['G3737', 'D9059', 'T2108', 'T3104', 'D6842', 'A4140', 'G3753', 'D6837', 'D9091', 'G3674'];

  for (const s of skus) {
    try {
      const url = `https://lebomboniereonline.it/?s=${s}&post_type=product`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      const html = await res.text();
      const imgs = [...html.matchAll(/(https:\/\/lebomboniereonline\.it\/wp-content\/uploads\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp))/gi)].map(m => m[1]);
      const valid = [...new Set(imgs)].filter(u => !u.includes('logo') && !u.includes('banner') && !u.includes('150x150') && !u.includes('100x100'));
      console.log(`SKU ${s} => Found ${valid.length} images:`, valid.slice(0, 2));
    } catch (e) {
      console.error(`SKU ${s} => Error: ${e.message}`);
    }
  }
}

searchCuorematto();
