import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { CacheInterceptor, ResponseInterceptor } from './common/interceptors';
import { RedisService } from './redis/redis.service';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
