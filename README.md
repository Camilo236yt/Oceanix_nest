# Oceanix - Sistema Multi-Tenant de Help Desk

## Descripción

Oceanix es un sistema de help desk multi-tenant desarrollado con NestJS, diseñado para gestionar tickets de soporte técnico con separación completa entre empresas (tenants). Incluye funcionalidades de gestión de usuarios, roles, permisos, almacenamiento de archivos y autenticación JWT.

## Características Principales

- **Multi-tenancy**: Separación completa de datos entre empresas
- **Autenticación JWT**: Sistema seguro de autenticación basado en tokens
- **Sistema de Roles y Permisos**: Control granular de acceso
- **Almacenamiento con MinIO**: Sistema S3-compatible para gestión de archivos
- **Base de datos PostgreSQL**: Con Row Level Security (RLS) para multi-tenancy
- **Cache con Redis**: Para optimización de rendimiento
- **API RESTful**: Con documentación Swagger automática

## Stack Tecnológico

- **Framework**: NestJS con TypeScript
- **Base de datos**: PostgreSQL 15
- **Cache**: Redis
- **Almacenamiento**: MinIO (S3-compatible)
- **ORM**: TypeORM
- **Autenticación**: JWT con Passport.js
- **Documentación**: Swagger/OpenAPI
- **Contenedores**: Docker y Docker Compose

## Requisitos Previos

- Node.js >= 18.x LTS
- Docker y Docker Compose
- npm o yarn

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Camilo236yt/Oceanix_nest.git
cd Oceanix_nest
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y configura tus variables:

```bash
cp .env.example .env
```

Edita `.env` con tu configuración:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=oceanix_db
DATABASE_USER=oceanix_user
DATABASE_PASSWORD=tu_password_segura

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=tu_jwt_secret_super_seguro
JWT_EXPIRATION=24h

# App Configuration
NODE_ENV=development
APP_PORT=3000

# Swagger Configuration
SWAGGER_USER=admin
SWAGGER_PASSWORD=admin123

# MinIO Configuration
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio_admin
MINIO_SECRET_KEY=minio_password_seguro
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=oceanix-uploads
```

### 4. Levantar servicios con Docker

```bash
# Levantar PostgreSQL, Redis y MinIO
docker-compose up -d

# Verificar que los servicios estén corriendo
docker-compose ps
```

### 5. Ejecutar migraciones (si existen)

```bash
npm run migration:run
```

## Desarrollo

### Ejecutar en modo desarrollo

```bash
npm run start:dev
```

La API estará disponible en: `http://localhost:3000`

### Documentación Swagger

Accede a la documentación interactiva en: `http://localhost:3000/api`
- Usuario: admin
- Contraseña: admin123

### MinIO Console

Accede a la consola de MinIO en: `http://localhost:9001`
- Usuario: minio_admin
- Contraseña: minio_password_dev

## Estructura del Proyecto

```
src/
├── auth/              # Módulo de autenticación JWT
│   ├── guards/        # Guards de autenticación y autorización
│   ├── strategy/      # Estrategias de Passport
│   └── interfaces/    # Interfaces JWT
├── enterprise/        # Módulo de gestión de empresas (tenants)
│   ├── entities/      # Entidades de empresa
│   ├── dto/           # DTOs de empresa
│   └── constants/     # Constantes (tipos de identificación empresarial)
├── users/             # Módulo de gestión de usuarios
│   ├── entities/      # Entidades de usuario
│   ├── dto/           # DTOs de usuario
│   └── constants/     # Constantes (tipos de identificación personal)
├── roles/             # Módulo de gestión de roles
│   ├── entities/      # Entidades de roles
│   ├── dto/           # DTOs de roles
│   └── constants/     # Constantes de roles predefinidos
├── permissions/       # Módulo de permisos
├── storage/           # Módulo de almacenamiento con MinIO
│   ├── config/        # Configuración de MinIO y S3
│   ├── storage.service.ts    # Servicio de almacenamiento
│   └── storage.controller.ts # Endpoints de almacenamiento
└── common/            # Utilidades y código compartido

```

