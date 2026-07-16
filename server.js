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
        veraz VARCHAR(50) DEFAULT 'Naranja',
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
        date VARCHAR(50) NOT NULL,
        reason TEXT
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

    // 9. Role Requests (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_role_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES recsa_users(id) ON DELETE CASCADE,
        username VARCHAR(255) NOT NULL,
        citizen_name VARCHAR(255) NOT NULL,
        requested_role VARCHAR(255) NOT NULL,
        requested_badge VARCHAR(100),
        requested_department VARCHAR(255),
        justification TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_by VARCHAR(255),
        resolved_at TIMESTAMP
      );
    `);

    // 10. Citizen Reports & Procedures (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_citizen_reports (
        id SERIAL PRIMARY KEY,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE CASCADE,
        citizen_name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_by VARCHAR(255),
        resolution_notes TEXT
      );
    `);

    // 11. Sigma Codes (rotating access keys for IT team)
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_sigma_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) NOT NULL,
        generated_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        generated_by VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    // 12. Witness Protection (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_witness_protection (
        id SERIAL PRIMARY KEY,
        witness_name VARCHAR(255) NOT NULL,
        alias VARCHAR(255) NOT NULL,
        safehouse_location VARCHAR(255) NOT NULL,
        assigned_officers VARCHAR(255),
        status VARCHAR(100) DEFAULT 'Bajo Resguardo',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 13. Bail Requests (NEW)
    await client.query(`
      CREATE TABLE IF NOT EXISTS recsa_bail_requests (
        id SERIAL PRIMARY KEY,
        citizen_id INTEGER REFERENCES recsa_citizens(id) ON DELETE CASCADE,
        citizen_name VARCHAR(255) NOT NULL,
        amount NUMERIC NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Pendiente',
        requested_by VARCHAR(255) NOT NULL,
        requested_date VARCHAR(100) NOT NULL,
        resolved_by VARCHAR(255),
        resolved_date VARCHAR(100),
        resolution_notes TEXT
      );
    `);

    // Migraciones: Añadir columna reason si no existe
    await client.query(`
      ALTER TABLE recsa_loan_requests ADD COLUMN IF NOT EXISTS reason TEXT;
    `);

    await client.query(`
      ALTER TABLE recsa_users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE;
    `);

    // Auto-approve all Governor accounts so the user is not locked out
    await client.query(`
      UPDATE recsa_users SET approved = TRUE WHERE LOWER(role) = 'gobernador' OR username = 'GobernadorH';
    `);

    console.log('Tablas creadas/verificadas correctamente.');

    // Seed GobernadorH if users table is empty
    const userCheck = await client.query('SELECT COUNT(*) FROM recsa_users');
    if (parseInt(userCheck.rows[0].count) === 0) {
      console.log('Sembrando cuenta administradora GobernadorH...');
      await client.query(`
        INSERT INTO recsa_users (username, password, role, name, department, approved)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['GobernadorH', 'Harrison1910**', 'Gobernador', 'Gobernador Harrison', 'Despacho del Gobernador', true]);
    } else {
      // Garantizar que la cuenta de GobernadorH existente esté aprobada
      await client.query("UPDATE recsa_users SET approved = TRUE WHERE username = 'GobernadorH'");
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

    // Reset witness compromised config on server startup
    console.log('Restableciendo estado de brecha de testigos en inicio del servidor...');
    const defaultWitnessComp = { compromised: false, timestamp: null, detail: null };
    await pool.query(
      "INSERT INTO recsa_config (key, value) VALUES ('witness_compromised', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [JSON.stringify(defaultWitnessComp)]
    );

    // Seed witness protection if table is empty
    const witnessCountCheck = await client.query("SELECT COUNT(*) FROM recsa_witness_protection");
    if (parseInt(witnessCountCheck.rows[0].count) === 0) {
      console.log('Sembrando testigos protegidos iniciales...');
      await client.query(`
        INSERT INTO recsa_witness_protection (witness_name, alias, safehouse_location, assigned_officers, status, notes)
        VALUES 
        ('Michael De Santa', 'Albert De Silva', 'Mansión Banham Canyon Rd', 'Agente Dave Norton (FIB)', 'Bajo Resguardo', 'Testigo clave contra la mafia de Devin Weston.'),
        ('Karen Drake', 'T-100', 'Apartamento 3B - El Burro Heights', 'Oficial Jones (LSPD)', 'Seguridad Media', 'Proporcionó información sobre el cartel de Madrazo.'),
        ('Brad Snider', 'BradS', 'Cementerio de Ludendorff (Fingido)', 'Agente Steve Haines (FIB)', 'Reubicado', 'Simulación de muerte para cobertura de testigo.')
      `);
      await client.query(
        "INSERT INTO recsa_config (key, value) VALUES ('witness_seeded', $1) ON CONFLICT (key) DO NOTHING",
        [JSON.stringify(true)]
      );
    }

    // NOTE: No citizen seeds — citizens are managed exclusively via the admin panel ("Data de Ciudadanos").
    // Deleted citizens will NOT reappear after server restarts.

    await recalculateAllCitizensRisk(client);

    // Seed initial SIGMA-7 access code if none exists
    const codeCheck = await client.query('SELECT COUNT(*) FROM recsa_sigma_codes WHERE active = TRUE');
    if (parseInt(codeCheck.rows[0].count) === 0) {
      const firstCode = generateSigmaCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await client.query(
        'INSERT INTO recsa_sigma_codes (code, expires_at, generated_by, active) VALUES ($1, $2, $3, TRUE)',
        [firstCode, expiresAt, 'SISTEMA-INICIAL']
      );
      console.log(`[SIGMA] Código inicial generado: ${firstCode}`);
    }

    console.log('RECSA v4.0 inicializado con éxito.');
  } catch (error) {
    console.error('Error durante la inicialización:', error.message);
  } finally {
    client.release();
  }
}

// ============================================================
// SIGMA-7 ACCESS CODE SYSTEM (IT TEAM ROTATING KEYS)
// ============================================================
function generateSigmaCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SIG-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code; // e.g. SIG-K7XM-NP4Q
}

async function rotateSigmaCode(requestedBy = 'SISTEMA') {
  try {
    await pool.query('UPDATE recsa_sigma_codes SET active = FALSE WHERE active = TRUE');
    const newCode = generateSigmaCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await pool.query(
      'INSERT INTO recsa_sigma_codes (code, expires_at, generated_by, active) VALUES ($1, $2, $3, TRUE)',
      [newCode, expiresAt, requestedBy]
    );
    console.log(`[SIGMA] Nuevo código generado: ${newCode} — Válido hasta: ${expiresAt.toISOString()}`);
    return newCode;
  } catch (err) {
    console.error('[SIGMA] Error rotando código:', err.message);
    return null;
  }
}

// Auto-rotate every 24 hours
setInterval(() => rotateSigmaCode('AUTO-SISTEMA'), 24 * 60 * 60 * 1000);

// ============================================================
// AUTOMATIC CITIZEN RISK CALCULATION (SSC)
// ============================================================
async function autoCalculateCitizenRisk(db, citizenId) {
  try {
    const citizenRes = await db.query('SELECT * FROM recsa_citizens WHERE id = $1', [citizenId]);
    if (citizenRes.rows.length === 0) return;
    const c = citizenRes.rows[0];

    const recordsRes = await db.query('SELECT * FROM recsa_criminal_records WHERE citizen_id = $1', [citizenId]);
    const records = recordsRes.rows;

    const loansRes = await db.query('SELECT * FROM recsa_loan_requests WHERE citizen_id = $1', [citizenId]);
    const loans = loansRes.rows;

    let newVeraz = 'Verde'; // Default: safe & normal status

    const finesVal = parseFloat((c.fines || '').replace(/[^0-9.-]+/g, '')) || 0;
    const bankVal = parseFloat((c.bank || '').replace(/[^0-9.-]+/g, '')) || 0;
    const isWanted = ['buscado', 'prófugo', 'arrestado'].includes((c.police_status || '').toLowerCase());
    const hasApprovedLoans = loans.some(l => l.status === 'Aprobado');

    // Risk rules logic:
    if (isWanted) {
      newVeraz = 'Rojo';
    } else if (finesVal > 10000) {
      newVeraz = 'Rojo';
    } else if (records.length >= 3) {
      newVeraz = 'Rojo';
    } else if (hasApprovedLoans && bankVal < 100) {
      newVeraz = 'Rojo';
    } else if (finesVal > 0) {
      newVeraz = 'Naranja';
    } else if (records.length > 0 && records.length < 3) {
      newVeraz = 'Naranja';
    } else if (c.driver_license === 'NO' && records.length > 0) {
      newVeraz = 'Naranja';
    }

    if (c.veraz !== newVeraz) {
      await db.query('UPDATE recsa_citizens SET veraz = $1 WHERE id = $2', [newVeraz, citizenId]);
      console.log(`[RISK UPDATE] Citizen ${c.name} (${citizenId}): ${c.veraz} -> ${newVeraz}`);
    }
  } catch (err) {
    console.error(`Error calculating citizen risk for ${citizenId}:`, err.message);
  }
}

async function recalculateAllCitizensRisk(db) {
  try {
    const res = await db.query('SELECT id FROM recsa_citizens');
    for (const row of res.rows) {
      await autoCalculateCitizenRisk(db, row.id);
    }
    console.log('Recalculación automática de riesgo completada.');
  } catch (err) {
    console.error('Error recalculando todos los ciudadanos:', err.message);
  }
}

initDb();

// ============================================================
// HELPERS
// ============================================================
function requireGobernador(req, res, next) {
  const role = req.headers['x-user-role'];
  if (role !== 'Gobernador') {
    return res.status(403).json({ error: 'Solo el Gobernador puede realizar esta acción.' });
  }
  next();
}

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
      'SELECT id, username, role, name, badge, department, citizen_id, approved FROM recsa_users WHERE username = $1 AND password = $2',
      [user, pass]
    );
    if (result.rows.length > 0) {
      const dbUser = result.rows[0];
      if (!dbUser.approved) {
        if (dbUser.role && dbUser.role.toLowerCase() === 'gobernador') {
          // Auto-approve gobernador in DB to prevent future issues
          await pool.query('UPDATE recsa_users SET approved = true WHERE id = $1', [dbUser.id]);
          dbUser.approved = true;
        } else {
          return res.status(403).json({ error: 'Tu cuenta o rol está pendiente de aprobación por el Gobernador.' });
        }
      }
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

app.post('/api/auth/register', async (req, res) => {
  const { username, password, name, citizenId } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Completa todos los campos obligatorios.' });
  }
  try {
    const userCheck = await pool.query('SELECT id FROM recsa_users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(409).json({ error: 'El nombre de usuario ya está registrado.' });
    }

    let linkedCitizenId = null;
    if (citizenId) {
      const citizenCheck = await pool.query('SELECT id FROM recsa_citizens WHERE id = $1', [citizenId]);
      if (citizenCheck.rows.length > 0) {
        linkedCitizenId = citizenCheck.rows[0].id;
      } else {
        // Create the citizen with the provided ID since it doesn't exist
        linkedCitizenId = citizenId;
        const randomPhone = `555-${Math.floor(1000 + Math.random() * 9000)}`;
        await pool.query(
          `INSERT INTO recsa_citizens (id, name, veraz, job, phone, bank, fines, loan_limit, police_status, properties, vehicles, businesses) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [linkedCitizenId, name, 'Naranja', 'Civil', randomPhone, '$15,000', 0, 10000, 'Limpio', '[]', '[]', '[]']
        );
      }
    } else {
      // Generate a unique ID
      let idExists = true;
      while (idExists) {
        linkedCitizenId = Math.floor(1000 + Math.random() * 9000);
        const check = await pool.query('SELECT id FROM recsa_citizens WHERE id = $1', [linkedCitizenId]);
        if (check.rows.length === 0) {
          idExists = false;
        }
      }
      
      const randomPhone = `555-${Math.floor(1000 + Math.random() * 9000)}`;
      await pool.query(
        `INSERT INTO recsa_citizens (id, name, veraz, job, phone, bank, fines, loan_limit, police_status, properties, vehicles, businesses) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [linkedCitizenId, name, 'Naranja', 'Civil', randomPhone, '$15,000', 0, 10000, 'Limpio', '[]', '[]', '[]']
      );
    }

    const result = await pool.query(
      'INSERT INTO recsa_users (username, password, role, name, citizen_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [username, password, 'Civil', name, linkedCitizenId]
    );

    await logActivity(username, 'REGISTER', `Registro de civil completado. ID Ciudadano vinculado: ${linkedCitizenId}`);
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: SOLICITUDES DE RANGO
// ============================================================
app.get('/api/role-requests', async (req, res) => {
  const { userId } = req.query;
  try {
    let result;
    if (userId) {
      result = await pool.query('SELECT * FROM recsa_role_requests WHERE user_id = $1 ORDER BY id DESC', [userId]);
    } else {
      result = await pool.query('SELECT * FROM recsa_role_requests ORDER BY id DESC');
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/role-requests', async (req, res) => {
  const { userId, username, citizenName, requestedRole, requestedBadge, requestedDepartment, justification } = req.body;
  if (!userId || !username || !requestedRole || !justification) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    await pool.query(
      `INSERT INTO recsa_role_requests (user_id, username, citizen_name, requested_role, requested_badge, requested_department, justification)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, username, citizenName || '', requestedRole, requestedBadge || null, requestedDepartment || null, justification]
    );
    await logActivity(username, 'ROLE_REQUEST', `Solicitud de rango a ${requestedRole}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/role-requests/:id', async (req, res) => {
  const { id } = req.params;
  const { status, resolved_by } = req.body;
  if (!status || !resolved_by) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    const reqInfo = await pool.query('SELECT * FROM recsa_role_requests WHERE id = $1', [id]);
    if (reqInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }
    const request = reqInfo.rows[0];

    await pool.query(
      'UPDATE recsa_role_requests SET status = $1, resolved_by = $2, resolved_at = NOW() WHERE id = $3',
      [status, resolved_by, id]
    );

    if (status === 'Aprobada') {
      await pool.query(
        'UPDATE recsa_users SET role = $1, badge = $2, department = $3, approved = true WHERE id = $4',
        [request.requested_role, request.requested_badge, request.requested_department, request.user_id]
      );
      await logActivity(resolved_by, 'ROLE_REQUEST_APPROVED', `Aprobada solicitud de rango de ${request.username} a ${request.requested_role}`);
    } else {
      await logActivity(resolved_by, 'ROLE_REQUEST_REJECTED', `Rechazada solicitud de rango de ${request.username} a ${request.requested_role}`);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: CITIZEN REPORTS & PROCEDURES
// ============================================================
app.get('/api/citizen-reports', async (req, res) => {
  const { citizenId } = req.query;
  try {
    let result;
    if (citizenId) {
      result = await pool.query('SELECT * FROM recsa_citizen_reports WHERE citizen_id = $1 ORDER BY id DESC', [citizenId]);
    } else {
      result = await pool.query('SELECT * FROM recsa_citizen_reports ORDER BY id DESC');
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/citizen-reports', async (req, res) => {
  const { citizenId, citizenName, type, title, description } = req.body;
  if (!citizenId || !citizenName || !type || !title || !description) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    await pool.query(
      'INSERT INTO recsa_citizen_reports (citizen_id, citizen_name, type, title, description) VALUES ($1, $2, $3, $4, $5)',
      [citizenId, citizenName, type, title, description]
    );
    await logActivity(citizenName, 'REPORT_SUBMITTED', `Enviado reporte de tipo ${type}: ${title}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/citizen-reports/:id', async (req, res) => {
  const { id } = req.params;
  const { status, resolved_by, resolution_notes } = req.body;
  if (!status || !resolved_by) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    await pool.query(
      'UPDATE recsa_citizen_reports SET status = $1, resolved_by = $2, resolution_notes = $3 WHERE id = $4',
      [status, resolved_by, resolution_notes || '', id]
    );
    await logActivity(resolved_by, 'REPORT_RESOLVED', `Resuelto reporte ID ${id} como ${status}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// API: SOLICITUDES DE FIANZAS
// ============================================================
app.get('/api/bails', async (req, res) => {
  const { citizenId } = req.query;
  try {
    let result;
    if (citizenId) {
      result = await pool.query('SELECT * FROM recsa_bail_requests WHERE citizen_id = $1 ORDER BY id DESC', [citizenId]);
    } else {
      result = await pool.query('SELECT * FROM recsa_bail_requests ORDER BY id DESC');
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bails', async (req, res) => {
  const { citizenId, citizenName, amount, reason, requestedBy } = req.body;
  if (!citizenId || !citizenName || !amount || !reason || !requestedBy) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    await pool.query(
      `INSERT INTO recsa_bail_requests (citizen_id, citizen_name, amount, reason, requested_by, requested_date)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [citizenId, citizenName, amount, reason, requestedBy, new Date().toLocaleDateString('es-ES')]
    );
    await logActivity(requestedBy, 'BAIL_REQUEST_SUBMITTED', `Solicitud de fianza para ${citizenName} por $${amount}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bails/:id', async (req, res) => {
  const { id } = req.params;
  const { status, resolved_by, resolution_notes } = req.body;
  if (!status || !resolved_by) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }
  try {
    await pool.query(
      `UPDATE recsa_bail_requests 
       SET status = $1, resolved_by = $2, resolved_date = $3, resolution_notes = $4
       WHERE id = $5`,
      [status, resolved_by, new Date().toLocaleDateString('es-ES'), resolution_notes || '', id]
    );
    await logActivity(resolved_by, 'BAIL_REQUEST_RESOLVED', `Fianza ID ${id} marcada como ${status}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// API: USUARIOS (Solo Gobernador)
// ============================================================
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, role, name, badge, department, created_at, last_login, approved FROM recsa_users ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, password, role, name, badge, department } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO recsa_users (username, password, role, name, badge, department, approved) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [username, password, role, name, badge || null, department || null, true]
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

app.put('/api/users/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { approvedBy } = req.body;
  try {
    await pool.query('UPDATE recsa_users SET approved = true WHERE id = $1', [id]);
    await logActivity(approvedBy || 'Gobernador', 'USER_APPROVED', `Aprobado acceso a usuario ID ${id}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', requireGobernador, async (req, res) => {
  const { id } = req.params;
  const { role, badge, department } = req.body;
  try {
    await pool.query(
      'UPDATE recsa_users SET role = $1, badge = $2, department = $3 WHERE id = $4',
      [role, badge || null, department || null, id]
    );
    const actor = req.headers['x-user-username'] || 'Gobernador';
    await logActivity(actor, 'USER_ROLE_UPDATED', `Actualizado rol del usuario ID ${id} a ${role}`);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', requireGobernador, async (req, res) => {
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

app.put('/api/users/:id/link-citizen', async (req, res) => {
  const { id } = req.params;
  const { citizenId, username } = req.body;
  if (!citizenId) {
    return res.status(400).json({ error: 'El ID de Ciudadano es requerido.' });
  }
  try {
    const citizenCheck = await pool.query('SELECT name FROM recsa_citizens WHERE id = $1', [citizenId]);
    if (citizenCheck.rows.length === 0) {
      // Auto-create citizen profile if it doesn't exist
      const randomPhone = `555-${Math.floor(1000 + Math.random() * 9000)}`;
      const userRes = await pool.query('SELECT name FROM recsa_users WHERE id = $1', [id]);
      const name = userRes.rows.length > 0 ? userRes.rows[0].name : 'Ciudadano Nuevo';

      await pool.query(
        `INSERT INTO recsa_citizens (id, name, veraz, job, phone, bank, fines, loan_limit, police_status, properties, vehicles, businesses) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [citizenId, name, 'Naranja', 'Civil', randomPhone, '$15,000', 0, 10000, 'Limpio', '[]', '[]', '[]']
      );
    } else {
      const linkCheck = await pool.query('SELECT username FROM recsa_users WHERE citizen_id = $1 AND id != $2', [citizenId, id]);
      if (linkCheck.rows.length > 0) {
        return res.status(409).json({ error: `Esa cédula ya está vinculada al usuario: ${linkCheck.rows[0].username}` });
      }
    }

    await pool.query('UPDATE recsa_users SET citizen_id = $1 WHERE id = $2', [citizenId, id]);
    await logActivity(username || 'Sistema', 'LINK_CITIZEN', `Usuario ID ${id} vinculado a ciudadano ID ${citizenId}`);
    
    const citizenCheckUpdated = await pool.query('SELECT name FROM recsa_citizens WHERE id = $1', [citizenId]);
    res.json({ success: true, citizenName: citizenCheckUpdated.rows[0].name });
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
    const checkCitizen = await pool.query('SELECT name FROM recsa_citizens WHERE id = $1', [c.id]);
    const isNewCitizen = checkCitizen.rows.length === 0;

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

    await autoCalculateCitizenRisk(pool, c.id);

    if (isNewCitizen) {
      const parts = c.name.trim().split(/\s+/);
      let baseUsername = '';
      if (parts.length >= 2) {
        const firstLetter = parts[0].substring(0, 1).toLowerCase();
        const lastName = parts[parts.length - 1].toLowerCase();
        baseUsername = firstLetter + lastName;
      } else {
        baseUsername = parts[0].toLowerCase();
      }
      baseUsername = baseUsername.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (!baseUsername) baseUsername = 'usuario';

      let username = baseUsername;
      let counter = 1;
      let usernameCheck = await pool.query('SELECT id FROM recsa_users WHERE username = $1', [username]);
      while (usernameCheck.rows.length > 0) {
        username = baseUsername + counter;
        usernameCheck = await pool.query('SELECT id FROM recsa_users WHERE username = $1', [username]);
        counter++;
      }

      const defaultPassword = String(c.id);
      await pool.query(
        `INSERT INTO recsa_users (username, password, role, name, citizen_id, approved)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [username, defaultPassword, 'Civil', c.name, c.id, true]
      );
      console.log(`[AUTO-USER] Created automatic user for citizen ${c.name}: username=${username}, password=${defaultPassword}`);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citizens/:id', requireGobernador, async (req, res) => {
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
      status: l.status, approvedBy: l.approved_by, date: l.date, reason: l.reason
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
        INSERT INTO recsa_loan_requests (id, citizen_id, citizen_name, amount, months, interest, status, approved_by, date, reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        ON CONFLICT (id) DO UPDATE SET status=EXCLUDED.status, approved_by=EXCLUDED.approved_by
      `, [l.id, l.citizenId, l.citizenName, l.amount, l.months, l.interest, l.status, l.approvedBy || null, l.date, l.reason || null]);
    } else {
      await pool.query(`
        INSERT INTO recsa_loan_requests (citizen_id, citizen_name, amount, months, interest, status, date, reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `, [l.citizenId, l.citizenName, l.amount, l.months, l.interest, l.status || 'Pendiente', l.date, l.reason || null]);
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
    const loanRes = await pool.query('SELECT citizen_id FROM recsa_loan_requests WHERE id = $1', [id]);
    if (loanRes.rows.length > 0) {
      await autoCalculateCitizenRisk(pool, loanRes.rows[0].citizen_id);
    }
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
    await autoCalculateCitizenRisk(pool, r.citizenId);
    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/criminal-records/:id', requireGobernador, async (req, res) => {
  const { id } = req.params;
  try {
    const recordRes = await pool.query('SELECT citizen_id FROM recsa_criminal_records WHERE id = $1', [id]);
    const citizenId = recordRes.rows[0]?.citizen_id;
    await pool.query('DELETE FROM recsa_criminal_records WHERE id = $1', [id]);
    if (citizenId) {
      await autoCalculateCitizenRisk(pool, citizenId);
    }
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

app.delete('/api/news/:id', requireGobernador, async (req, res) => {
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
// API: SIGMA-7 ACCESS CODES (IT TEAM)
// ============================================================

// GET current active code — only IT team, Gobernador, Policia Jefe
app.get('/api/sigma-codes/current', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, code, generated_at, expires_at, generated_by FROM recsa_sigma_codes WHERE active = TRUE ORDER BY generated_at DESC LIMIT 1'
    );
    if (result.rows.length === 0) {
      // No active code — generate one
      const newCode = await rotateSigmaCode('SISTEMA-AUTO');
      const r2 = await pool.query(
        'SELECT id, code, generated_at, expires_at, generated_by FROM recsa_sigma_codes WHERE active = TRUE ORDER BY generated_at DESC LIMIT 1'
      );
      return res.json(r2.rows[0] || { error: 'No se pudo generar código' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST verify a code — used during bypass attempt
app.post('/api/sigma-codes/verify', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ valid: false, reason: 'Código vacío' });

    const result = await pool.query(
      'SELECT * FROM recsa_sigma_codes WHERE active = TRUE AND code = $1 AND expires_at > NOW()',
      [code.trim().toUpperCase()]
    );
    if (result.rows.length > 0) {
      // Log attempt
      await pool.query(
        'INSERT INTO recsa_activity_log (username, action, detail) VALUES ($1, $2, $3)',
        ['BYPASS_SYSTEM', 'SIGMA_CODE_ACCEPTED', `Código aceptado: ${code}`]
      );
      res.json({ valid: true });
    } else {
      await pool.query(
        'INSERT INTO recsa_activity_log (username, action, detail) VALUES ($1, $2, $3)',
        ['BYPASS_SYSTEM', 'SIGMA_CODE_REJECTED', `Intento fallido con código: ${code}`]
      );
      res.json({ valid: false, reason: 'Código inválido o expirado' });
    }
  } catch (error) {
    res.status(500).json({ valid: false, reason: error.message });
  }
});

// POST rotate code manually — only Gobernador / equipo_informatico
app.post('/api/sigma-codes/rotate', async (req, res) => {
  try {
    const { requestedBy } = req.body;
    const newCode = await rotateSigmaCode(requestedBy || 'MANUAL');
    if (!newCode) return res.status(500).json({ error: 'Error generando código' });
    const result = await pool.query(
      'SELECT id, code, generated_at, expires_at, generated_by FROM recsa_sigma_codes WHERE active = TRUE LIMIT 1'
    );
    res.json({ success: true, code: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET code history — only Gobernador
app.get('/api/sigma-codes/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, code, generated_at, expires_at, generated_by, active FROM recsa_sigma_codes ORDER BY generated_at DESC LIMIT 30'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ============================================================
// API: PROTECCIÓN A TESTIGOS
// ============================================================

// GET witness compromise status
app.get('/api/witness-protection/compromise-status', async (req, res) => {
  try {
    const result = await pool.query("SELECT value FROM recsa_config WHERE key = 'witness_compromised'");
    if (result.rows.length === 0) {
      return res.json({ compromised: false, timestamp: null, detail: null });
    }
    res.json(result.rows[0].value);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST reset compromise status (only Governor)
app.post('/api/witness-protection/reset-compromise', async (req, res) => {
  try {
    const defaultVal = { compromised: false, timestamp: null, detail: null };
    await pool.query(
      "INSERT INTO recsa_config (key, value) VALUES ('witness_compromised', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [JSON.stringify(defaultVal)]
    );
    // Log resetting action
    const { user } = req.body;
    await pool.query(
      "INSERT INTO recsa_activity_log (username, action, detail) VALUES ($1, $2, $3)",
      [user || 'Gobernador', 'RESTABLECER_SEGURIDAD_TESTIGOS', 'El Gobernador ha reestablecido la seguridad del módulo y borrado las alertas de intrusión.']
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET witness protection list (triggers compromise if compromisedBy === 'backdoor')
app.get('/api/witness-protection', async (req, res) => {
  const { compromisedBy } = req.query;
  try {
    if (compromisedBy === 'backdoor') {
      const timestamp = new Date().toISOString();
      const breachInfo = {
        compromised: true,
        timestamp,
        detail: 'Acceso no autorizado detectado desde Terminal SIGMA-7 (Bypass Anónimo)'
      };
      await pool.query(
        "INSERT INTO recsa_config (key, value) VALUES ('witness_compromised', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
        [JSON.stringify(breachInfo)]
      );
      // Log to activity log
      await pool.query(
        "INSERT INTO recsa_activity_log (username, action, detail) VALUES ($1, $2, $3)",
        ['Terminal SIGMA-7', 'BRECHA_SEGURIDAD_TESTIGOS', 'La base de datos de testigos protegidos fue comprometida. Acceso ilegal detectado.']
      );
    }
    const result = await pool.query('SELECT * FROM recsa_witness_protection ORDER BY id ASC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create witness record
app.post('/api/witness-protection', async (req, res) => {
  const { witness_name, alias, safehouse_location, assigned_officers, status, notes } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO recsa_witness_protection (witness_name, alias, safehouse_location, assigned_officers, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [witness_name, alias, safehouse_location, assigned_officers, status || 'Bajo Resguardo', notes]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update witness record
app.put('/api/witness-protection/:id', async (req, res) => {
  const { id } = req.params;
  const { witness_name, alias, safehouse_location, assigned_officers, status, notes } = req.body;
  try {
    const result = await pool.query(
      'UPDATE recsa_witness_protection SET witness_name=$1, alias=$2, safehouse_location=$3, assigned_officers=$4, status=$5, notes=$6 WHERE id=$7 RETURNING *',
      [witness_name, alias, safehouse_location, assigned_officers, status, notes, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE witness record
app.delete('/api/witness-protection/:id', requireGobernador, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM recsa_witness_protection WHERE id = $1', [id]);
    res.json({ success: true });
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
