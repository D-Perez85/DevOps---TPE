require("dotenv").config();
const { app } = require("./app");
const path = require("path");
const fs = require("fs");
const winston = require("winston");
const Sentry = require("@sentry/node");

const PORT = process.env.PORT || 3000;

const logDir = path.join(__dirname, "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(), // logs en consola (Render los captura)
    new winston.transports.File({ filename: path.join(logDir, "error.log"), level: "error" }),
    new winston.transports.File({ filename: path.join(logDir, "combined.log") }),
  ],
});

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    release: process.env.SENTRY_RELEASE || "local-dev",
  });
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
  logger.info("Sentry activado con DSN definido");
} else {
  logger.info("Sentry no activado (SENTRY_DSN no definido)");
}

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

    // ---- Logs de prueba para Render ----
    logger.info("=== LOG DE PRUEBA EN RENDER ===");
    logger.error("=== ERROR DE PRUEBA EN RENDER ===");
  });
}

module.exports = { app, logger };
