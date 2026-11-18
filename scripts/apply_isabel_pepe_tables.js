require('./_loadEnv');
const { Client } = require('pg');

async function migrate() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.cuztyagbckeyljlhhzvr',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connecting to Oroeco Supabase database...');
  await client.connect();

  console.log('Creating tables: oroeco_cookie_consents & oroeco_abandoned_carts...');

  const sql = `
    -- 1. TABELLA REGISTRO CONSENSI GDPR (STILE ISABEL PEPE)
    CREATE TABLE IF NOT EXISTS oroeco_cookie_consents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        consent_id TEXT NOT NULL,
        visitor_id TEXT NOT NULL,
        categories JSONB NOT NULL DEFAULT '{"necessary": true, "analytics": false, "marketing": false, "preferences": false}',
        ip_hash TEXT,
        user_agent TEXT,
        policy_version TEXT NOT NULL DEFAULT '1.0',
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
    );
    CREATE INDEX IF NOT EXISTS idx_cookie_consents_consent_id ON oroeco_cookie_consents(consent_id);
    CREATE INDEX IF NOT EXISTS idx_cookie_consents_visitor_id ON oroeco_cookie_consents(visitor_id);
    ALTER TABLE oroeco_cookie_consents ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'oroeco_cookie_consents' AND policyname = 'Public can insert consents'
      ) THEN
        CREATE POLICY "Public can insert consents" ON oroeco_cookie_consents FOR INSERT WITH CHECK (true);
      END IF;
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'oroeco_cookie_consents' AND policyname = 'Public can read own consents'
      ) THEN
        CREATE POLICY "Public can read own consents" ON oroeco_cookie_consents FOR SELECT USING (true);
      END IF;
    END
    $$;

    -- 2. TABELLA CARRELLI ABBANDONATI & CRM SYNC (STILE ISABEL PEPE)
    CREATE TABLE IF NOT EXISTS oroeco_abandoned_carts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        visitor_id TEXT NOT NULL,
        consent_id TEXT,
        email TEXT,
        phone TEXT,
        items JSONB NOT NULL DEFAULT '[]',
        item_count INT NOT NULL DEFAULT 0,
        subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'abandoned', 'converted', 'recovered')),
        synced_to_n8n BOOLEAN NOT NULL DEFAULT false,
        last_activity_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
        created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
    );
    CREATE INDEX IF NOT EXISTS idx_abandoned_carts_visitor ON oroeco_abandoned_carts(visitor_id);
    CREATE INDEX IF NOT EXISTS idx_abandoned_carts_status ON oroeco_abandoned_carts(status);
    ALTER TABLE oroeco_abandoned_carts ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'oroeco_abandoned_carts' AND policyname = 'Public can manage carts'
      ) THEN
        CREATE POLICY "Public can manage carts" ON oroeco_abandoned_carts FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END
    $$;
  `;

  await client.query(sql);
  console.log('✓ Migration executed successfully!');

  const check = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('oroeco_cookie_consents', 'oroeco_abandoned_carts');");
  console.log('Tables confirmed in public schema:', check.rows.map(r => r.table_name));

  await client.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
