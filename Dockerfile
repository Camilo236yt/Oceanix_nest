# Stage 1: Dependencies
FROM node:24-slim AS dependencies

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:24-slim AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies)
RUN npm ci

# Copiar archivos de configuración necesarios para el build
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Copiar código fuente
COPY src ./src

# Construir la aplicación
RUN npm run build

# Stage 3: Production
FROM node:24-slim AS production

# Instalar dependencias del sistema necesarias para Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    dumb-init \
    chromium \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Configurar Puppeteer para usar el Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Crear usuario no-root para seguridad
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs nestjs

WORKDIR /app

# Copiar dependencias de producción desde stage dependencies
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar código compilado desde stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copiar package.json para tener información de la app
COPY --chown=nestjs:nodejs package*.json ./

# Crear directorio para WhatsApp con permisos correctos
RUN mkdir -p /app/.wwebjs_auth && chown -R nestjs:nodejs /app/.wwebjs_auth

# Declarar volumen para persistencia de sesión de WhatsApp
VOLUME ["/app/.wwebjs_auth"]

# Cambiar a usuario no-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Configurar variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=3000

# Usar dumb-init para manejar señales correctamente
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar la aplicación
CMD ["node", "dist/main"]
