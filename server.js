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

// ----------------- INICIALIZACIÓN DE SENTRY -----------------
if (process.env.SENTRY_DSN) {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
        // Fusión: Agregamos la línea de release que venía de tu rama feature
        release: process.env.SENTRY_RELEASE || "local-dev",
    });

    // Handlers de Sentry para requests y errores
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.errorHandler());

    // Fusión: Usamos el log más detallado de master
    logger.info(`Sentry activado (DSN detectado: ${process.env.SENTRY_DSN.slice(0, 20)}...)`);
} else {
    logger.warn("Sentry no activado (variable SENTRY_DSN no definida)");
}

// ----------------- RUTA DE PRUEBA LOCAL PARA SENTRY -----------------
app.get("/error-test", (req, res) => {
    throw new Error("Error de prueba manual para Sentry");
});

// ----------------- MIDDLEWARE FINAL DE ERRORES -----------------
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

// ----------------- CAPTURA DE ERRORES NO MANEJADOS -----------------
process.on("uncaughtException", (err) => {
    logger.error("Uncaught Exception:", err);
    if (process.env.SENTRY_DSN) Sentry.captureException(err);
});

process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    if (process.env.SENTRY_DSN) Sentry.captureException(reason);
});

// ----------------- ARRANQUE DEL SERVIDOR -----------------
if (require.main === module) {
    logger.info(`Servidor arrancando en puerto ${PORT}...`);
    app.listen(PORT, () => {
        logger.info(`Servidor corriendo en http://localhost:${PORT}`);

        logger.info("=== LOG DE PRUEBA LOCAL ===");
        logger.error("=== ERROR DE PRUEBA LOCAL ===");
    });
}

module.exports = { app, logger };