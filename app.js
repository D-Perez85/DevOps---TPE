require("dotenv").config();
const { validateFull } = require("./utils");
const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const Sentry = require("@sentry/node");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ----------------- CONFIGURACIÓN DE BASE DE DATOS -----------------
const useSandbox =
  process.env.USE_SANDBOX === "1" || process.env.NODE_ENV === "test";

function getDbFile(useSandbox = false) {
  return useSandbox
    ? ":memory:"
    : process.env.DB_URL || path.join(__dirname, "data", "data.sqlite");
}

function initDatabase(useSandbox = false) {
  const dbFile = getDbFile(useSandbox);
  if (!useSandbox) {
    const dbDir = path.dirname(dbFile);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new Database(dbFile);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name  TEXT    NOT NULL,
      price REAL    NOT NULL,
      stock INTEGER NOT NULL CHECK (stock >= 0)
    );
  `);
  return db;
}

const db = initDatabase(useSandbox);

// ----------------- CONFIGURACIÓN DE SENTRY -----------------
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

// ----------------- RUTAS -----------------
app.get("/items", (req, res) => {
  const rows = db.prepare("SELECT * FROM items ORDER BY id").all();
  res.json(rows);
});

app.post("/items", (req, res) => {
  const errors = validateFull(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const info = db
    .prepare("INSERT INTO items (name, price, stock) VALUES (?, ?, ?)")
    .run(req.body.name.trim(), req.body.price, req.body.stock);
  const created = db
    .prepare("SELECT * FROM items WHERE id = ?")
    .get(info.lastInsertRowid);
  res.status(201).json(created);
});

app.delete("/items/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Item no encontrado" });
  db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
  res.json(row);
});

app.post("/__reset", (_req, res) => {
  db.exec("DELETE FROM items; VACUUM;");
  res.json({ ok: true });
});

// Ruta para probar Sentry
app.get("/debug-sentry", (req, res) => {
  try {
    throw new Error("Error de prueba: comprobando integración con Sentry");
  } catch (err) {
    Sentry.captureException(err);
    res.status(500).send("Error enviado a Sentry");
  }
});

// ----------------- MANEJO DE ERRORES -----------------
app.use((err, req, res, next) => {
  console.error("Error capturado:", err.message);
  Sentry.captureException(err); // enviar a Sentry
  res.status(500).send("Ocurrió un error interno.");
});

module.exports = { app, initDatabase, getDbFile };
