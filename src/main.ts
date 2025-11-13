import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SubdomainMiddleware } from './common/middleware';
import { CookieDebugMiddleware } from './common/middleware/cookie-debug.middleware';
import { setupSwagger, swaggerBasicAuth, getCorsConfig } from './config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS para multi-tenancy
  app.enableCors(getCorsConfig());

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Proteger Swagger con autenticación básica
  app.use('/api/v1/docs', swaggerBasicAuth());

  // Configurar Swagger
  setupSwagger(app);

  // Middleware global
  app.use(cookieParser());

  // 🔍 DEBUG: Middleware de debugging para cookies (solo en desarrollo/testing)
  if (process.env.DEBUG_COOKIES === 'true') {
    console.log('🔍 Cookie Debug Middleware ACTIVADO');
    app.use(new CookieDebugMiddleware().use);
  }

  // Registrar middleware de subdomain para multi-tenancy
  app.use(new SubdomainMiddleware().use);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
