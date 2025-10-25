# -------- Base para build --------
FROM node:22-alpine AS build
WORKDIR /app

# Toolchain para módulos nativos (ej. better-sqlite3)
RUN apk add --no-cache python3 make g++ curl

# Copiamos package.json e instalamos dependencias
COPY package*.json ./

# Instalamos todas las dependencias dentro del contenedor
RUN npm install @sentry/node @sentry/tracing && npm ci

# Copiamos el resto del código
COPY . .

# -------- Imagen final --------
FROM node:22-alpine AS prod
WORKDIR /app

# Crear usuario no root y grupo (lo haces bien)
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

# Copiamos node_modules y app compilada desde build
COPY --from=build /app /app

# --------------------------------------------------
# 🔑 CORRECCIÓN DE PERMISOS PARA ESCRITURA DE LOGS
# --------------------------------------------------
# 1. Crear la carpeta /app/logs.
RUN mkdir -p /app/logs \
# 2. Asignar propiedad de /data y /app/logs al usuario 'nodeuser'
# Esto resuelve el error EACCES para la carpeta de logs
    && chown -R nodeuser:nodejs /app/logs \ 
    && chown -R nodeuser:nodejs /data \
# 3. Dar permisos de ejecución/escritura (777 es permisivo, 755 o 770 es mejor,
# pero 777 para /data/logs funciona si la app lo necesita).
    && chmod 777 /data

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_URL=/data/data.sqlite

# Puerto
EXPOSE 3000

# Healthcheck
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/items || exit 1

# Cambiar a usuario no root después de preparar todo
# IMPORTANTE: Cambiamos de USER node a USER nodeuser para que use el usuario que tiene permisos en /app/logs
USER nodeuser

# Comando de inicio
CMD ["node", "server.js"]