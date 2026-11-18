require('./_loadEnv');
const { Client } = require('pg');
const { brands, products } = require('../lib/catalog.ts');

const CATEGORIES_DATA = [
  { slug: 'gioielli-anelli', parent: 'gioielli', label: 'Anelli', order: 1, desc: 'Solitari, verette, trilogy e anelli a fascia in oro e diamanti.' },
  { slug: 'gioielli-collane', parent: 'gioielli', label: 'Collane', order: 2, desc: 'Punto luce, collier e catene in oro 18 kt e argento 925.' },
  { slug: 'gioielli-orecchini', parent: 'gioielli', label: 'Orecchini', order: 3, desc: 'Punti luce, pendenti, cerchi e perle coltivate.' },
  { slug: 'gioielli-bracciali', parent: 'gioielli', label: 'Bracciali', order: 4, desc: 'Bracciali tennis, maglie classiche e bangle contemporanei.' },
  { slug: 'gioielli-ciondoli', parent: 'gioielli', label: 'Ciondoli e Componenti', order: 5, desc: 'Ciondoli portafortuna, croci sacre e cammei incisi a mano.' },

  { slug: 'orologi-uomo', parent: 'orologi', label: 'Uomo', order: 6, desc: 'Cronografi, segnatempo automatici e orologi subacquei professionali.' },
  { slug: 'orologi-donna', parent: 'orologi', label: 'Donna', order: 7, desc: 'Orologi gioiello, quadranti in madreperla e casse ultrasottili.' },

  { slug: 'accessori-pelletteria', parent: 'accessori', label: 'Pelletteria', order: 8, desc: 'Portafogli in pelle conciata al vegetale e cinture artigianali.' },
  { slug: 'accessori-portachiavi', parent: 'accessori', label: 'Portachiavi', order: 9, desc: 'Portachiavi in argento, acciaio e pelle di manifattura italiana.' },
  { slug: 'accessori-gemelli', parent: 'accessori', label: 'Gemelli', order: 10, desc: 'Gemelli da polso in oro, argento smaltato e pietre dure.' },
  { slug: 'accessori-penne', parent: 'accessori', label: 'Penne', order: 11, desc: 'Penne stilografiche, roller e a sfera di prestigio.' },

  { slug: 'casa-posate', parent: 'casa', label: 'Posate', order: 12, desc: 'Servizi di posate in argento massiccio e alpacca.' },
  { slug: 'casa-bicchieri', parent: 'casa', label: 'Bicchieri', order: 13, desc: 'Calici e bicchieri in cristallo lavorato a mano.' },
  { slug: 'casa-vasi', parent: 'casa', label: 'Vasi', order: 14, desc: 'Vasi in porcellana e cristallo soffiato di design.' },
  { slug: 'casa-profumatori', parent: 'casa', label: 'Profumatori', order: 15, desc: 'Diffusori d\'ambiente con dettagli in argento e fragranze luxury.' },
  { slug: 'casa-statue', parent: 'casa', label: 'Statue', order: 16, desc: 'Sculture e bassorilievi argentati su basi in legno pregiato.' },
  { slug: 'casa-candele', parent: 'casa', label: 'Candele', order: 17, desc: 'Ceri profumati e candelieri per l\'arredo elegante.' },
  { slug: 'casa-cornici', parent: 'casa', label: 'Cornici', order: 18, desc: 'Portafoto in argento 925 martellato e satinato.' },
  { slug: 'casa-decanter', parent: 'casa', label: 'Decanter', order: 19, desc: 'Decanter e caraffe in cristallo per vini d\'annata.' },
  { slug: 'casa-solidali', parent: 'casa', label: 'Solidali', order: 20, desc: 'Bomboniere e ricordi preziosi legati a progetti benefici.' },

  { slug: 'natale-decorazioni', parent: 'natale', label: 'Decorazioni', order: 21, desc: 'Sfere natalizie argentate, puntali e miniature smaltate.' },
  { slug: 'natale-regali', parent: 'natale', label: 'Regali di Natale', order: 22, desc: 'Pensieri preziosi e selezioni speciali per le festività.' }
];

