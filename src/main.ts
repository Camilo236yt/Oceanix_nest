import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';

import { AppModule } from './app.module';
import { SubdomainMiddleware } from './common/middleware';
import { getCorsConfig, setupSwagger, swaggerBasicAuth } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload size limits for file uploads (50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors(getCorsConfig());
  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use('/api/v1/docs', swaggerBasicAuth());
  setupSwagger(app);

  app.use(cookieParser());
  app.use(new SubdomainMiddleware().use);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
