require('./_loadEnv');
const { Client } = require('pg');

async function pingSupabase() {
  const client = new Client({
    host: 'aws-0-eu-west-1.pooler.supabase.com',
    port: 6543,
    user: 'postgres.cuztyagbckeyljlhhzvr',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  const start = Date.now();
  try {
    await client.connect();
    const res = await client.query('SELECT now() as current_time, count(*) as count FROM oroeco_products');
    const elapsed = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Supabase Oroeco Keepalive SUCCESS (${elapsed}ms) - Products: ${res.rows[0].count}`);
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Supabase Oroeco Keepalive FAILED:`, err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

pingSupabase();