async function seedDatabase() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.cuztyagbckeyljlhhzvr',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Supabase PostgreSQL (eu-west-1)...');
  await client.connect();
  console.log('Connected! Starting seed transaction...');

  try {
    await client.query('BEGIN');

    // 1. Insert Brands
    console.log(`\n--- Seeding ${brands.length} Brands ---`);
    for (let i = 0; i < brands.length; i++) {
      const b = brands[i];
      const res = await client.query(`
        INSERT INTO oroeco_brands (slug, name, country, description, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          country = EXCLUDED.country,
          description = EXCLUDED.description,
          display_order = EXCLUDED.display_order
        RETURNING id, slug, name;
      `, [b.slug, b.name, b.country || 'Italia', b.description || '', i + 1]);
    }
    console.log(`Seeded ${brands.length} brands successfully.`);

    // 2. Map Brands slug -> id
    const brandRows = await client.query('SELECT id, slug FROM oroeco_brands');
    const brandMap = new Map();
    brandRows.rows.forEach(r => brandMap.set(r.slug, r.id));

    // 3. Insert Categories
    console.log(`\n--- Seeding ${CATEGORIES_DATA.length} Categories ---`);
    for (const c of CATEGORIES_DATA) {
      await client.query(`
        INSERT INTO oroeco_categories (slug, label, parent_category, description, display_order, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT (slug) DO UPDATE SET
          label = EXCLUDED.label,
          parent_category = EXCLUDED.parent_category,
          description = EXCLUDED.description,
          display_order = EXCLUDED.display_order;
      `, [c.slug, c.label, c.parent, c.desc, c.order]);
    }
    console.log(`Seeded ${CATEGORIES_DATA.length} categories successfully.`);

    // 4. Insert Products
    console.log(`\n--- Seeding ${products.length} Products ---`);
    for (const p of products) {
      const brandId = brandMap.get(p.brandSlug) || null;
      await client.query(`
        INSERT INTO oroeco_products (
          slug, name, brand_id, brand_name, category,
          subcategory, subcategory_label, price, compare_at_price,
          vat_rate, stock_quantity, in_stock, barcode, sku,
          short_description, description, images, attributes, tags,
          is_featured, is_new, is_christmas
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19,
          $20, $21, $22
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          brand_id = EXCLUDED.brand_id,
          brand_name = EXCLUDED.brand_name,
          category = EXCLUDED.category,
          subcategory = EXCLUDED.subcategory,
          subcategory_label = EXCLUDED.subcategory_label,
          price = EXCLUDED.price,
          compare_at_price = EXCLUDED.compare_at_price,
          vat_rate = EXCLUDED.vat_rate,
          stock_quantity = EXCLUDED.stock_quantity,
          in_stock = EXCLUDED.in_stock,
          barcode = EXCLUDED.barcode,
          sku = EXCLUDED.sku,
          short_description = EXCLUDED.short_description,
          description = EXCLUDED.description,
          images = EXCLUDED.images,
          attributes = EXCLUDED.attributes,
          tags = EXCLUDED.tags,
          is_featured = EXCLUDED.is_featured,
          is_new = EXCLUDED.is_new,
          is_christmas = EXCLUDED.is_christmas;
      `, [
        p.slug,
        p.name,
        brandId,
        p.brand,
        p.category,
        p.subcategory,
        p.subcategoryLabel,
        p.price,
        p.compareAtPrice || null,
        22.00,
        p.stockQuantity ?? 1,
        p.inStock ?? true,
        p.barcode,
        p.sku,
        p.shortDescription || '',
        p.description || '',
        p.images || [],
        JSON.stringify(p.attributes || {}),
        p.tags || [],
        Boolean(p.isFeatured),
        Boolean(p.isNew),
        Boolean(p.isChristmas || p.category === 'natale')
      ]);
    }
    console.log(`Seeded ${products.length} products successfully.`);

    await client.query('COMMIT');
    console.log('\n--- Transaction Committed Successfully! ---');

    // Verification Counts
    const bCount = await client.query('SELECT count(*) FROM oroeco_brands');
    const cCount = await client.query('SELECT count(*) FROM oroeco_categories');
    const pCount = await client.query('SELECT count(*) FROM oroeco_products');

    console.log('\n=== DATABASE AUDIT VERIFICATION ===');
    console.log('oroeco_brands count:    ', bCount.rows[0].count);
    console.log('oroeco_categories count:', cCount.rows[0].count);
    console.log('oroeco_products count:  ', pCount.rows[0].count);

    // Test a sample product with joins
    const sample = await client.query(`
      SELECT p.name, p.price, p.barcode, p.sku, b.name as brand_name, p.category, p.stock_quantity
      FROM oroeco_products p
      JOIN oroeco_brands b ON p.brand_id = b.id
      WHERE p.barcode = '8054112300017'
    `);
    console.log('\nSample Barcode Query (8054112300017):', sample.rows[0]);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed transaction rolled back due to error:', err);
    throw err;
  } finally {
    await client.end();
  }
}

seedDatabase().then(() => {
  console.log('\nDATABASE SEEDING COMPLETED WITH ZERO ERRORS.');
  process.exit(0);
}).catch(err => {
  console.error('FATAL SEED ERROR:', err);
  process.exit(1);
});
