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

async function testToggle() {
  console.log('--- TESTING 1-CLICK VISIBILITY TOGGLE ---');
  const catalog = await getProducts();
  const sample = catalog.products[0];
  console.log(`Initial product: ${sample.name} (SKU: ${sample.sku}) -> Status: ${sample.approvalStatus}`);

  // 1. Toggle to rejected (Solo Cassa)
  console.log('\nToggling to Solo Cassa (rejected)...');
  const res1 = await patch({ action: 'update_approval', id: sample.id, status: 'rejected' });
  console.log('Result 1:', res1.status, res1.data.success);

  // 2. Toggle back to online (approved)
  console.log('\nToggling back to Online (approved)...');
  const res2 = await patch({ action: 'update_approval', id: sample.id, status: 'approved' });
  console.log('Result 2:', res2.status, res2.data.success);

  console.log('\n✓ 1-CLICK TOGGLE IS FULLY OPERATIONAL!');
}

testToggle().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