## API Endpoints Principales

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/register-enterprise` - Registrar nueva empresa con admin
- `GET /auth/profile` - Obtener perfil del usuario autenticado

### Almacenamiento (Storage)
- `POST /storage/upload` - Subir archivo único
- `POST /storage/upload-multiple` - Subir múltiples archivos
- `POST /storage/upload-avatar` - Subir avatar de usuario
- `GET /storage/file/:bucket/:key` - Obtener archivo
- `GET /storage/signed-url/:bucket/:key` - Obtener URL firmada temporal
- `GET /storage/list/:bucket` - Listar archivos en bucket
- `DELETE /storage/file/:bucket/:key` - Eliminar archivo

### Usuarios
- `GET /users` - Listar usuarios (con filtros de tenant)
- `GET /users/:id` - Obtener usuario por ID
- `POST /users` - Crear usuario
- `PATCH /users/:id` - Actualizar usuario
- `DELETE /users/:id` - Eliminar usuario

### Empresas
- `GET /enterprises` - Listar empresas
- `GET /enterprises/:id` - Obtener empresa por ID
- `POST /enterprises` - Crear empresa
- `PATCH /enterprises/:id` - Actualizar empresa
- `DELETE /enterprises/:id` - Eliminar empresa

## Características de Seguridad

### Tipos de Identificación Separados
El sistema usa enums separados para evitar vulnerabilidades:
- **PersonalIdentificationType**: Para personas (CC, CE, TI, PASSPORT, DNI)
- **BusinessIdentificationType**: Para empresas (NIT, RUC, RUT, CUIT)

### Multi-tenancy
- Cada empresa tiene su propio espacio aislado
- Los usuarios están asociados a una empresa específica
- Row Level Security (RLS) en PostgreSQL para aislamiento de datos

### Almacenamiento Seguro
- Buckets separados por tipo de contenido
- URLs firmadas para acceso temporal
- Validación de tipos y tamaños de archivo

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev       # Ejecutar en modo desarrollo con hot-reload
npm run start:debug     # Ejecutar en modo debug

# Construcción
npm run build          # Compilar para producción

# Testing
npm run test           # Ejecutar tests unitarios
npm run test:e2e       # Ejecutar tests end-to-end
npm run test:cov       # Ejecutar tests con cobertura

# Linting y formato
npm run lint           # Ejecutar ESLint
npm run format         # Formatear código con Prettier

# Base de datos
npm run migration:generate -- -n NombreMigracion  # Generar migracion
npm run migration:run                              # Ejecutar migraciones
npm run migration:revert                           # Revertir última migración
```

## Docker Compose Services

El proyecto incluye los siguientes servicios:

```yaml
# PostgreSQL 15
postgres:
  ports: 5432:5432

# Redis
redis:
  ports: 6379:6379

# MinIO (S3-compatible)
minio:
  ports:
    - 9000:9000  # API
    - 9001:9001  # Console
```

## Solución de Problemas Comunes

### Error de conexión a PostgreSQL
- Verifica que Docker esté ejecutándose: `docker ps`
- Verifica las credenciales en `.env`
- Asegúrate de que el puerto 5432 no esté en uso

### Error de conexión a MinIO
- Verifica que MinIO esté corriendo: `docker-compose ps`
- Accede a la consola en http://localhost:9001
- Verifica las credenciales de MinIO en `.env`

### Error de TypeScript
- Ejecuta `npm run build` para verificar errores de compilación
- Asegúrate de tener la versión correcta de Node.js

## Contribución

1. Fork el proyecto
2. Crea tu Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al Branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## Contacto

Para dudas o soporte, contacta al mantenedor del repo o abre un issue en GitHub.

---

**Desarrollado con NestJS** - Un framework progresivo de Node.js para construir aplicaciones del lado del servidor eficientes y escalables.