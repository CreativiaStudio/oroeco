const fs = require('fs');
const path = require('path');

const dirs = [
  'public/images/products/davite-delucchi',
  'public/images/products/nihama',
  'public/images/products/locman',
  'public/images/products/paul-picot',
  'public/images/products/lladro',
  'public/images/products/villeroy',
  'public/images/products/luxury'
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
    console.log('Created directory:', d);
  } else {
    console.log('Directory already exists:', d);
  }
});
