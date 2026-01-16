require("dotenv").config();
const { validateFull, validatePartial } = require("./utils");
const express = require("express");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const Sentry = require("@sentry/node");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ----------------- CONFIGURACIÓN DE SENTRY -----------------
// NOTA: Sentry.init se realiza en server.js para evitar doble inicialización.
// Aquí solo activamos los handlers necesarios para las rutas.
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

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
            name    TEXT      NOT NULL,
            price REAL      NOT NULL,
            stock INTEGER NOT NULL CHECK (stock >= 0)
        );
    `);
    return db;
}

const db = initDatabase(useSandbox);

// ----------------- RUTAS -----------------
app.get("/items", (req, res) => {
    const rows = db.prepare("SELECT * FROM items ORDER BY id").all();
    res.json(rows);
});

app.get("/items/:id", (req, res) => { 
    const row = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ error: "Item no encontrado" });
    res.json(row);
});

app.post("/items", (req, res, next) => {
    try {
        const errors = validateFull(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const info = db
            .prepare("INSERT INTO items (name, price, stock) VALUES (?, ?, ?)")
            .run(req.body.name.trim(), req.body.price, req.body.stock);

        const created = db
            .prepare("SELECT * FROM items WHERE id = ?")
            .get(info.lastInsertRowid);

        res.status(201).json(created);
    } catch (err) {
        next(err); 
    }
});

app.patch("/items/:id", (req, res, next) => {
    try {
        const item = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
        if (!item) return res.status(404).json({ error: "Item no encontrado" });

        const errors = validatePartial(req.body);
        if (errors.length) return res.status(400).json({ errors });

        let updateFields = [];
        let updateValues = [];

        if (req.body.name !== undefined) {
            updateFields.push("name = ?");
            updateValues.push(req.body.name.trim());
        }
        if (req.body.price !== undefined) {
            updateFields.push("price = ?");
            updateValues.push(req.body.price);
        }
        if (req.body.stock !== undefined) {
            updateFields.push("stock = ?");
            updateValues.push(req.body.stock);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({ error: "No se proporcionaron campos para actualizar." });
        }

        const query = `UPDATE items SET ${updateFields.join(", ")} WHERE id = ?`;
        updateValues.push(req.params.id);

        db.prepare(query).run(...updateValues);
        
        const updated = db.prepare("SELECT * FROM items WHERE id = ?").get(req.params.id);
        res.json(updated);

    } catch (err) {
        next(err);
    }
});

app.delete("/items/:id", (req, res, next) => {
    try {
        const row = db
            .prepare("SELECT * FROM items WHERE id = ?")
            .get(req.params.id);
        if (!row) return res.status(404).json({ error: "Item no encontrado" });

        db.prepare("DELETE FROM items WHERE id = ?").run(req.params.id);
        res.json(row);
    } catch (err) {
        next(err);
    }
});

app.post("/__reset", (_req, res, next) => {
    try {
        db.exec("DELETE FROM items; VACUUM;");
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
});

// ----------------- ENDPOINT DE HEALTH CHECK -----------------
app.get("/health", (req, res) => {
    try {
        const check = db.prepare("SELECT 1").get();
        res.status(200).json({
            status: "ok",
            database: check ? "connected" : "error",
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// ----------------- ENDPOINT DE TEST c/ SENTRY -----------------
app.get("/test-error", (req, res, next) => {
    try {
        throw new Error("Error generado manualmente desde /test-error");
    } catch (err) {
        next(err);
    }
});

// ----------------- DESCOMENTAR p/ FORZAR UN ERROR REAL OPCIONAL  -----------------
// if (process.env.FORZAR_ERROR === "1") {
//   setTimeout(() => {
//     throw new Error("Error simulado para comprobar integración Sentry (inicio)");
//   }, 2000);
// }

module.exports = { app, initDatabase, getDbFile };

