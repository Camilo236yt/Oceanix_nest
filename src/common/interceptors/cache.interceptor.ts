import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RedisService } from '../../redis/redis.service';
import { CacheOptions } from '../interfaces';
import { Reflector } from '@nestjs/core';

/**
 * Interceptor base para cachear respuestas
 * Se usa con el decorador @Cached()
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(private redisService: RedisService, private reflector: Reflector) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Obtener opciones de cache del metadata del decorador
    const cacheOptions = this.reflector.get<CacheOptions>('cache_options', context.getHandler());

    // Si no hay opciones de cache, no hacer nada
    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const cacheKey = this.redisService.generateKey(cacheOptions.keyPrefix, request.url);

    // Intentar obtener del cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    // Si no está en cache, continuar con el handler y guardar resultado
    return next.handle().pipe(
      map(async (data) => {
        await this.redisService.set(cacheKey, data, cacheOptions.ttl);
        return data;
      }),
    );
  }
}

/**
 * Interceptor alternativo para cachear con opciones inline
 */
@Injectable()
export class CacheKeyBuilderInterceptor implements NestInterceptor {
  constructor(private options: CacheOptions, private redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const cacheKey = this.redisService.generateKey(this.options.keyPrefix, request.url);

    // Intentar obtener del cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    // Si no está en cache, continuar con el handler y guardar resultado
    return next.handle().pipe(
      map(async (data) => {
        await this.redisService.set(cacheKey, data, this.options.ttl);
        return data;
      }),
    );
  }
}
