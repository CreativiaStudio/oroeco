require('./_loadEnv');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { extractAllProducts, slugify } = require('./invoice_extractor');

async function seedExtractedProducts() {
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
  console.log('Connected! Fetching brands...');

  // Map brands slug -> id
  const brandsRes = await client.query('SELECT id, slug, name FROM oroeco_brands');
  const brandMap = new Map();
  brandsRes.rows.forEach(b => {
    brandMap.set(b.slug, b.id);
    brandMap.set(b.name.toLowerCase(), b.id);
  });
  console.log(`Loaded ${brandMap.size / 2} brands for reference.`);

  // Extract products from invoices
  const baseInvoicesDir = path.join(__dirname, '..', 'Oroeco fatture');
  const products = await extractAllProducts(baseInvoicesDir);
  console.log(`\nReady to upsert ${products.length} products into oroeco_products table...`);

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const brandId = brandMap.get(p.brandSlug) || brandMap.get(p.brand.toLowerCase()) || null;
    const baseSlug = slugify(p.name);
    const uniqueSlug = `${baseSlug}-${p.sku.toLowerCase().replace(/[^a-z0-9]/g, '')}`.slice(0, 100);

    try {
      // Check if product exists by barcode or sku
      const existing = await client.query(
        'SELECT id, sku, barcode, approval_status, stock_quantity FROM oroeco_products WHERE sku = $1 OR barcode = $2',
        [p.sku, p.barcode]
      );

      if (existing.rows.length > 0) {
        // Update product keeping approval_status if already approved, updating stock & cost
        await client.query(`
          UPDATE oroeco_products SET
            name = $1,
            brand_id = $2,
            brand_name = $3,
            category = $4,
            subcategory = $5,
            subcategory_label = $6,
            price = $7,
            compare_at_price = $8,
            supplier_cost = $9,
            markup_multiplier = $10,
            stock_quantity = stock_quantity + $11,
            description = $12,
            short_description = $13,
            images = $14,
            attributes = $15,
            tags = $16,
            supplier_name = $17,
            invoice_ref = $18,
            updated_at = now()
          WHERE id = $19
        `, [
          p.name,
          brandId,
          p.brand,
          p.category,
          p.subcategory,
          p.subcategoryLabel,
          p.price,
          p.compareAtPrice,
          p.supplierCost,
          p.markupMultiplier,
          p.stockQuantity,
          p.description,
          p.shortDescription,
          p.images,
          JSON.stringify(p.attributes || {}),
          p.tags,
          p.supplierName,
          p.invoiceRef,
          existing.rows[0].id
        ]);
        updatedCount++;
      } else {
        // Insert new product with pending_approval status so Renato can approve it
        await client.query(`
          INSERT INTO oroeco_products (
            slug, name, brand_id, brand_name, category,
            subcategory, subcategory_label, price, compare_at_price,
            vat_rate, stock_quantity, in_stock, barcode, sku,
            short_description, description, images, attributes, tags,
            is_featured, is_new, is_christmas,
            supplier_cost, markup_multiplier, approval_status,
            supplier_name, invoice_ref
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13, $14,
            $15, $16, $17, $18, $19,
            $20, $21, $22,
            $23, $24, $25,
            $26, $27
          )
        `, [
          uniqueSlug,
          p.name,
          brandId,
          p.brand,
          p.category,
          p.subcategory,
          p.subcategoryLabel,
          p.price,
          p.compareAtPrice,
          22.00,
          p.stockQuantity,
          true,
          p.barcode,
          p.sku,
          p.shortDescription,
          p.description,
          p.images,
          JSON.stringify(p.attributes || {}),
          p.tags,
          Boolean(p.isFeatured),
          Boolean(p.isNew),
          Boolean(p.isChristmas || p.category === 'natale'),
          p.supplierCost,
          p.markupMultiplier,
          'pending_approval', // Renato can approve in backend!
          p.supplierName,
          p.invoiceRef
        ]);
        insertedCount++;
      }
    } catch (err) {
      console.error(`Error on product ${p.sku} (${p.name}):`, err.message);
      errorCount++;
    }

    if ((i + 1) % 50 === 0 || i === products.length - 1) {
      console.log(`Processed ${i + 1}/${products.length} products... (Inserted: ${insertedCount}, Updated: ${updatedCount}, Errors: ${errorCount})`);
    }
  }

  // Final summary verification
  const countRes = await client.query('SELECT count(*) as total, count(*) FILTER (WHERE approval_status = \'approved\') as approved, count(*) FILTER (WHERE approval_status = \'pending_approval\') as pending FROM oroeco_products');
  console.log('\n=============================================');
  console.log('SUPABASE OROECO DATABASE AUDIT AFTER SEED:');
  console.log('Total Products in Database:', countRes.rows[0].total);
  console.log('Approved Products (Storefront active):', countRes.rows[0].approved);
  console.log('Pending Approval (Renato backend queue):', countRes.rows[0].pending);
  console.log('=============================================');

  await client.end();
}

seedExtractedProducts().catch(console.error);
