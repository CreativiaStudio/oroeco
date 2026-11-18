const fs = require('fs');
const foundData = JSON.parse(fs.readFileSync('scripts/cuorematto_real_images.json', 'utf8'));

const allCuorSkus = [
  'D9084', 'G3753', 'D6837', 'D9053', 'T2108', 'D9013', 'D9083', 'D9091', 'D9059',
  'D9049', 'D9043', 'D9042', 'D9024', 'T3104', 'A4271', 'D6842', 'D6779', 'D6778',
  'D9012', 'D9163', 'D9181', 'D9182', 'D9229', 'D9141', 'G3737', 'G3674', 'D9115',
  'D9014', 'D9051', 'D9087', 'D6867', 'D6746', 'D9056', 'D9026', 'D9041', 'D9046',
  'D9025', 'D9022', 'D9021', 'D9011', 'D6851', 'H3142', 'A4141', 'A4140', 'A4361',
  'T2302', 'H3144', 'D9237', 'E3536', 'D9162', 'D9164', 'D9183', 'D9112', 'D9117',
  'D9113', 'ORC-CA-F01', 'ORC-CA-SO01', 'ORC-NA-D02'
];

const missing = allCuorSkus.filter(s => !foundData[s]);
console.log('Missing Cuorematto SKUs (' + missing.length + '):', missing.join(', '));
