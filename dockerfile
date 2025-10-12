# Base para build
FROM node:22-alpine AS build
WORKDIR /app

# Toolchain para módulos nativos
RUN apk add --no-cache python3 make g++ curl

# Copiamos package.json e instalamos dependencias
COPY package*.json ./

# Instalamos todas las dependencias dentro del contenedor
RUN npm ci

# Copiamos el resto del código
COPY . .

# Si tenés devDependencies necesarias para build o tests, podés usar:
# RUN npm prune --omit=dev

# -------- Imagen final --------
FROM node:22-alpine AS prod
WORKDIR /app

# Usuario no root
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

# Copiamos node_modules y app compilada desde build
COPY --from=build /app /app

# Variables de entorno
ENV NODE_ENV=production
ENV PORT=3000
ENV DB_URL=/data/data.sqlite

# Puerto y volumen
EXPOSE 3000
VOLUME ["/data"]

# Healthcheck
RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/items || exit 1

USER node
CMD ["node", "server.js"]
