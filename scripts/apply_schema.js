require('./_loadEnv');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function applySchema() {
  const sqlPath = path.join(__dirname, '..', 'supabase', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  
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
  console.log('Connected! Executing schema.sql (570 lines)...');
  await client.query(sql);
  console.log('Schema executed successfully!');

  const tablesQuery = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'oroeco_%' ORDER BY table_name;";
  const res = await client.query(tablesQuery);
  console.log('Created tables in public schema:', res.rows.map(r => r.table_name));

  const fnQuery = "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name LIKE 'oroeco_%';";
  const fnRes = await client.query(fnQuery);
  console.log('Created functions in public schema:', fnRes.rows.map(r => r.routine_name));

  await client.end();
}

applySchema().catch(err => {
  console.error('FAILED TO APPLY SCHEMA:', err);
  process.exit(1);
});
