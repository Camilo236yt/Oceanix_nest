import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../redis/redis.service';
import type { CacheOptions } from '../interfaces';
import { Reflector } from '@nestjs/core';
import * as crypto from 'crypto';

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
    const cacheKey = this.generateCacheKey(request, cacheOptions);

    console.log(`🗄️  Cache key: ${cacheKey}`);

    // Intentar obtener del cache
    const cached = await this.redisService.get(cacheKey);
    if (cached) {
      console.log(`✅ Cache HIT for key: ${cacheKey}`);
      console.log(`📦 Cached data:`, JSON.stringify(cached).substring(0, 200));
      return new Observable((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    console.log(`❌ Cache MISS for key: ${cacheKey}`);

    // Si no está en cache, continuar con el handler y guardar resultado
    return next.handle().pipe(
      tap(async (data) => {
        console.log(`💾 Saving to cache key: ${cacheKey}`);
        console.log(`📊 Data to cache (length: ${Array.isArray(data) ? data.length : 'not array'}):`, JSON.stringify(data).substring(0, 200));
        await this.redisService.set(cacheKey, data, cacheOptions.ttl || 600);
        console.log(`✅ Data saved to cache successfully`);
      }),
    );
  }

  /**
   * Genera una clave de cache basada en las opciones y la request
   */
  private generateCacheKey(request: any, options: CacheOptions): string {
    const { keyPrefix, includeParams = true, includeBody = false, customKeyGenerator } = options;

    // Si hay un generador custom, usarlo
    if (customKeyGenerator) {
      return this.redisService.generateKey(keyPrefix, customKeyGenerator(request));
    }

    let key = request.path;

    // Incluir query params si está habilitado
    if (includeParams && request.query && Object.keys(request.query).length > 0) {
      const params = Object.keys(request.query)
        .sort()
        .map(k => `${k}=${request.query[k]}`)
        .join('&');
      key = `${key}?${params}`;
    }

    // Incluir body en hash si está habilitado
    if (includeBody && request.body) {
      const bodyHash = crypto.createHash('md5').update(JSON.stringify(request.body)).digest('hex');
      key = `${key}#${bodyHash}`;
    }

    return this.redisService.generateKey(keyPrefix, key);
  }
}

/**
 * Interceptor alternativo para cachear con opciones inline
 */
@Injectable()
export class CacheKeyBuilderInterceptor implements NestInterceptor {
  constructor(private options: CacheOptions & {}, private redisService: RedisService) {}

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
      tap(async (data) => {
        await this.redisService.set(cacheKey, data, this.options.ttl);
      }),
    );
  }
}
