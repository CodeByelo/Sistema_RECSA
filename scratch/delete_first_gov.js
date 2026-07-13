const { Pool } = require('pg');
const connectionString = 'postgresql://postgres.ianerdzakxdjddovkzok:Dani3l1910__RECSA@aws-0-ca-central-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Eliminando primer gobernador (GobernadorH) de la base de datos...');
  const res = await pool.query("DELETE FROM recsa_users WHERE username = 'GobernadorH'");
  console.log('Filas eliminadas:', res.rowCount);
  await pool.end();
}

run().catch(console.error);
