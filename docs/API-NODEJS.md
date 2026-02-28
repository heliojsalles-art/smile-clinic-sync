# API Node.js para o Servidor ganesha.vip

## Pré-requisitos
- Node.js 18+
- MySQL / MariaDB
- npm install express mysql2 cors

## 1. Criar o banco de dados

```sql
CREATE DATABASE IF NOT EXISTS clinic_app;
USE clinic_app;

CREATE TABLE clinic_data (
  id INT PRIMARY KEY DEFAULT 1,
  patients JSON NOT NULL,
  appointments JSON NOT NULL,
  templates JSON NOT NULL,
  settings JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserir registro inicial
INSERT INTO clinic_data (id, patients, appointments, templates, settings)
VALUES (1, '[]', '[]', '{}', '{}');
```

## 2. Código da API (server.js)

```javascript
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configuração do banco — ajuste conforme seu servidor
const pool = mysql.createPool({
  host: 'localhost',
  user: 'SEU_USUARIO',
  password: 'SUA_SENHA',
  database: 'clinic_app',
  waitForConnections: true,
  connectionLimit: 10,
});

// GET - Baixar dados
app.get('/api/clinic/sync', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT patients, appointments, templates, settings FROM clinic_data WHERE id = 1');
    if (rows.length === 0) {
      return res.json({ patients: [], appointments: [], templates: {}, settings: {} });
    }
    const row = rows[0];
    res.json({
      patients: typeof row.patients === 'string' ? JSON.parse(row.patients) : row.patients,
      appointments: typeof row.appointments === 'string' ? JSON.parse(row.appointments) : row.appointments,
      templates: typeof row.templates === 'string' ? JSON.parse(row.templates) : row.templates,
      settings: typeof row.settings === 'string' ? JSON.parse(row.settings) : row.settings,
    });
  } catch (err) {
    console.error('GET /api/clinic/sync error:', err);
    res.status(500).json({ error: 'Erro ao ler dados' });
  }
});

// POST - Enviar/salvar dados
app.post('/api/clinic/sync', async (req, res) => {
  try {
    const { patients, appointments, templates, settings } = req.body;
    await pool.query(
      `INSERT INTO clinic_data (id, patients, appointments, templates, settings)
       VALUES (1, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         patients = VALUES(patients),
         appointments = VALUES(appointments),
         templates = VALUES(templates),
         settings = VALUES(settings)`,
      [
        JSON.stringify(patients || []),
        JSON.stringify(appointments || []),
        JSON.stringify(templates || {}),
        JSON.stringify(settings || {}),
      ]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('POST /api/clinic/sync error:', err);
    res.status(500).json({ error: 'Erro ao salvar dados' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
```

## 3. Instalar dependências e rodar

```bash
npm init -y
npm install express mysql2 cors
node server.js
```

## 4. Configurar no Nginx (se usar proxy reverso)

```nginx
location /api/clinic/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Assim as requisições para `https://www.ganesha.vip/api/clinic/sync` serão direcionadas para o Node.js.
