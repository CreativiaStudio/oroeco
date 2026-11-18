const fs = require('fs');
const path = require('path');

function auditFolder(baseDir) {
  const suppliers = fs.readdirSync(baseDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  console.log(`Found ${suppliers.length} supplier folders:`);
  
  const stats = {};
  suppliers.forEach(s => {
    const sPath = path.join(baseDir, s);
    const files = [];
    function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) walk(full);
        else files.push(f.name);
      });
    }
    walk(sPath);
    stats[s] = {
      total: files.length,
      pdfs: files.filter(f => f.endsWith('.pdf')).length,
      xlsx: files.filter(f => f.endsWith('.xlsx')).length,
      sample: files.slice(0, 3)
    };
  });

  console.table(stats);
}

auditFolder(path.join(__dirname, '..', 'Oroeco fatture'));
