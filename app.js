const { validateFull, validatePartial } = require("./utils");
const express = require('express');
const path = require('path');
const fs = require('fs'); // <-- agregado para manejo de filesystem

// --------- DB SETUP ---------
const useSandbox = process.env.USE_SANDBOX === '1' || process.env.NODE_ENV === 'test';

// Determinar ruta de DB
const dbFile = useSandbox 
  ? ':memory:' 
  : (process.env.DB_URL || path.join(__dirname, 'data', 'data.sqlite'));

// Crear carpeta si no existe (solo si no es memoria)
if (!useSandbox) {
  const dbDir = path.dirname(dbFile);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
}

const Database = require('better-sqlite3');
const db = new Database(dbFile);

db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL,
    price REAL    NOT NULL,
    stock INTEGER NOT NULL CHECK (stock >= 0)
  );
`);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ----------------- RUTAS -----------------
app.get('/items', (req, res) => {
  const rows = db.prepare('SELECT * FROM items ORDER BY id').all();
  res.json(rows);
});

app.get('/items/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Item no encontrado' });
  res.json(row);
});

app.post('/items', (req, res) => {
  const errors = validateFull(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const info = db.prepare('INSERT INTO items (name, price, stock) VALUES (?, ?, ?)').run(
    req.body.name.trim(), req.body.price, req.body.stock
  );
  const created = db.prepare('SELECT * FROM items WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.put('/items/:id', (req, res) => {
  const errors = validateFull(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const exists = db.prepare('SELECT id FROM items WHERE id = ?').get(req.params.id);
  if (!exists) return res.status(404).json({ error: 'Item no encontrado' });

  db.prepare('UPDATE items SET name = ?, price = ?, stock = ? WHERE id = ?').run(
    req.body.name.trim(), req.body.price, req.body.stock, req.params.id
  );
  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.patch('/items/:id', (req, res) => {
  const errors = validatePartial(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const current = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!current) return res.status(404).json({ error: 'Item no encontrado' });

  const next = {
    name:  ('name'  in req.body) ? req.body.name.trim() : current.name,
    price: ('price' in req.body) ? req.body.price : current.price,
    stock: ('stock' in req.body) ? req.body.stock : current.stock,
  };

  db.prepare('UPDATE items SET name = ?, price = ?, stock = ? WHERE id = ?')
    .run(next.name, next.price, next.stock, req.params.id);

  const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  res.json(updated);
});

app.delete('/items/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Item no encontrado' });
  db.prepare('DELETE FROM items WHERE id = ?').run(req.params.id);
  res.json(row);
});

app.post('/__reset', (_req, res) => {
  db.exec('DELETE FROM items; VACUUM;');
  res.json({ ok: true });
});

module.exports = app;