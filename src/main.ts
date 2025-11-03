import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { CacheInterceptor, ResponseInterceptor } from './common/interceptors';
import { RedisService } from './redis/redis.service';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
const expressBasicAuth = require('express-basic-auth');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Oceanix API')
    .setDescription('Multi-tenant SaaS helpdesk system API')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('authToken')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  // Proteger Swagger con autenticación básica
  app.use(
    '/api/v1/docs',
    expressBasicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER || 'admin']: process.env.SWAGGER_PASSWORD || 'admin123',
      },
    }),
  );

  SwaggerModule.setup('api/v1/docs', app, document);

  // Registrar filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Registrar interceptores globales (orden importante)
  const reflector = app.get(Reflector);
  const redisService = app.get(RedisService);

  // ResponseInterceptor primero (envuelve respuestas exitosas)
  app.useGlobalInterceptors(new ResponseInterceptor());

  // CacheInterceptor después (cachea respuestas envueltas)
  app.useGlobalInterceptors(new CacheInterceptor(redisService, reflector));

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
