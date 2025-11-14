import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';
import expressBasicAuth = require('express-basic-auth');

/**
 * Configuración de Swagger para la documentación de la API
 */
export function setupSwagger(app: INestApplication): void {
  // Configuración del documento Swagger
  const config = new DocumentBuilder()
    .setTitle('Oceanix API')
    .setDescription('Multi-tenant SaaS helpdesk system API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('authToken')
    .addGlobalParameters({
      name: 'X-Subdomain',
      in: 'header',
      required: true,
      schema: {
        type: 'string',
        example: 'techcorp',
        description: 'Enterprise subdomain for multi-tenant isolation'
      }
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Setup del endpoint de Swagger
  SwaggerModule.setup('api/v1/docs', app, document);
}

/**
 * Middleware de autenticación básica para proteger Swagger
 * Usa las credenciales configuradas en variables de entorno
 */
export const swaggerBasicAuth = () => {
  return expressBasicAuth({
    challenge: true,
    users: {
      [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'admin123',
    },
  });
};