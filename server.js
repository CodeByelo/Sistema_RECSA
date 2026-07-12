const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_VERSION = 'v4.3_premium_design';

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Supabase PostgreSQL Connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.ianerdzakxdjddovkzok:Dani3l1910__RECSA@aws-0-ca-central-1.pooler.supabase.com:6543/postgres';

const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

pool.on('error', (err) => {
  console.error('DB pool error:', err.message);
});

// ============================================================
// INICIALIZACIÓN DE BASE DE DATOS
// ============================================================
async function initDb() {
  const client = await pool.connect();
  try {
    console.log('Iniciando esquema de base de datos RECSA v4.0...');

    // 1. Citizens
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
        commercial_license VARCHAR(100) DEFAULT 'NO',
        avatar TEXT,
        address TEXT,
        nationality VARCHAR(100),
        businesses JSONB DEFAULT '[]',
        properties JSONB DEFAULT '[]',
        vehicles JSONB DEFAULT '[]',
        payments JSONB DEFAULT '[]'
      );
    `);

    // 2. Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        badge VARCHAR(100),
        department VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        last_login TIMESTAMP,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE SET NULL
      );
    `);

    // 3. Loans
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_loan_requests (
        id SERIAL PRIMARY KEY,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE CASCADE,
        citizen_name VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        months INTEGER NOT NULL,
        interest NUMERIC NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        approved_by VARCHAR(255),
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
        notes TEXT,
        warrant_id INTEGER
      );
    `);

    // 5. News
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

    // 6. Config
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_config (
        key VARCHAR(255) PRIMARY KEY,
        value JSONB NOT NULL
      );
    `);

    // 7. Judicial Orders (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_judicial_orders (
        id SERIAL PRIMARY KEY,
        type VARCHAR(100) NOT NULL,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE CASCADE,
        citizen_name VARCHAR(255) NOT NULL,
        address TEXT,
        reason TEXT NOT NULL,
        requested_by VARCHAR(255) NOT NULL,
        requested_date VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        reviewed_by VARCHAR(255),
        review_date VARCHAR(100),
        review_notes TEXT
      );
    `);

    // 8. User Activity Log (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_activity_log (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        action TEXT NOT NULL,
        detail TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Tablas creadas/verificadas correctamente.');

    // Seed GobernadorH if users table is empty
    const userCheck = await client.query('SELECT COUNT(*) FROM recsa_users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Sembrando cuenta administradora GobernadorH...');
      await client.query(`
        INSERT INTO recsa_users (username, password, role, name, department)
        VALUES ($1, $2, $3, $4, $5)
      `, ['GobernadorH', 'Harrison1910**', 'Gobernador', 'Gobernador Harrison', 'Despacho del Gobernador']);
    }

    // Seed landing config if empty
    const configCheck = await client.query("SELECT COUNT(*) FROM recsa_config WHERE key = 'landing_config'");
    if (parseInt(configCheck.rows[0].count) === 0) {
      console.log('Sembrando configuración de landing page...');
      const defaultConfig = {
        heroBadge: "Gobierno del Estado de San Andreas",
        heroTitle: "Sistema Gubernamental de Control Cívico",
        heroDesc: "RECSA — Red de Control de Solvencia y Auditoría. Plataforma oficial del Estado para la gestión, seguridad y control del orden civil en San Andreas.",
        heroBg: "./assets/campana_discurso.png",
        candidateName: "Dylan Harrison",
        candidateTagline: "Gobernador del Estado de San Andreas",
        candidateQuote: "Por un San Andreas más Justo, Seguro y Renovado",
        candidateDesc1: "La Gobernación de San Andreas, liderada por Dylan Harrison, implementa el sistema de control cívico más avanzado del estado. Con base en tres pilares: Justicia, Orden y Transparencia.",
        candidateDesc2: "Nuestros tres pilares de gobierno son:",
        candidateImg: "./assets/dylan_harrison.png",
        proposal1Title: "Justicia Civil",
        proposal1Desc: "Sistema de solvencia ciudadana (SSC) con control total de deudas y multas.",
        proposal2Title: "Seguridad Total",
        proposal2Desc: "MDC policial integrado con órdenes judiciales en tiempo real.",
        proposal3Title: "Control Fiscal",
        proposal3Desc: "Auditoría de negocios, créditos y propiedades del estado."
      };
      await pool.query(`INSERT INTO recsa_config (key, value) VALUES ('landing_config', $1)`, [JSON.stringify(defaultConfig)]);
    }

    console.log('Sistema RECSA v4.0 inicializado con éxito.');
  } catch (error) {
    console.error('Error durante la inicialización:', error.message);
  } finally {
    client.release();
  }
}

initDb();

// ============================================================
// HELPERS
// ============================================================
async function logActivity(username, action, detail = '') {
  try {
    await pool.query('INSERT INTO recsa_activity_log (username, action, detail) VALUES ($1, $2, $3)', [username, action, detail]);
  } catch (e) { /* silent */ }
}

// ============================================================
// API: AUTENTICACIÓN
// ============================================================
app.post('/api/auth/login', async (req, res) => {
  const { user, pass } = req.body;
  try {
    const result = await pool.query(
      'SELECT id, username, role, name, badge, department, citizen_id FROM recsa_users WHERE username = $1 AND password = $2',
      [user, pass]
    );
    if (result.rows.length > 0) {
      const dbUser = result.rows[0];
      await pool.query('UPDATE recsa_users SET last_login = NOW() WHERE id = $1', [dbUser.id]);
      await logActivity(dbUser.username, 'LOGIN', `Acceso desde ${req.ip}`);
      res.json({
        id: dbUser.id,
        user: dbUser.username,
        username: dbUser.username,
        role: dbUser.role,
        name: dbUser.name,
        badge: dbUser.badge,
        department: dbUser.department,
        citizenId: dbUser.citizen_id
      });
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas. Acceso denegado.' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: USUARIOS (Solo Gobernador)
// ============================================================
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, name, badge, department, created_at, last_login FROM recsa_users ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, name, badge, department } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO recsa_users (username, password, role, name, badge, department) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [username, password, role, name, badge || null, department || null]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    if (error.code === '23505') {
      res.status(409).json({ error: 'El nombre de usuario ya existe.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM recsa_users WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  try {
    await pool.query('UPDATE recsa_users SET password = $1 WHERE id = $2', [password, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: CIUDADANOS
// ============================================================
app.get('/api/citizens', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_citizens ORDER BY name ASC');
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
      commercialLicense: c.commercial_license,
      address: c.address,
      nationality: c.nationality,
      avatar: c.avatar,
      businesses: c.businesses || [],
      properties: c.properties || [],
      vehicles: c.vehicles || [],
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
      INSERT INTO recsa_citizens (id, name, veraz, job, phone, bank, fines, loan_limit, police_status, nu, birthdate, gender, height, eyes, weapon_license, driver_license, commercial_license, address, nationality, avatar, businesses, properties, vehicles, payments)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      ON CONFLICT (id) DO UPDATE SET
        name=EXCLUDED.name, veraz=EXCLUDED.veraz, job=EXCLUDED.job, phone=EXCLUDED.phone, bank=EXCLUDED.bank,
        fines=EXCLUDED.fines, loan_limit=EXCLUDED.loan_limit, police_status=EXCLUDED.police_status, nu=EXCLUDED.nu,
        birthdate=EXCLUDED.birthdate, gender=EXCLUDED.gender, height=EXCLUDED.height, eyes=EXCLUDED.eyes,
        weapon_license=EXCLUDED.weapon_license, driver_license=EXCLUDED.driver_license, commercial_license=EXCLUDED.commercial_license,
        address=EXCLUDED.address, nationality=EXCLUDED.nationality, avatar=EXCLUDED.avatar,
        businesses=EXCLUDED.businesses, properties=EXCLUDED.properties, vehicles=EXCLUDED.vehicles, payments=EXCLUDED.payments
    `, [
      c.id, c.name, c.veraz, c.job, c.phone, c.bank, c.fines, c.loanLimit, c.policeStatus, c.nu, c.birthdate,
      c.gender, c.height, c.eyes, c.weaponLicense, c.driverLicense, c.commercialLicense || 'NO',
      c.address || null, c.nationality || null, c.avatar,
      JSON.stringify(c.businesses || []), JSON.stringify(c.properties || []),
      JSON.stringify(c.vehicles || []), JSON.stringify(c.payments || [])
    ]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citizens/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM recsa_citizens WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Solvency Report
