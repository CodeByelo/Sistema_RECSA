# Sistema de Solvencia Gubernamental RECSA (San Andreas)

Este es el portal web oficial del **Partido Renovación Cívica de San Andreas (RECSA)**, que integra el **Sistema de Solvencia Ciudadana (SSC)**, la consulta policial MDC de LSPD/LSSD, y la red cifrada de inteligencia SIGMA-7.

El sistema está completamente integrado y conectado a **Supabase** como base de datos en la nube.

---

## 🏗️ Arquitectura del Proyecto

- **Frontend**: HTML5, Vanilla CSS, FontAwesome e Inter Font.
- **Backend (API)**: Node.js, Express, PostgreSQL (`pg` client).
- **Base de Datos**: Supabase (Tablas relacionales: `recsa_citizens`, `recsa_users`, `recsa_loan_requests`, `recsa_criminal_records`, `recsa_news`, `recsa_config`).
- **Recursos**: Organizados en la carpeta `assets/`.

---

## 🚀 Despliegue en la Nube (Producción)

Dado que el servidor Express (`server.js`) sirve el frontend `index.html` de forma estática, **puedes desplegar todo el proyecto junto como una sola aplicación Node.js**. Esto simplifica el despliegue a un solo clic y evita cualquier problema de CORS.

### Opción A: Despliegue en Render (Recomendado y Gratis)

1. Sube este proyecto a un repositorio privado o público en **GitHub**.
2. Regístrate en [Render.com](https://render.com) y crea un nuevo **Web Service**.
3. Conecta tu repositorio de GitHub.
4. Usa los siguientes parámetros en la configuración de Render:
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Render te dará una URL pública del tipo `https://tu-app.onrender.com` con la que cualquiera podrá entrar al sistema.

### Opción B: Despliegue en Railway

1. Sube el proyecto a **GitHub**.
2. En [Railway.app](https://railway.app), crea un nuevo proyecto y selecciona **Deploy from GitHub repo**.
3. Railway detectará automáticamente el archivo `package.json` e iniciará la instalación y ejecución del servidor.

---

## 💻 Ejecución Local (Desarrollo)

1. Asegúrate de tener instalado [Node.js](https://nodejs.org/).
2. Haz doble clic en el archivo **`start.bat`** en la carpeta raíz.
3. El lanzador instalará las dependencias y levantará el servidor en [http://localhost:3000](http://localhost:3000).
4. El indicador en la esquina superior cambiará a **NUBE CONECTADA** en color verde 🟢.

---

## 🔒 Listado Oficial de Credenciales de Acceso

Las cuentas están almacenadas de forma segura y encriptadas en la base de datos de Supabase. A continuación se detallan los accesos para pruebas:

| # | Nombre | Usuario | Contraseña | Rol/Permisos |
|---|--------|---------|------------|--------------|
| 1 | Esteban Russo | `civil` | `1234` | Ciudadano (Acceso básico) |
| 2 | Dra. Valeria Miller | `funcionario` | `gov2024` | Inspector Fiscal (Admin) |
| 3 | Marcus Sterling | `banco_maz` | `bank999` | Auditor del Banco |
| 4 | Sheriff A. Rodriguez | `admin_lssd` | `alpha123` | Administrador LSSD |
| 5 | Cmte. Ricardo Santos | `cmte_santos` | `lspd#2024` | Comandante LSPD |
| 6 | Ghost Protocol | `backdoor` | `classified` | Inteligencia (Terminal Sigma-7) |
