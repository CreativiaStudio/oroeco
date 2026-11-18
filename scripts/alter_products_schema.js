require('./_loadEnv');
const { Client } = require('pg');

async function alterSchema() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.cuztyagbckeyljlhhzvr',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL...');

  try {
    await client.query(`
      ALTER TABLE oroeco_products
        ADD COLUMN IF NOT EXISTS supplier_cost NUMERIC(10, 2),
        ADD COLUMN IF NOT EXISTS markup_multiplier NUMERIC(5, 2) DEFAULT 2.2,
        ADD COLUMN IF NOT EXISTS approval_status TEXT NOT NULL DEFAULT 'approved',
        ADD COLUMN IF NOT EXISTS supplier_name TEXT,
        ADD COLUMN IF NOT EXISTS invoice_ref TEXT;
    `);

    // Ensure constraint on approval_status
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE oroeco_products ADD CONSTRAINT check_approval_status CHECK (approval_status IN ('approved', 'pending_approval', 'rejected'));
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `);

    console.log('Schema altered successfully! Columns added to oroeco_products.');

    const res = await client.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'oroeco_products' 
        AND column_name IN ('supplier_cost', 'markup_multiplier', 'approval_status', 'supplier_name', 'invoice_ref');
    `);
    console.log('Verified columns in DB:', res.rows);
  } finally {
    await client.end();
  }
}

alterSchema().catch(console.error);
