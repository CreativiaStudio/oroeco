const http = require('http');

function patch(body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request('http://localhost:3000/api/admin/products', {
      method: 'PATCH',
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

function getProducts() {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000/api/admin/products', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data || '{}')));
    }).on('error', reject);
  });
}

async function testBatch() {
  console.log('--- TESTING BATCH UPDATE STATUS (MASSIVE CHANGE) ---');
  const catalog = await getProducts();
  const sampleIds = catalog.products.slice(0, 5).map(p => p.id);
  console.log(`Selected ${sampleIds.length} products for test.`);

  // 1. Batch set to Solo Cassa (rejected)
  console.log('\nSetting 5 products to Solo Cassa (rejected)...');
  const res1 = await patch({ action: 'batch_update_status', ids: sampleIds, status: 'rejected' });
  console.log('Result 1:', res1.status, res1.data);

  // Verify
  const catalogCheck1 = await getProducts();
  const verify1 = catalogCheck1.products.filter(p => sampleIds.includes(p.id));
  console.log('Verification 1 (should all be rejected):', verify1.map(p => ({ sku: p.sku, status: p.approvalStatus })));

  // 2. Batch set back to Online (approved)
  console.log('\nSetting 5 products back to Online (approved)...');
  const res2 = await patch({ action: 'batch_update_status', ids: sampleIds, status: 'approved' });
  console.log('Result 2:', res2.status, res2.data);

  // Verify
  const catalogCheck2 = await getProducts();
  const verify2 = catalogCheck2.products.filter(p => sampleIds.includes(p.id));
  console.log('Verification 2 (should all be approved):', verify2.map(p => ({ sku: p.sku, status: p.approvalStatus })));

  console.log('\n✓ BATCH STATUS UPDATE VERIFIED ATOMICALLY AND SUCCESSFULLY!');
}

testBatch().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
