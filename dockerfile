# -------- Base común --------
FROM node:22-alpine AS base
WORKDIR /app

# -------- Dependencias (con toolchain para nativos) --------
FROM base AS deps
# better-sqlite3 (u otros nativos) necesitan toolchain
RUN apk add --no-cache python3 make g++
COPY package*.json ./
# Usá npm ci para builds reproducibles
RUN npm ci

# -------- Tester (opcional: corre Jest en build) --------
FROM deps AS tester
COPY . .
# DB en memoria para tests
ENV NODE_ENV=test
ENV USE_SANDBOX=1
# Si querés fallar el build si fallan los tests, descomentá:
RUN npm test

# -------- Build para producción (remueve devDeps) --------
FROM deps AS build
COPY . .
# quedate sólo con deps de prod
RUN npm prune --omit=dev

# -------- Imagen final (runtime) --------
FROM node:22-alpine AS prod
# Usuario no root
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
WORKDIR /app

# Copiamos app + node_modules de build
COPY --from=build /app /app

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000
# Guardamos la base fuera del árbol de la app
ENV DB_URL=/data/data.sqlite

# Puerto y volumen para la DB
EXPOSE 3000
VOLUME ["/data"]

# Healthcheck simple
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/items || exit 1

USER nodeuser
CMD ["node", "index.js"]
