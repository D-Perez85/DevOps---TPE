# =========================
# Stage 1 — Dependencies
# =========================
FROM node:22-alpine AS deps

WORKDIR /app

# Toolchain para módulos nativos (better-sqlite3, etc.)
RUN apk add --no-cache python3 make g++

# Copiamos manifests
COPY package*.json ./

# Instalamos SOLO dependencias de producción
RUN npm ci --only=production


# =========================
# Stage 2 — Runtime
# =========================
FROM node:22-alpine

WORKDIR /app

# Crear usuario no-root
RUN addgroup -S nodejs \
 && adduser -S nodeuser -G nodejs

# Copiamos node_modules y código
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Crear carpetas necesarias y permisos
RUN mkdir -p /app/logs /data \
 && chown -R nodeuser:nodejs /app /data \
 && chmod 700 /data

# Variables de entorno (NO secretos)
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_URL=/data/data.sqlite

# Puerto expuesto
EXPOSE 3000

# Healthcheck
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/items || exit 1

# Usuario no-root
USER nodeuser

# Start
CMD ["node", "server.js"]
