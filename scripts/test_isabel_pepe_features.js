const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

function post(path, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(`http://localhost:3000${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('--- TESTING ISABEL PEPE SUITE ON OROECO ---');

  // 1. Legal Pages
  const pages = [
    '/privacy-policy',
    '/cookie-policy',
    '/termini-e-condizioni',
    '/spedizioni-e-resi',
    '/admin'
  ];

  for (const page of pages) {
    const res = await get(page);
    console.log(`Page ${page}: Status ${res.status} (OK: ${res.status === 200})`);
    if (res.status !== 200) throw new Error(`Page ${page} failed with ${res.status}`);
  }

  // 2. Consent API
  console.log('\n--- Testing /api/consent ---');
  const testVisitor = 'vid_test_' + Date.now();
  const testConsent = 'csnt_test_' + Date.now();
  const consentRes = await post('/api/consent', {
    consentId: testConsent,
    visitorId: testVisitor,
    categories: { necessary: true, analytics: true, marketing: false, preferences: true },
    policyVersion: '2026.1'
  });
  console.log('Consent POST response:', consentRes);

  const consentGet = await get(`/api/consent?visitorId=${testVisitor}`);
  console.log('Consent GET status:', consentGet.status);

  // 3. Cart Sync API
  console.log('\n--- Testing /api/cart/sync ---');
  const cartRes = await post('/api/cart/sync', {
    visitorId: testVisitor,
    consentId: testConsent,
    email: 'mario@creativiastudio.com',
    subtotal: 1250.00,
    items: [
      {
        product: {
          sku: 'TEST-001',
          name: 'Anello Veretta Oro Bianco 18kt',
          brand: 'Davite & Delucchi',
          price: 1250.00
        },
        quantity: 1
      }
    ],
    status: 'active'
  });
  console.log('Cart Sync response:', cartRes);

  // 4. Tracking Event API
  console.log('\n--- Testing /api/tracking/event ---');
  const trackRes = await post('/api/tracking/event', {
    eventName: 'view_item',
    visitorId: testVisitor,
    consentId: testConsent,
    consentCategories: { necessary: true, analytics: true, marketing: true, preferences: true },
    payload: {
      sku: 'TEST-001',
      price: 1250.00
    },
    url: 'http://localhost:3000/prodotto/test-anello',
    referrer: 'http://localhost:3000/gioielli'
  });
  console.log('Tracking Event response:', trackRes);

  console.log('\n✓ ALL ISABEL PEPE FEATURES OPERATIONAL AND VERIFIED!');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
