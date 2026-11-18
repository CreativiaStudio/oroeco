const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const xlsx = require('xlsx');

// Curated high-res luxury image pools by category & subcategory
const IMAGE_POOLS = {
  "gioielli-anelli": [
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80"
  ],
  "gioielli-collane": [
    "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1611591475816-1f92c179c94c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80"
  ],
  "gioielli-bracciali": [
    "https://images.unsplash.com/photo-1611591475816-1f92c179c94c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1611591475960-98b7a974ea9f?auto=format&fit=crop&w=1200&q=80"
  ],
  "gioielli-orecchini": [
    "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1635767798638-3e25273a8236?auto=format&fit=crop&w=1200&q=80"
  ],
  "gioielli-ciondoli": [
    "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80"
  ],
  "orologi-uomo": [
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1547996160-71dfa88c9dd0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=1200&q=80"
  ],
  "orologi-donna": [
    "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=1200&q=80"
  ],
  "accessori-pelletteria": [
    "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=80"
  ],
  "accessori-portachiavi": [
    "https://images.unsplash.com/photo-1585856345999-a86fd448bebf?auto=format&fit=crop&w=1200&q=80"
  ],
  "accessori-gemelli": [
    "https://images.unsplash.com/photo-1590548784585-643d2b9f2925?auto=format&fit=crop&w=1200&q=80"
  ],
  "accessori-penne": [
    "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-bicchieri": [
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1572972755836-963d7eb318f7?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-posate": [
    "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-vasi": [
    "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-statue": [
    "https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-candele": [
    "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-profumatori": [
    "https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-cornici": [
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-decanter": [
    "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80"
  ],
  "casa-solidali": [
    "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80"
  ],
  "natale-decorazioni": [
    "https://images.unsplash.com/photo-1512474932049-78ac69ede12c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1543258103-a62bdc069871?auto=format&fit=crop&w=1200&q=80"
  ],
  "natale-regali": [
    "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80"
  ]
};

function getImagesFor(category, subcategory, seedIndex = 0) {
  const key = `${category}-${subcategory}`;
  const pool = IMAGE_POOLS[key] || IMAGE_POOLS["gioielli-anelli"];
  const img1 = pool[seedIndex % pool.length];
  const img2 = pool[(seedIndex + 1) % pool.length];
  return [img1, img2];
}

function generateBarcode(sku) {
  // If sku is already an EAN-13 (13 digits), return it
  if (/^\d{13}$/.test(sku)) return sku;
  
  // Deterministic 13-digit barcode starting with 8054
  let hash = 0;
  for (let i = 0; i < sku.length; i++) {
    hash = (hash * 31 + sku.charCodeAt(i)) % 100000000;
  }
  const body = `8054${String(Math.abs(hash)).padStart(8, '0')}`;
  // EAN-13 checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(body[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return `${body}${check}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[àáâãäå]/g, 'a')
    .replace(/[èéêë]/g, 'e')
    .replace(/[ìíîï]/g, 'i')
    .replace(/[òóôõö]/g, 'o')
    .replace(/[ùúûü]/g, 'u')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Master parsing logic for each supplier
async function extractAllProducts(baseDir) {
  const productsMap = new Map(); // key: SKU -> Product
  let totalFilesScanned = 0;

  console.log('--- STARTING INVOICE EXTRACTION ---');

  // 1. LOCMAN (XLSX)
  const locmanFile = path.join(baseDir, 'LOCMAN', 'LOCMAN.xlsx');
  if (fs.existsSync(locmanFile)) {
    totalFilesScanned++;
    const wb = xlsx.readFile(locmanFile);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    rows.forEach((r, idx) => {
      const sku = String(r['LOCMAN'] || '').trim();
      const desc = String(r['__EMPTY'] || '').trim();
      const price = Number(r['__EMPTY_1']);
      if (sku && desc && price && price > 0 && sku !== 'COD.') {
        const isDonna = /donna|lady/i.test(desc);
        const subcategory = isDonna ? 'donna' : 'uomo';
        productsMap.set(sku, {
          sku,
          barcode: generateBarcode(sku),
          name: `Orologio Locman ${desc}`,
          brand: 'Locman',
          brandSlug: 'locman',
          category: 'orologi',
          subcategory,
          subcategoryLabel: isDonna ? 'Donna' : 'Uomo',
          price,
          compareAtPrice: Math.round(price * 1.15),
          supplierCost: Math.round(price / 2.2),
          markupMultiplier: 2.2,
          stockQuantity: 2,
          description: `Orologio Locman originale referenza ${sku}. Modello: ${desc}. Cassa in titanio e acciaio, vetro minerale zaffiro, movimento svizzero di precisione. Astuccio e garanzia ufficiale 24 mesi.`,
          shortDescription: `Locman ${desc} · Cassa titanio/acciaio, garanzia ufficiale.`,
          images: getImagesFor('orologi', subcategory, idx),
          attributes: { movement: /crono/i.test(desc) ? 'Cronografo al quarzo' : 'Automatico', caseMaterial: 'Titanio e Acciaio', gender: isDonna ? 'Donna' : 'Uomo' },
          tags: ['locman', 'orologio', subcategory, 'cronografo', 'luxury'],
          supplierName: 'Locman S.p.A.',
          invoiceRef: 'Listino Ufficiale Locman',
          approvalStatus: 'approved'
        });
      }
    });
    console.log(`[LOCMAN] Parsed products. Total accumulated: ${productsMap.size}`);
  }

  // 2. PAUL PICOT (XLSX)
  const ppFile = path.join(baseDir, 'PAUL PICOT', 'PAUL PICOT.xlsx');
  if (fs.existsSync(ppFile)) {
    totalFilesScanned++;
    const wb = xlsx.readFile(ppFile);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    rows.forEach((r, idx) => {
      const sku = String(r['PAUL PICOT'] || '').trim();
      const desc = String(r['__EMPTY'] || '').trim();
      const price = Number(r['__EMPTY_1']);
      if (sku && desc && price && price > 0 && sku !== 'COD.') {
        const isDonna = /donna|lady/i.test(desc);
        const subcategory = isDonna ? 'donna' : 'uomo';
        productsMap.set(sku, {
          sku,
          barcode: generateBarcode(sku),
          name: desc.startsWith('Paul Picot') ? desc : `Paul Picot ${desc}`,
          brand: 'Paul Picot',
          brandSlug: 'paul-picot',
          category: 'orologi',
          subcategory,
          subcategoryLabel: isDonna ? 'Donna' : 'Uomo',
          price,
          compareAtPrice: Math.round(price * 1.1),
          supplierCost: Math.round(price / 2.2),
          markupMultiplier: 2.2,
          stockQuantity: 1,
          description: `Alta Orologeria Svizzera Paul Picot, referenza ${sku}. ${desc}. Meccanica di alta precisione, finiture a mano della maison di Le Noirmont, corredato di cofanetto di lusso e garanzia internazionale.`,
          shortDescription: `Paul Picot ${desc} · Alta orologeria svizzera.`,
          images: getImagesFor('orologi', subcategory, idx + 10),
          attributes: { movement: 'Meccanico Automatico Svizzero', caseMaterial: 'Acciaio 316L', gender: isDonna ? 'Donna' : 'Uomo' },
          tags: ['paul-picot', 'alta orologeria', 'svizzera', 'lusso', subcategory],
          supplierName: 'Paul Picot Genève',
          invoiceRef: 'Listino Paul Picot 2026',
          approvalStatus: 'approved'
        });
      }
    });
    console.log(`[PAUL PICOT] Parsed products. Total accumulated: ${productsMap.size}`);
  }

  // 3. LLADRO (XLSX)
  const lladroFile = path.join(baseDir, 'LLADRO', 'LLADRO.xlsx');
  if (fs.existsSync(lladroFile)) {
    totalFilesScanned++;
    const wb = xlsx.readFile(lladroFile);
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    rows.forEach((r, idx) => {
      const rawSku = String(r['LLADRO\''] || '').replace('SKU:', '').trim();
      const desc = String(r['__EMPTY'] || '').trim();
      const price = Number(r['__EMPTY_1']);
      if (rawSku && desc && price && price > 0 && rawSku !== 'COD.') {
        productsMap.set(rawSku, {
          sku: rawSku,
          barcode: generateBarcode(rawSku),
          name: `Lladró — ${desc}`,
          brand: 'Lladró',
          brandSlug: 'lladro',
          category: 'casa',
          subcategory: 'statue',
          subcategoryLabel: 'Statue',
          price,
          compareAtPrice: Math.round(price * 1.1),
          supplierCost: Math.round(price / 2.2),
          markupMultiplier: 2.2,
          stockQuantity: 1,
          description: `Scultura in porcellana d'arte Lladró, referenza ${rawSku}. "${desc}". Modellata e dipinta interamente a mano a Valencia dagli scultori maestri di Lladró. Certificato di autenticità incluso.`,
          shortDescription: `Scultura in porcellana Lladró dipinta a mano.`,
          images: getImagesFor('casa', 'statue', idx),
          attributes: { material: 'Porcellana d\'Arte di Valencia', color: 'Bianco e pastello' },
          tags: ['lladro', 'porcellana', 'statua', 'casa', 'collezione', 'arte'],
          supplierName: 'Lladró Comercial S.A.',
          invoiceRef: 'Listino Ufficiale Lladró',
          approvalStatus: 'approved'
        });
      }
    });
    console.log(`[LLADRO] Parsed products. Total accumulated: ${productsMap.size}`);
  }

  // 4. TIMEWAY / STROILI (PDFs)
  const timewayDir = path.join(baseDir, 'TIMEWAY');
  if (fs.existsSync(timewayDir)) {
    const files = [];
    function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) walk(full);
        else if (f.name.endsWith('.pdf')) files.push(full);
      });
    }
    walk(timewayDir);
    console.log(`[TIMEWAY] Scanning ${files.length} PDF files...`);

    for (const f of files) {
      totalFilesScanned++;
      try {
        const parser = new PDFParse({ data: fs.readFileSync(f) });
        const res = await parser.getText();
        await parser.destroy();

        // Pattern 1: EAN followed by line: e.g. 8057191169568 COLL. FANTASY CUORE GROUMETTE RH 45 cm ... 139,00
        const lines = res.text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          // Match Stroili invoice line: e.g. 1437930 ANELLO GOCCIA TOP. SKY BLUE OG 16 1437930 8057191353639 1 199,00
          const m1 = line.match(/^(\d{7,8})\s+(.+?)\s+\d{7,8}\s+(80\d{11})\s+(\d+)\s+([\d,.]+)/);
          if (m1) {
            const sku = m1[1];
            const desc = m1[2].trim();
            const ean = m1[3];
            const qty = parseInt(m1[4], 10) || 1;
            const price = parseFloat(m1[5].replace(',', '.'));
            
            if (price > 0 && !productsMap.has(sku)) {
              let subcategory = 'anelli';
              let subLabel = 'Anelli';
              let category = 'gioielli';

              if (/anello/i.test(desc)) { subcategory = 'anelli'; subLabel = 'Anelli'; }
              else if (/collana|giroc|coll\./i.test(desc)) { subcategory = 'collane'; subLabel = 'Collane'; }
              else if (/bracciale|bracc/i.test(desc)) { subcategory = 'bracciali'; subLabel = 'Bracciali'; }
              else if (/orecchini/i.test(desc)) { subcategory = 'orecchini'; subLabel = 'Orecchini'; }
              else if (/ciondolo|pendente/i.test(desc)) { subcategory = 'ciondoli'; subLabel = 'Ciondoli e Componenti'; }

              productsMap.set(sku, {
                sku,
                barcode: ean,
                name: `Stroili — ${desc}`,
                brand: 'Stroili',
                brandSlug: 'stroili',
                category,
                subcategory,
                subcategoryLabel: subLabel,
                price,
                compareAtPrice: Math.round(price * 1.15),
                supplierCost: Math.round(price * 0.525), // ~47.5% sconto
                markupMultiplier: 2.1,
                stockQuantity: qty,
                description: `Creazione Stroili Oro, referenza ${sku} (EAN ${ean}). ${desc}. Finiture pregiate, ideale per l'indosso quotidiano o una ricorrenza speciale. Completo di garanzia e confezione originale.`,
                shortDescription: `Gioiello Stroili ${desc}.`,
                images: getImagesFor('gioielli', subcategory, productsMap.size),
                attributes: { metal: /og/i.test(desc) ? 'Oro giallo 9 kt' : 'Argento rodiato 925' },
                tags: ['stroili', 'gioielli', subcategory, 'regalo', 'natale'],
                supplierName: 'Timeway Italy S.r.l.',
                invoiceRef: path.basename(f),
                isChristmas: /regalo|cuore|oro/i.test(desc),
                approvalStatus: 'approved'
              });
            }
            continue;
          }

          // Match pattern 2: 8057191169568 COLL. FANTASY ... 139,00
          const m2 = line.match(/^(80\d{11})\s+([A-Z0-9\s.,+/%-]+?)\s+(?:Dest\.Merci|\d+,00|\d+\s+)(\d{2,4},\d{2})/);
          if (m2) {
            const ean = m2[1];
            const desc = m2[2].replace(/Dest\.Merci\s*:?\s*WSG LOGISTIC/g, '').trim();
            const price = parseFloat(m2[3].replace(',', '.'));
            const sku = `STR-${ean.slice(-7)}`;
            if (desc.length > 5 && price > 0 && !productsMap.has(sku)) {
              let subcategory = 'collane';
              let subLabel = 'Collane';
              if (/anello/i.test(desc)) { subcategory = 'anelli'; subLabel = 'Anelli'; }
              else if (/bracc/i.test(desc)) { subcategory = 'bracciali'; subLabel = 'Bracciali'; }
              else if (/orecch/i.test(desc)) { subcategory = 'orecchini'; subLabel = 'Orecchini'; }
              
              productsMap.set(sku, {
                sku,
                barcode: ean,
                name: `Stroili — ${desc}`,
                brand: 'Stroili',
                brandSlug: 'stroili',
                category: 'gioielli',
                subcategory,
                subcategoryLabel: subLabel,
                price,
                compareAtPrice: Math.round(price * 1.15),
                supplierCost: Math.round(price * 0.5),
                markupMultiplier: 2.0,
                stockQuantity: 1,
                description: `Stroili Gioielli, EAN ${ean}. ${desc}. Garanzia e astuccio inclusi.`,
                shortDescription: `Stroili ${desc}.`,
                images: getImagesFor('gioielli', subcategory, productsMap.size),
                attributes: {},
                tags: ['stroili', subcategory, 'gioielli'],
                supplierName: 'Timeway Italy S.r.l.',
                invoiceRef: path.basename(f),
                approvalStatus: 'approved'
              });
            }
          }
        }
      } catch (err) {
        // ignore individual corrupt pages
      }
    }
    console.log(`[TIMEWAY] Finished. Total accumulated products: ${productsMap.size}`);
  }

  // 5. CITIZEN / BULOVA (PDFs)
  const citizenDir = path.join(baseDir, 'CITIZEN', 'BULOVA');
  if (fs.existsSync(citizenDir)) {
    const files = fs.readdirSync(citizenDir).filter(f => f.endsWith('.pdf'));
    for (const f of files) {
      totalFilesScanned++;
      const parser = new PDFParse({ data: fs.readFileSync(path.join(citizenDir, f)) });
      const res = await parser.getText();
      await parser.destroy();
      const lines = res.text.split('\n');
      for (const line of lines) {
        // e.g. 96B444 Orologio Bulova Uomo Super Seville 1,00 274,45
        const m = line.match(/^([0-9][0-9][A-Z][0-9]{3})\s+(Orologio Bulova\s+(Uomo|Donna)\s+[^0-9]+)\s+([\d,]+)\s+([\d,.]+)/i);
        if (m) {
          const sku = m[1].trim();
          const desc = m[2].trim();
          const gender = m[3].toLowerCase();
          const wholesale = parseFloat(m[5].replace(',', '.'));
          const price = Math.round(wholesale * 2.15); // standard watch boutique retail price
          const subcategory = gender === 'donna' ? 'donna' : 'uomo';

          if (!productsMap.has(sku)) {
            productsMap.set(sku, {
              sku,
              barcode: generateBarcode(`BULOVA-${sku}`),
              name: desc,
              brand: 'Bulova',
              brandSlug: 'bulova',
              category: 'orologi',
              subcategory,
              subcategoryLabel: gender === 'donna' ? 'Donna' : 'Uomo',
              price,
              compareAtPrice: Math.round(price * 1.15),
              supplierCost: wholesale,
              markupMultiplier: 2.15,
              stockQuantity: 1,
              description: `${desc}, referenza originale Bulova ${sku}. Segnatempo iconico con cassa rifinita, movimento ad alta frequenza o automatico di precisione, impermeabile. Corredato di garanzia 3 anni Bulova e cofanetto luxury.`,
              shortDescription: `${desc} · Garanzia ufficiale 3 anni.`,
              images: getImagesFor('orologi', subcategory, productsMap.size),
              attributes: { movement: /crono|262/i.test(desc) ? 'Crono 262 kHz Precisionist' : 'Automatico', caseMaterial: 'Acciaio Inossidabile', gender: gender === 'donna' ? 'Donna' : 'Uomo' },
              tags: ['bulova', 'orologio', subcategory, 'precisione', 'lusso'],
              supplierName: 'Citizen Watch Italy S.p.A.',
              invoiceRef: f,
              approvalStatus: 'approved'
            });
          }
        }
      }
    }
    console.log(`[CITIZEN BULOVA] Finished. Total accumulated products: ${productsMap.size}`);
  }

  // 6. UNOAERRE (PDFs)
  const unoaerreDir = path.join(baseDir, 'UNOAERRE - URIGOLD');
  if (fs.existsSync(unoaerreDir)) {
    const files = fs.readdirSync(unoaerreDir).filter(f => f.endsWith('.pdf'));
    for (const f of files) {
      totalFilesScanned++;
      const parser = new PDFParse({ data: fs.readFileSync(path.join(unoaerreDir, f)) });
      const res = await parser.getText();
      await parser.destroy();
      const lines = res.text.split('\n');
      for (const line of lines) {
        // e.g. F02759 ANELLO BIANCO DINAMICA BRONZO UNOAERRE ... 1,00 79,00 PZ -50.00%
        const m = line.match(/^([A-Z0-9]{5,8})\s+((?:ANELLO|BRACCIALE|COLLANA|ORECCHINI|FEDE|PENDENTE)[^0-9]+?)(?:\s+NOTA|\s+1,00|\s+\d+,00)/i);
        if (m) {
          const sku = m[1].trim();
          const desc = m[2].trim();
          const pMatch = line.match(/(\d{2,4},\d{2})\s+PZ/);
          const price = pMatch ? parseFloat(pMatch[1].replace(',', '.')) : 95.0;

          if (!productsMap.has(sku)) {
            let subcategory = 'anelli';
            let subLabel = 'Anelli';
            if (/bracc/i.test(desc)) { subcategory = 'bracciali'; subLabel = 'Bracciali'; }
            else if (/coll/i.test(desc)) { subcategory = 'collane'; subLabel = 'Collane'; }
            else if (/orecch/i.test(desc)) { subcategory = 'orecchini'; subLabel = 'Orecchini'; }

            productsMap.set(sku, {
              sku,
              barcode: generateBarcode(`UNOAERRE-${sku}`),
              name: `Unoaerre — ${desc}`,
              brand: 'Unoaerre',
              brandSlug: 'unoaerre',
              category: 'gioielli',
              subcategory,
              subcategoryLabel: subLabel,
              price,
              compareAtPrice: Math.round(price * 1.15),
              supplierCost: Math.round(price * 0.5),
              markupMultiplier: 2.0,
              stockQuantity: 2,
              description: `Creazione Unoaerre della storica tradizione orafa aretina, referenza ${sku}. ${desc}. Pregiata lavorazione artigianale con astuccio e garanzia.`,
              shortDescription: `Unoaerre ${desc}.`,
              images: getImagesFor('gioielli', subcategory, productsMap.size),
              attributes: { metal: /bronzo/i.test(desc) ? 'Bronzo dorato' : 'Oro 18 kt' },
              tags: ['unoaerre', 'arezzo', 'gioielli', subcategory],
              supplierName: 'Urigold S.r.l. (Unoaerre)',
              invoiceRef: f,
              approvalStatus: 'approved'
            });
          }
        }
      }
    }
    console.log(`[UNOAERRE] Finished. Total accumulated products: ${productsMap.size}`);
  }

  // 7. DAVITE & DELUCCHI (PDFs)
  const ddDir = path.join(baseDir, 'DAVITE DELUCCHI');
  if (fs.existsSync(ddDir)) {
    const files = fs.readdirSync(ddDir).filter(f => f.endsWith('.pdf'));
    for (const f of files) {
      totalFilesScanned++;
      const parser = new PDFParse({ data: fs.readFileSync(path.join(ddDir, f)) });
      const res = await parser.getText();
      await parser.destroy();
      // Extract lines with METALLI : Oro
      const text = res.text;
      const regex = /(Bracciali|Anelli|Collane|Orecchini|Punti Luce)\s+METALLI\s*:\s*Oro\s+g\s+([\d,]+)\s+PIETRE\s*:\s*([^\n]+)\n\s*([\d,]+)\s+([\d,.]+)/gi;
      let match;
      let subIdx = 0;
      while ((match = regex.exec(text)) !== null) {
        subIdx++;
        const type = match[1].trim();
        const goldWeight = parseFloat(match[2].replace(',', '.'));
        const stones = match[3].trim();
        const wholesale = parseFloat(match[5].replace(',', '.'));
        const sku = `DD-${f.slice(-9, -4)}-${subIdx}`;
        const price = Math.round(wholesale * 2.2);

        let subcategory = 'bracciali';
        let subLabel = 'Bracciali';
        if (/anell/i.test(type)) { subcategory = 'anelli'; subLabel = 'Anelli'; }
        else if (/collan/i.test(type)) { subcategory = 'collane'; subLabel = 'Collane'; }
        else if (/orecch/i.test(type)) { subcategory = 'orecchini'; subLabel = 'Orecchini'; }

        if (!productsMap.has(sku)) {
          productsMap.set(sku, {
            sku,
            barcode: generateBarcode(sku),
            name: `Davite & Delucchi — ${type} in Oro e ${stones.split(' ')[0]}`,
            brand: 'Davite Delucchi',
            brandSlug: 'davide-delucchi',
            category: 'gioielli',
            subcategory,
            subcategoryLabel: subLabel,
            price,
            compareAtPrice: Math.round(price * 1.15),
            supplierCost: wholesale,
            markupMultiplier: 2.2,
            stockQuantity: 1,
            description: `Alta Gioielleria di Valenza Davite & Delucchi. ${type} in Oro 18 kt (peso gr. ${goldWeight}). Selezione gemmologica: ${stones}. Realizzazione artigianale d'eccellenza, corredata di certificato gemmologico e astuccio di lusso.`,
            shortDescription: `${type} Davite & Delucchi in oro e diamanti/gemme naturali.`,
            images: getImagesFor('gioielli', subcategory, productsMap.size),
            attributes: { metal: 'Oro 18 kt', weightGr: goldWeight, stones: [stones] },
            tags: ['davite-delucchi', 'valenza', 'alta gioielleria', 'oro 18k', 'diamanti', subcategory],
            supplierName: 'Davite & Delucchi S.r.l.',
            invoiceRef: f,
            approvalStatus: 'approved'
          });
        }
      }
    }
    console.log(`[DAVITE DELUCCHI] Finished. Total accumulated products: ${productsMap.size}`);
  }

  // 8. VILLEROY & BOCH (PDFs)
  const villeroyDir = path.join(baseDir, 'VILLEROY');
  if (fs.existsSync(villeroyDir)) {
    const files = fs.readdirSync(villeroyDir).filter(f => f.endsWith('.pdf'));
    for (const f of files) {
      totalFilesScanned++;
      const parser = new PDFParse({ data: fs.readFileSync(path.join(villeroyDir, f)) });
      const res = await parser.getText();
      await parser.destroy();
      const lines = res.text.split('\n');
      for (const line of lines) {
        // e.g. 0010 8110 Bicchiere vino, Set 4 pz 1 PZ 33,52 ... 389083
        const m = line.match(/^\d{4}\s+(\d{4})\s+(Bicchiere[^\d]+|Calice[^\d]+|Piatto[^\d]+|Vaso[^\d]+|Posate[^\d]+)[^\d]*(\d+)\s+PZ\s+([\d,.]+)/i);
        if (m) {
          const code = m[1];
          const desc = m[2].trim();
          const price = parseFloat(m[4].replace(',', '.'));
          const sku = `VB-${code}`;
          if (price > 0 && !productsMap.has(sku)) {
            let subcategory = 'bicchieri';
            let subLabel = 'Bicchieri';
            if (/posat/i.test(desc)) { subcategory = 'posate'; subLabel = 'Posate'; }
            else if (/vas/i.test(desc)) { subcategory = 'vasi'; subLabel = 'Vasi'; }

            productsMap.set(sku, {
              sku,
              barcode: generateBarcode(sku),
              name: `Villeroy & Boch — ${desc}`,
              brand: 'Villeroy',
              brandSlug: 'villeroy',
              category: 'casa',
              subcategory,
              subcategoryLabel: subLabel,
              price: Math.round(price * 1.5),
              compareAtPrice: Math.round(price * 1.7),
              supplierCost: price,
              markupMultiplier: 1.5,
              stockQuantity: 2,
              description: `Cristalleria e porcellana Villeroy & Boch. ${desc}. Design iconico europeo per la tavola elegante e momenti conviviali di classe.`,
              shortDescription: `Villeroy & Boch ${desc}.`,
              images: getImagesFor('casa', subcategory, productsMap.size),
              attributes: { material: 'Cristallo di Boemia e Porcellana' },
              tags: ['villeroy', 'tavola', 'cristallo', 'casa', subcategory],
              supplierName: 'Villeroy & Boch AG',
              invoiceRef: f,
              approvalStatus: 'approved'
            });
          }
        }
      }
    }
    console.log(`[VILLEROY] Finished. Total accumulated products: ${productsMap.size}`);
  }

  // 9. WORLDIAMOND / NIHAMA (PDFs)
  const wdDir = path.join(baseDir, 'WORLDIAMOND');
  if (fs.existsSync(wdDir)) {
    const files = fs.readdirSync(wdDir).filter(f => f.endsWith('.pdf'));
    for (const f of files) {
      totalFilesScanned++;
      const parser = new PDFParse({ data: fs.readFileSync(path.join(wdDir, f)) });
      const res = await parser.getText();
      await parser.destroy();
      const lines = res.text.split('\n');
      for (const line of lines) {
        // e.g. N.GOB65 B-L OR 18K BIANCO LIGHT AK B 6,5-7 1,00 99,00
        const m = line.match(/^([A-Z0-9.-]{6,14})\s+([A-Z0-9\s.,/-]+?)\s+(\d+,00)\s+([\d,.]+)\s+NR/);
        if (m) {
          const sku = m[1].trim();
          const desc = m[2].trim();
          const cost = parseFloat(m[4].replace(',', '.'));
          const price = Math.round(cost * 2.2);

          let subcategory = 'orecchini';
          let subLabel = 'Orecchini';
          if (/bracc/i.test(desc)) { subcategory = 'bracciali'; subLabel = 'Bracciali'; }
          else if (/collan|coll/i.test(desc)) { subcategory = 'collane'; subLabel = 'Collane'; }
          else if (/anell/i.test(desc)) { subcategory = 'anelli'; subLabel = 'Anelli'; }

          if (!productsMap.has(sku)) {
            productsMap.set(sku, {
              sku,
              barcode: generateBarcode(sku),
              name: `Nihama — ${desc}`,
              brand: 'Nihama',
              brandSlug: 'nihama',
              category: 'gioielli',
              subcategory,
              subcategoryLabel: subLabel,
              price,
              compareAtPrice: Math.round(price * 1.15),
              supplierCost: cost,
              markupMultiplier: 2.2,
              stockQuantity: 1,
              description: `Perle e Alta Gioielleria Nihama (World Diamond Group). Referenza ${sku}. ${desc}. Perle Akoya coltivate selezionate e montatura in oro 18 kt. Corredato di garanzia gemmologica.`,
              shortDescription: `Nihama perle coltivate in oro 18 kt.`,
              images: getImagesFor('gioielli', subcategory, productsMap.size),
              attributes: { metal: 'Oro 18 kt', stones: ['Perle Akoya'] },
              tags: ['nihama', 'perle', 'gioielli', 'oro 18k', subcategory],
              supplierName: 'World Diamond Group S.p.A.',
              invoiceRef: f,
              approvalStatus: 'approved'
            });
          }
        }
      }
    }
    console.log(`[WORLDIAMOND] Finished. Total accumulated products: ${productsMap.size}`);
  }

  // 10. EMMEBI / CUOREMATTO (PDFs)
  const emmebiDir = path.join(baseDir, 'EMMEBI');
  if (fs.existsSync(emmebiDir)) {
    const files = [];
    function walk(dir) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(f => {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) walk(full);
        else if (f.name.endsWith('.pdf')) files.push(full);
      });
    }
    walk(emmebiDir);
    for (const f of files) {
      totalFilesScanned++;
      const parser = new PDFParse({ data: fs.readFileSync(f) });
      const res = await parser.getText();
      await parser.destroy();
      const lines = res.text.split('\n');
      for (const line of lines) {
        // e.g. D9011 SCATOLA TDA BAMBU+ ATTREZZI VINO 2,00 5,70
        const m = line.match(/^([A-Z][0-9]{4})\s+([A-Z0-9\s+*.,/-]+?)\s+(\d+,00)\s+([\d,.]+)\s+PZ/);
        if (m) {
          const sku = m[1].trim();
          const desc = m[2].trim();
          const cost = parseFloat(m[4].replace(',', '.'));
          const price = Math.max(18, Math.round(cost * 2.3));

          let subcategory = 'solidali';
          let subLabel = 'Solidali';
          if (/vino|decanter/i.test(desc)) { subcategory = 'decanter'; subLabel = 'Decanter'; }
          else if (/candela/i.test(desc)) { subcategory = 'candele'; subLabel = 'Candele'; }
          else if (/profum/i.test(desc)) { subcategory = 'profumatori'; subLabel = 'Profumatori'; }

          if (!productsMap.has(sku)) {
            productsMap.set(sku, {
              sku,
              barcode: generateBarcode(sku),
              name: `Cuorematto — ${desc}`,
              brand: 'Cuorematto',
              brandSlug: 'cuorematto',
              category: 'casa',
              subcategory,
              subcategoryLabel: subLabel,
              price,
              compareAtPrice: Math.round(price * 1.15),
              supplierCost: cost,
              markupMultiplier: 2.3,
              stockQuantity: 5,
              description: `Oggetto d'arte e bomboniera solidale Cuorematto. ${desc}. Un dono prezioso legato ai progetti benefici a sostegno dell'infanzia. Scatola regalo inclusa.`,
              shortDescription: `Cuorematto ${desc} · Solidale.`,
              images: getImagesFor('casa', subcategory, productsMap.size),
              attributes: {},
              tags: ['cuorematto', 'casa', 'solidale', 'bomboniera', subcategory],
              supplierName: 'Emmebi S.r.l.',
              invoiceRef: path.basename(f),
              approvalStatus: 'approved'
            });
          }
        }
      }
    }
    console.log(`[EMMEBI] Finished. Total accumulated products: ${productsMap.size}`);
  }

  console.log(`\n========================================`);
  console.log(`EXTRACTION SUMMARY:`);
  console.log(`Total files scanned: ${totalFilesScanned}`);
  console.log(`Unique products extracted: ${productsMap.size}`);
  console.log(`========================================`);

  return Array.from(productsMap.values());
}

if (require.main === module) {
  extractAllProducts(path.join(__dirname, '..', 'Oroeco fatture'))
    .then(products => {
      console.log('Sample extracted product (first):', products[0]);
      console.log('Sample extracted product (last):', products[products.length - 1]);
      const breakdown = {};
      products.forEach(p => {
        breakdown[p.brand] = (breakdown[p.brand] || 0) + 1;
      });
      console.log('Brand breakdown:', breakdown);
    })
    .catch(console.error);
}

module.exports = { extractAllProducts, generateBarcode, slugify };
