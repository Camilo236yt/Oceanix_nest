# Oceanix (Backend) - NestJS

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>

Backend desarrollado con NestJS para el proyecto Oceanix.

## Descripción

Este repositorio contiene la API backend construida con NestJS y TypeScript. Provee los endpoints y la lógica de negocio necesarios para la aplicación Oceanix.

## Requisitos

- Node.js >= 16 (recomendado LTS)
- npm (v6/7/8+) o pnpm/yarn

Revisa `package.json` para ver scripts y dependencias.

## Instalación

1. Clona el repositorio (si aún no lo has hecho):

```powershell
git clone https://github.com/Camilo236yt/Oceanix_nest.git
cd oceanix_b
```

2. Instala dependencias:

```powershell
npm install
# o usando pnpm
# pnpm install
```

3. Crea un archivo de variables de entorno (ej. `.env`) basado en `.env.example` si existe, o añade las variables necesarias.

## Variables de entorno

El proyecto puede depender de variables como:

- PORT - puerto en el que corre la API (por defecto 3000)
- DATABASE_URL / DB_HOST / DB_USER / DB_PASS - configuración de la base de datos
- JWT_SECRET - secret para tokens JWT

Ejemplo mínimo en `.env`:

```text
PORT=3000
JWT_SECRET=tu_secreto_aqui
# DATABASE_URL=postgres://user:pass@localhost:5432/dbname
```

## Ejecutar en desarrollo

Arranca la aplicación en modo desarrollo (hot-reload):

```powershell
npm run start:dev
```

Scripts útiles (definidos en `package.json`):

- `start` - inicia la app en producción
- `start:dev` - modo desarrollo con watch
- `build` - compila TypeScript a JavaScript
- `test` - ejecuta tests unitarios
- `test:e2e` - ejecuta tests e2e
- `lint` - corre linter

## Build y producción

Compila el proyecto:

```powershell
npm run build
```

Inicia la versión compilada (suponiendo que uses `dist/main.js`):

```powershell
npm run start:prod
```

## Tests

Ejecuta tests unitarios:

```powershell
npm run test
```

Ejecuta tests e2e (si existen):

```powershell
npm run test:e2e
```

## Estructura del proyecto

Estructura principal esperada:

- `src/` - código fuente (módulos de Nest, controladores, servicios)
- `test/` - pruebas e2e
- `tsconfig.json` / `tsconfig.build.json` - configuración TypeScript
- `package.json` - scripts y dependencias

Ejemplo de archivos principales ya presentes:

- `src/main.ts` - punto de entrada
- `src/app.module.ts` - módulo raíz

## Contribuir

1. Crea una rama feature/bugfix basada en `main`.
2. Abre un pull request con una descripción clara de los cambios.
3. Asegúrate de que los tests pasan y de mantener el código formateado según las reglas del proyecto.

## Licencia

Indica la licencia del proyecto aquí (por ejemplo MIT). Si aún no has decidido, añade un archivo `LICENSE` o actualiza esta sección.

## Contacto

Para dudas o soporte, contacta al mantenedor del repo (Camilo236yt) o abre un issue en GitHub.

---

Si quieres, puedo:

- Añadir un ejemplo mínimo de `.env.example`.
- Añadir secciones específicas para la base de datos (migrations, ORM).
- Generar un script de inicio/dockerfile.

Dime cuál de estas mejoras quieres y lo implemento.


