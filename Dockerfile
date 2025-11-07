# Stage 1: Dependencies
FROM node:24-alpine AS dependencies

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Build
FROM node:24-alpine AS builder

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
FROM node:24-alpine AS production

# Instalar dumb-init para manejo apropiado de señales
RUN apk add --no-cache dumb-init

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copiar dependencias de producción desde stage dependencies
COPY --from=dependencies --chown=nestjs:nodejs /app/node_modules ./node_modules

# Copiar código compilado desde stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copiar package.json para tener información de la app
COPY --chown=nestjs:nodejs package*.json ./

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
