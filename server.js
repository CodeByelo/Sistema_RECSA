const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Supabase PostgreSQL Connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ianerdzakxdjddovkzok:Dani3l1910__RECSA@aws-0-ca-central-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Error inesperado en cliente inactivo de base de datos:', err.message);
});

// Initialize database schema and insert default data if empty
async function initDb() {
  const client = await pool.connect();
  try {
    console.log('Iniciando creación de tablas relacionales en Supabase...');
    
    // 1. Citizens Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_citizens (
        id INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        veraz VARCHAR(50) DEFAULT 'Verde',
        job VARCHAR(255),
        phone VARCHAR(50),
        bank VARCHAR(50) DEFAULT '$0',
        fines NUMERIC DEFAULT 0,
        loan_limit NUMERIC DEFAULT 10000,
        police_status VARCHAR(100) DEFAULT 'Limpio',
        nu VARCHAR(50),
        birthdate VARCHAR(50),
        gender VARCHAR(50),
        height VARCHAR(50),
        eyes VARCHAR(50),
        weapon_license VARCHAR(100) DEFAULT 'NO',
        driver_license VARCHAR(100) DEFAULT 'NO',
        avatar TEXT,
        businesses JSONB DEFAULT '[]',
        properties JSONB DEFAULT '[]',
        payments JSONB DEFAULT '[]'
      );
    `);

    // 2. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE SET NULL
      );
    `);

    // 3. Loans Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_loan_requests (
        id SERIAL PRIMARY KEY,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE CASCADE,
        citizen_name VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        months INTEGER NOT NULL,
        interest NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        date VARCHAR(50) NOT NULL
      );
    `);

    // 4. Criminal Records
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_criminal_records (
        id SERIAL PRIMARY KEY,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE CASCADE,
        crime TEXT NOT NULL,
        fine NUMERIC DEFAULT 0,
        jail INTEGER DEFAULT 0,
        officer VARCHAR(255) NOT NULL,
        status VARCHAR(100) NOT NULL,
        date VARCHAR(100) NOT NULL,
        notes TEXT
      );
    `);

    // 5. News Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_news (
        id SERIAL PRIMARY KEY,
        date VARCHAR(100) NOT NULL,
        headline TEXT NOT NULL,
        excerpt TEXT NOT NULL,
        tag VARCHAR(100) NOT NULL,
        img TEXT NOT NULL
      );
    `);

    // 6. Config Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_config (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    console.log('Tablas estructuradas correctamente.');

    // Seed ONLY the single GobernadorH Admin Account if users table is empty
    const userCheck = await client.query('SELECT COUNT(*) FROM recsa_users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Sembrando cuenta administradora inicial (GobernadorH)...');
      await client.query(`
        INSERT INTO recsa_users (username, password, role, name, citizen_id)
        VALUES ($1, $2, $3, $4, $5)
      `, ['GobernadorH', 'Harrison1910**', 'Inspector Fiscal RECSA', 'Gobernador Harrison', null]);
    }

    // Seed Config if config table is empty (to keep landing page styling intact)
    const configCheck = await client.query('SELECT COUNT(*) FROM recsa_config');
    if (parseInt(configCheck.rows[0].count) === 0) {
      console.log('Sembrando configuraciones de diseño de la landing page...');
      const defaultConfig = {
        heroBadge: "Campaña Gubernamental 2026",
        heroTitle: "Unidos por la Renovación Cívica de San Andreas",
        heroDesc: "Es hora de construir un estado más Justo, Seguro y Renovado. Conoce nuestras propuestas y únete al cambio estructural liderado por RECSA en todo el estado.",
        heroBg: "./assets/campana_discurso.png",
        candidateName: "Dylan Harrison",
        candidateTagline: "Candidato a Gobernador de San Andreas",
        candidateQuote: "Por un San Andreas más Justo, Seguro y Renovado",
        candidateDesc1: "Dylan Harrison representa una nueva etapa de orden y justicia fiscal. Su plan de gobierno busca auditar las cuentas municipales de Los Santos, eliminar las redes de lavado de dinero de los locales del norte y otorgar subsidios directos a ciudadanos solventes a través del Sistema de Solvencia Ciudadana (SSC).",
        candidateDesc2: "Nuestros tres pilares de campaña son:",
        candidateImg: "./assets/dylan_harrison.png",
        proposal1Title: "Justicia Social",
        proposal1Desc: "Bono único de vivienda y subsidios inmediatos vía SSC.",
        proposal2Title: "Seguridad Activa",
        proposal2Desc: "Equipamiento de punta a LSPD/LSSD y fin al crimen organizado.",
        proposal3Title: "Libertad Comercial",
        proposal3Desc: "Reducción de aranceles y créditos blandos a tasas del 5%."
      };
      await pool.query(`
        INSERT INTO recsa_config (key, value)
        VALUES ('landing_config', $1)
      `, [JSON.stringify(defaultConfig)]);
    }

    console.log('Inicialización completada con éxito.');
  } catch (error) {
    console.error('Error durante la inicialización de la base de datos:', error.message);
  } finally {
    client.release();
  }
}

initDb();

// 1. API: Autenticación Real de Usuarios
app.post('/api/auth/login', async (req, res) => {
  const { user, pass } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, username, role, name, citizen_id FROM recsa_users WHERE username = $1 AND password = $2',
      [user, pass]
    );
    if (result.rows.length > 0) {
      const dbUser = result.rows[0];
      res.json({
        id: dbUser.id,
        user: dbUser.username,
        role: dbUser.role,
        name: dbUser.name,
        citizenId: dbUser.citizen_id
      });
    } else {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. API: Ciudadanos
app.get('/api/citizens', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_citizens ORDER BY name ASC');
    // Map database snake_case fields to frontend camelCase expectations
    const mapped = result.rows.map(c => ({
      id: c.id,
      name: c.name,
      veraz: c.veraz,
      job: c.job,
      phone: c.phone,
      bank: c.bank,
      fines: parseFloat(c.fines),
      loanLimit: parseFloat(c.loan_limit),
      policeStatus: c.police_status,
      nu: c.nu,
      birthdate: c.birthdate,
      gender: c.gender,
      height: c.height,
      eyes: c.eyes,
      weaponLicense: c.weapon_license,
      driverLicense: c.driver_license,
      avatar: c.avatar,
      businesses: c.businesses || [],
      properties: c.properties || [],
      payments: c.payments || []
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/citizens', async (req, res) => {
  const c = req.body;
  try {
    await pool.query(`
      INSERT INTO recsa_citizens (id, name, veraz, job, phone, bank, fines, loan_limit, police_status, nu, birthdate, gender, height, eyes, weapon_license, driver_license, avatar, businesses, properties, payments)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, veraz = EXCLUDED.veraz, job = EXCLUDED.job, phone = EXCLUDED.phone, bank = EXCLUDED.bank,
        fines = EXCLUDED.fines, loan_limit = EXCLUDED.loan_limit, police_status = EXCLUDED.police_status, nu = EXCLUDED.nu,
        birthdate = EXCLUDED.birthdate, gender = EXCLUDED.gender, height = EXCLUDED.height, eyes = EXCLUDED.eyes,
        weapon_license = EXCLUDED.weapon_license, driver_license = EXCLUDED.driver_license, avatar = EXCLUDED.avatar,
        businesses = EXCLUDED.businesses, properties = EXCLUDED.properties, payments = EXCLUDED.payments
    `, [
      c.id, c.name, c.veraz, c.job, c.phone, c.bank, c.fines, c.loanLimit, c.policeStatus, c.nu, c.birthdate, c.gender,
      c.height, c.eyes, c.weaponLicense, c.driverLicense, c.avatar, JSON.stringify(c.businesses), JSON.stringify(c.properties), JSON.stringify(c.payments)
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk sync citizens
app.post('/api/citizens/sync', async (req, res) => {
  const list = req.body;
  try {
    for (const c of list) {
      await pool.query(`
        INSERT INTO recsa_citizens (id, name, veraz, job, phone, bank, fines, loan_limit, police_status, nu, birthdate, gender, height, eyes, weapon_license, driver_license, avatar, businesses, properties, payments)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name, veraz = EXCLUDED.veraz, job = EXCLUDED.job, phone = EXCLUDED.phone, bank = EXCLUDED.bank,
          fines = EXCLUDED.fines, loan_limit = EXCLUDED.loan_limit, police_status = EXCLUDED.police_status, nu = EXCLUDED.nu,
          birthdate = EXCLUDED.birthdate, gender = EXCLUDED.gender, height = EXCLUDED.height, eyes = EXCLUDED.eyes,
          weapon_license = EXCLUDED.weapon_license, driver_license = EXCLUDED.driver_license, avatar = EXCLUDED.avatar,
          businesses = EXCLUDED.businesses, properties = EXCLUDED.properties, payments = EXCLUDED.payments
      `, [
        c.id, c.name, c.veraz, c.job, c.phone, c.bank, c.fines, c.loanLimit, c.policeStatus, c.nu, c.birthdate, c.gender,
        c.height, c.eyes, c.weaponLicense, c.driverLicense, c.avatar, JSON.stringify(c.businesses), JSON.stringify(c.properties), JSON.stringify(c.payments)
      ]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. API: Préstamos
app.get('/api/loans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_loan_requests ORDER BY id DESC');
    const mapped = result.rows.map(l => ({
      id: l.id,
      citizenId: l.citizen_id,
      citizenName: l.citizen_name,
      amount: parseFloat(l.amount),
      months: l.months,
      interest: parseFloat(l.interest),
      status: l.status,
      date: l.date
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/loans', async (req, res) => {
  const l = req.body;
  try {
    await pool.query(`
      INSERT INTO recsa_loan_requests (id, citizen_id, citizen_name, amount, months, interest, status, date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        citizen_id = EXCLUDED.citizen_id, citizen_name = EXCLUDED.citizen_name, amount = EXCLUDED.amount,
        months = EXCLUDED.months, interest = EXCLUDED.interest, status = EXCLUDED.status, date = EXCLUDED.date
    `, [l.id || null, l.citizenId, l.citizenName, l.amount, l.months, l.interest, l.status, l.date]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/loans/sync', async (req, res) => {
  const list = req.body;
  try {
    for (const l of list) {
      await pool.query(`
        INSERT INTO recsa_loan_requests (id, citizen_id, citizen_name, amount, months, interest, status, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          citizen_id = EXCLUDED.citizen_id, citizen_name = EXCLUDED.citizen_name, amount = EXCLUDED.amount,
          months = EXCLUDED.months, interest = EXCLUDED.interest, status = EXCLUDED.status, date = EXCLUDED.date
      `, [l.id, l.citizenId, l.citizenName, l.amount, l.months, l.interest, l.status, l.date]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. API: Noticias (News)
app.get('/api/news', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_news ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/news/sync', async (req, res) => {
  const list = req.body;
  try {
    // For news, since we want to fully sync deletions too, we can clean and reload
    await pool.query('DELETE FROM recsa_news');
    for (const n of list) {
      await pool.query(`
        INSERT INTO recsa_news (id, date, headline, excerpt, tag, img)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [n.id, n.date, n.headline, n.excerpt, n.tag, n.img]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. API: Criminal Records
app.get('/api/criminal-records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_criminal_records ORDER BY id DESC');
    const mapped = result.rows.map(r => ({
      id: r.id,
      citizenId: r.citizen_id,
      crime: r.crime,
      fine: parseFloat(r.fine),
      jail: r.jail,
      officer: r.officer,
      status: r.status,
      date: r.date,
      notes: r.notes
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/criminal-records/sync', async (req, res) => {
  const list = req.body;
  try {
    await pool.query('DELETE FROM recsa_criminal_records');
    for (const r of list) {
      await pool.query(`
        INSERT INTO recsa_criminal_records (id, citizen_id, crime, fine, jail, officer, status, date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [r.id, r.citizenId, r.crime, r.fine, r.jail, r.officer, r.status, r.date, r.notes]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. API: Configuration
app.get('/api/landing-config', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM recsa_config WHERE key = 'landing_config'");
    if (result.rows.length > 0) {
      res.json(result.rows[0].value);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/landing-config', async (req, res) => {
  const config = req.body;
  try {
    await pool.query(`
      INSERT INTO recsa_config (key, value)
      VALUES ('landing_config', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [JSON.stringify(config)]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Status
app.get('/api/status', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', time: dbCheck.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Serve static frontend files
app.use(express.static(__dirname));

// SPA Fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`   SERVIDOR GUBERNAMENTAL RECSA EN PRODUCCIÓN INICIADO`);
  console.log(`   URL Local: http://localhost:${PORT}`);
  console.log(`   Supabase Host: aws-0-ca-central-1.pooler.supabase.com`);
  console.log(`================================================================`);
});
