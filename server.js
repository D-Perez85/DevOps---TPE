
require("dotenv").config();
const { app } = require("./app"); 
const path = require("path");
const fs = require("fs");
const winston = require("winston");
const Sentry = require("@sentry/node");

// ----------------- CONFIGURACIÓN DE LOGGING -----------------
const PORT = process.env.PORT || 3000;

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console(), 
        new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
        new winston.transports.File({ filename: path.join(logDir, "combined.log") }),
    ],
});

// ----------------- INICIALIZACIÓN DE SENTRY Y HANDLERS (SOLUCIÓN AL FALLO) -----------------
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
    });
    
    app.use(Sentry.Handlers.errorHandler()); 
    
    logger.info("Sentry activado con DSN definido");
} else {
    logger.info("Sentry no activado (SENTRY_DSN no definido)");
}

// ----------------- MIDDLEWARE FINAL DE ERRORES DE EXPRESS -----------------
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err); 
    }
    
    logger.error("Error capturado:", err.message);
    
    if (process.env.SENTRY_DSN) {
        if (!err.sentry_id) {
             Sentry.captureException(err); 
        }
    }
    
    res.status(500).send("Ocurrió un error interno.");
});

// ---- Captura de errores no manejados ----
process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// ---- Arranque del servidor ----
if (require.main === module) {
    logger.info(`Servidor arrancando en puerto ${PORT}...`);
    app.listen(PORT, () => {
        logger.info(`Servidor corriendo en http://localhost:${PORT}`);

        logger.info("=== LOG DE PRUEBA EN RENDER ===");
        logger.error("=== ERROR DE PRUEBA EN RENDER ===");
    });
}

module.exports = { app, logger };