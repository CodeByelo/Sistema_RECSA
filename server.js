const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Supabase PostgreSQL Connection
const connectionString = 'postgresql://postgres.ianerdzakxdjddovkzok:Dani3l1910__RECSA@aws-0-ca-central-1.pooler.supabase.com:6543/postgres';

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

    console.log('Tablas estructuradas correctamente. Insertando datos semilla si están vacías...');

    // Seed Citizens
    const citizenCheck = await client.query('SELECT COUNT(*) FROM recsa_citizens');
    if (parseInt(citizenCheck.rows[0].count) === 0) {
      console.log('Sembrando tabla de ciudadanos...');
      const defaultCitizens = [
        { id: 101, name: "Franklin Clinton", veraz: "Verde", job: "Mecánico Autotuning", phone: "555-0101", bank: "$120,400", fines: 0, loan_limit: 50000, police_status: "Limpio", nu: "A-101", birthdate: "12/03/1988", gender: "Masculino", height: "183", eyes: "Pardos", weapon_license: "NO", driver_license: "SÍ (12/12)", avatar: "https://i.imgur.com/8Qe5g6g.png", businesses: [], properties: [], payments: [] },
        { id: 102, name: "Michael De Santa", veraz: "Verde", job: "Productor de Cine", phone: "555-0102", bank: "$2,450,000", fines: 0, loan_limit: 500000, police_status: "Limpio", nu: "A-102", birthdate: "09/07/1968", gender: "Masculino", height: "188", eyes: "Azules", weapon_license: "SÍ W-102", driver_license: "SÍ (12/12)", avatar: "", businesses: [], properties: [], payments: [] },
        { id: 103, name: "Trevor Philips", veraz: "Rojo", job: "CEO de Industrias T.P.", phone: "555-0103", bank: "-$14,500", fines: 154000, loan_limit: 0, police_status: "Buscado", nu: "A-103", birthdate: "14/11/1967", gender: "Masculino", height: "186", eyes: "Pardos", weapon_license: "SÍ W-103", driver_license: "NO", avatar: "", businesses: [], properties: [], payments: [] },
        { id: 104, name: "Lamar Davis", veraz: "Rojo", job: "Repartidor Premium", phone: "555-0104", bank: "$350", fines: 12500, loan_limit: 0, police_status: "Limpio", nu: "A-104", birthdate: "20/06/1987", gender: "Masculino", height: "201", eyes: "Marrón", weapon_license: "NO", driver_license: "SÍ (8/12)", avatar: "", businesses: [], properties: [], payments: [] },
        { id: 105, name: "Lester Crest", veraz: "Verde", job: "Consultor TI", phone: "555-0105", bank: "$5,600,000", fines: 0, loan_limit: 1000000, police_status: "Limpio", nu: "A-105", birthdate: "11/02/1972", gender: "Masculino", height: "172", eyes: "Marrón", weapon_license: "NO", driver_license: "SÍ (12/12)", avatar: "", businesses: [], properties: [], payments: [] },
        { id: 106, name: "Jimmy De Santa", veraz: "Rojo", job: "Desempleado / Gamer", phone: "555-0106", bank: "-$1,200", fines: 3200, loan_limit: 0, police_status: "Limpio", nu: "A-106", birthdate: "02/09/1991", gender: "Masculino", height: "175", eyes: "Marrón", weapon_license: "NO", driver_license: "SÍ (10/12)", avatar: "", businesses: [], properties: [], payments: [] },
        { id: 107, name: "Dave Norton", veraz: "Verde", job: "Funcionario Federal FIB", phone: "555-0107", bank: "$310,000", fines: 0, loan_limit: 150000, police_status: "Limpio", nu: "A-107", birthdate: "23/04/1965", gender: "Masculino", height: "182", eyes: "Verdes", weapon_license: "SÍ W-107", driver_license: "SÍ (12/12)", avatar: "", businesses: [], properties: [], payments: [] },
        { id: 118, name: "Esteban Russo", veraz: "Verde", job: "Distribuidor Logístico", phone: "555-0118", bank: "$42,500", fines: 0, loan_limit: 25000, police_status: "Limpio", nu: "A-118", birthdate: "14/08/1995", gender: "Masculino", height: "180", eyes: "Marrones", weapon_license: "NO", driver_license: "SÍ (12/12)", avatar: "", businesses: [ { name: "Russo Logistic Solutions", status: "Activo", earnings: 12000 } ], properties: [], payments: [] }
      ];

      for (const cit of defaultCitizens) {
        await client.query(`
          INSERT INTO recsa_citizens (id, name, veraz, job, phone, bank, fines, loan_limit, police_status, nu, birthdate, gender, height, eyes, weapon_license, driver_license, avatar, businesses, properties, payments)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        `, [
          cit.id, cit.name, cit.veraz, cit.job, cit.phone, cit.bank, cit.fines, cit.loan_limit, cit.police_status,
          cit.nu, cit.birthdate, cit.gender, cit.height, cit.eyes, cit.weapon_license, cit.driver_license, cit.avatar,
          JSON.stringify(cit.businesses), JSON.stringify(cit.properties), JSON.stringify(cit.payments)
        ]);
      }
    }

    // Seed Users
    const userCheck = await client.query('SELECT COUNT(*) FROM recsa_users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Sembrando tabla de usuarios autorizados...');
      const defaultUsers = [
        { username: "civil", password: "1234", role: "civil", name: "Esteban Russo", citizen_id: 118 },
        { username: "funcionario", password: "gov2024", role: "Inspector Fiscal RECSA", name: "Dra. Valeria Miller", citizen_id: null },
        { username: "banco_maz", password: "bank999", role: "Auditor Fleeca Bank", name: "Marcus Sterling", citizen_id: null },
        { username: "admin_lssd", password: "alpha123", role: "Sheriff Department Admin", name: "Sheriff A. Rodriguez", citizen_id: null },
        { username: "cmte_santos", password: "lspd#2024", role: "Comandante General LSPD", name: "Cmte. Ricardo Santos", citizen_id: null },
        { username: "backdoor", password: "classified", role: "Infiltrado Rebelde", name: "Ghost Protocol", citizen_id: null }
      ];

      for (const u of defaultUsers) {
        await client.query(`
          INSERT INTO recsa_users (username, password, role, name, citizen_id)
          VALUES ($1, $2, $3, $4, $5)
        `, [u.username, u.password, u.role, u.name, u.citizen_id]);
      }
    }

    // Seed News
    const newsCheck = await client.query('SELECT COUNT(*) FROM recsa_news');
    if (parseInt(newsCheck.rows[0].count) === 0) {
      console.log('Sembrando tabla de noticias de campaña...');
      const defaultNews = [
        { date: "12 de Julio, 2026", headline: "Impresionante apoyo a Dylan Harrison en Verdant Bluffs", excerpt: "Con una asistencia masiva de ciudadanos del sur del estado, el partido RECSA dio inicio a la gran gira de discursos políticos en Verdant Bluffs.", tag: "Campaña", img: "./assets/campana_discurso.png" },
        { date: "09 de Julio, 2026", headline: "RECSA anuncia el Nuevo Plan de Vivienda Justa", excerpt: "A través del Sistema de Solvencia Ciudadana (SSC), los inspectores autorizarán bonos directos a tasas del 5% a familias cívicas solventes.", tag: "Economía", img: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=600&q=80" }
      ];

      for (const n of defaultNews) {
        await client.query(`
          INSERT INTO recsa_news (date, headline, excerpt, tag, img)
          VALUES ($1, $2, $3, $4, $5)
        `, [n.date, n.headline, n.excerpt, n.tag, n.img]);
      }
    }

    // Seed Criminal Records
    const recordsCheck = await client.query('SELECT COUNT(*) FROM recsa_criminal_records');
    if (parseInt(recordsCheck.rows[0].count) === 0) {
      console.log('Sembrando expedientes delictivos...');
      const defaultRecords = [
        { citizen_id: 103, crime: "Tráfico de armas Paleto Bay", fine: 100000, jail: 120, officer: "Jefe Andrew McTavish", status: "Prófugo", date: "10 de Junio, 2026", notes: "Incautado camión con rifles de asalto." },
        { citizen_id: 103, crime: "Asalto a blindado Gruppe 6", fine: 54000, jail: 60, officer: "Capitán Samuel Sterling", status: "Prófugo", date: "28 de Junio, 2026", notes: "Asalto con explosivos." },
        { citizen_id: 106, crime: "Alteración del orden público", fine: 3200, jail: 1, officer: "Agente Ronald Briggs", status: "Cumplido", date: "02 de Julio, 2026", notes: "Escándalo en local comercial." }
      ];

      for (const r of defaultRecords) {
        await client.query(`
          INSERT INTO recsa_criminal_records (citizen_id, crime, fine, jail, officer, status, date, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [r.citizen_id, r.crime, r.fine, r.jail, r.officer, r.status, r.date, r.notes]);
      }
    }

    // Seed Config
    const configCheck = await client.query('SELECT COUNT(*) FROM recsa_config');
    if (parseInt(configCheck.rows[0].count) === 0) {
      console.log('Sembrando configuraciones de landing page...');
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
      await client.query(`
        INSERT INTO recsa_config (key, value)
        VALUES ('landing_config', $1)
      `, [JSON.stringify(defaultConfig)]);
    }

    console.log('Inicialización y siembra completadas con éxito.');
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
