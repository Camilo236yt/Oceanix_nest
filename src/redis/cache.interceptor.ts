import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from './redis.service';
import { CACHE_KEY_METADATA } from './cache.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const cacheMetadata = this.reflector.get(CACHE_KEY_METADATA, context.getHandler());
    
    if (!cacheMetadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { key: baseKey, ttl } = cacheMetadata;
    
    const cacheKey = this.generateCacheKey(baseKey, request);
    
    const cachedResult = await this.redisService.get(cacheKey);
    if (cachedResult) {
      return of(cachedResult);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.redisService.set(cacheKey, response, ttl);
      }),
    );
  }

  private generateCacheKey(baseKey: string, request: any): string {
    const queryParams = request.query || {};
    const params = request.params || {};
    
    const keyParts = [baseKey];
    
    Object.keys(params).forEach(key => {
      keyParts.push(`${key}-${params[key]}`);
    });
    
    Object.keys(queryParams).forEach(key => {
      keyParts.push(`${key}-${queryParams[key]}`);
    });
    
    return this.redisService.generateKey(...keyParts);
  }
}