app.get('/api/citizens/solvency', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, veraz, job, bank, fines, police_status
      FROM recsa_citizens
      ORDER BY veraz ASC, fines DESC
    `);
    res.json(result.rows.map(c => ({
      id: c.id, name: c.name, veraz: c.veraz, job: c.job,
      bank: c.bank, fines: parseFloat(c.fines), policeStatus: c.police_status
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: ÓRDENES JUDICIALES
// ============================================================
app.get('/api/judicial-orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_judicial_orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/judicial-orders', async (req, res) => {
  const { type, citizen_id, citizen_name, address, reason, requested_by, requested_date } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO recsa_judicial_orders (type, citizen_id, citizen_name, address, reason, requested_by, requested_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
    `, [type, citizen_id, citizen_name, address || '', reason, requested_by, requested_date]);
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/judicial-orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, reviewed_by, review_date, review_notes } = req.body;
  try {
    await pool.query(`
      UPDATE recsa_judicial_orders
      SET status=$1, reviewed_by=$2, review_date=$3, review_notes=$4
      WHERE id=$5
    `, [status, reviewed_by, review_date, review_notes || '', id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: PRÉSTAMOS
// ============================================================
app.get('/api/loans', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_loan_requests ORDER BY id DESC');
    const mapped = result.rows.map(l => ({
      id: l.id, citizenId: l.citizen_id, citizenName: l.citizen_name,
      amount: parseFloat(l.amount), months: l.months, interest: parseFloat(l.interest),
      status: l.status, approvedBy: l.approved_by, date: l.date
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/loans', async (req, res) => {
  const l = req.body;
  try {
    if (l.id) {
      await pool.query(`
        INSERT INTO recsa_loan_requests (id, citizen_id, citizen_name, amount, months, interest, status, approved_by, date)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, approved_by=EXCLUDED.approved_by
      `, [l.id, l.citizenId, l.citizenName, l.amount, l.months, l.interest, l.status, l.approvedBy || null, l.date]);
    } else {
      await pool.query(`
        INSERT INTO recsa_loan_requests (citizen_id, citizen_name, amount, months, interest, status, date)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `, [l.citizenId, l.citizenName, l.amount, l.months, l.interest, l.status || 'Pendiente', l.date]);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/loans/:id', async (req, res) => {
  const { id } = req.params;
  const { status, approved_by } = req.body;
  try {
    await pool.query('UPDATE recsa_loan_requests SET status=$1, approved_by=$2 WHERE id=$3', [status, approved_by, id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: RÉCORDS CRIMINALES
// ============================================================
app.get('/api/criminal-records', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_criminal_records ORDER BY id DESC');
    const mapped = result.rows.map(r => ({
      id: r.id, citizenId: r.citizen_id, crime: r.crime, fine: parseFloat(r.fine),
      jail: r.jail, officer: r.officer, status: r.status, date: r.date, notes: r.notes
    }));
    res.json(mapped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/criminal-records', async (req, res) => {
  const r = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO recsa_criminal_records (citizen_id, crime, fine, jail, officer, status, date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id
    `, [r.citizenId, r.crime, r.fine || 0, r.jail || 0, r.officer, r.status, r.date, r.notes || '']);
    // Update citizen police_status
    if (r.policeStatusUpdate) {
      await pool.query('UPDATE recsa_citizens SET police_status=$1 WHERE id=$2', [r.policeStatusUpdate, r.citizenId]);
    }
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/criminal-records/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM recsa_criminal_records WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: NOTICIAS
// ============================================================
app.get('/api/news', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_news ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/news', async (req, res) => {
  const n = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO recsa_news (date, headline, excerpt, tag, img) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [n.date, n.headline, n.excerpt, n.tag, n.img]
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM recsa_news WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: CONFIG GENÉRICA (Landing + SIGMA-7)
// ============================================================
app.get('/api/landing-config', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM recsa_config WHERE key = 'landing_config'");
    res.json(result.rows.length > 0 ? result.rows[0].value : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/landing-config', async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO recsa_config (key, value) VALUES ('landing_config', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [JSON.stringify(req.body)]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/config/:key', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM recsa_config WHERE key = $1", [req.params.key]);
    res.json(result.rows.length > 0 ? result.rows[0].value : null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/config/:key', async (req, res) => {
  try {
    await pool.query(
      "INSERT INTO recsa_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [req.params.key, JSON.stringify(req.body)]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: LOG DE ACTIVIDAD
// ============================================================
app.get('/api/activity-log', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM recsa_activity_log ORDER BY timestamp DESC LIMIT 200');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: STATUS
// ============================================================
app.get('/api/status', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', version: APP_VERSION, time: dbCheck.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: error.message });
  }
});

// Static files & SPA fallback
app.use(express.static(__dirname));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`   SISTEMA GUBERNAMENTAL RECSA v4.0 — SERVIDOR INICIADO`);
  console.log(`   Versión: ${APP_VERSION}`);
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Base de datos: Supabase (aws-0-ca-central-1.pooler.supabase.com)`);
  console.log(`================================================================`);
});
