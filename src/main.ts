import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { SubdomainMiddleware } from './common/middleware';
import { getCorsConfig, setupSwagger, swaggerBasicAuth } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable default body parser
  });

  // Manually configure body parsers with size limits and multipart handling
  app.use((req, res, next) => {
    // Skip body parsing for multipart/form-data (let Multer handle it)
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      return next();
    }

    // Parse JSON and URL-encoded bodies with 50MB limit
    const jsonParser = json({ limit: '50mb' });
    const urlencodedParser = urlencoded({ extended: true, limit: '50mb' });

    if (req.headers['content-type']?.includes('application/json')) {
      return jsonParser(req, res, next);
    }
    if (req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
      return urlencodedParser(req, res, next);
    }

    next();
  });

  app.enableCors(getCorsConfig());
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      // Skip validation for multipart/form-data to allow Multer to process it first
      skipMissingProperties: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use('/api/v1/docs', swaggerBasicAuth());
  setupSwagger(app);

  app.use(cookieParser());
  app.use(new SubdomainMiddleware().use);

  // Configurar timeouts para el servidor HTTP
  // Importante para subida de archivos grandes (imágenes pesadas)
  const server = await app.listen(process.env.PORT ?? 3000);

  // Timeout de 10 minutos para requests (suficiente para subir múltiples imágenes de 5MB)
  // Por defecto Node.js tiene 2 minutos, que puede ser insuficiente en conexiones lentas
  server.setTimeout(600000); // 10 minutos en milisegundos

  console.log(`🚀 Server running on port ${process.env.PORT ?? 3000}`);
  console.log(`⏱️  HTTP request timeout: 10 minutes`);
}

bootstrap();
