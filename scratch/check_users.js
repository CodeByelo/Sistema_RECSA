const { Pool } = require('pg');
const connectionString = 'postgresql://postgres.ianerdzakxdjddovkzok:Dani3l1910__RECSA@aws-0-ca-central-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query('SELECT id, username, name, password, role FROM recsa_users');
  console.log('USERS IN DATABASE:', res.rows);
  await pool.end();
}

run().catch(console.error);
