import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters';
import { CacheInterceptor } from './common/interceptors';
import { RedisService } from './redis/redis.service';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Registrar filtro global de excepciones
  app.useGlobalFilters(new HttpExceptionFilter());

  // Registrar interceptor de cache global
  const reflector = app.get(Reflector);
  const redisService = app.get(RedisService);
  app.useGlobalInterceptors(new CacheInterceptor(redisService, reflector));

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
