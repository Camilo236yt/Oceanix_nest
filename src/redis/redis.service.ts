import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: null,
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err.message);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  /**
   * Genera una clave de cache consistente
   */
  generateKey(...parts: string[]): string {
    return parts.join(':');
  }

  /**
   * Obtiene un valor del cache
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data);
    } catch (error) {
      this.logger.warn(`Error getting cache for key ${key}:`, error.message);
      return null;
    }
  }

  /**
   * Guarda un valor en el cache con TTL opcional
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      this.logger.debug(`Cache set: ${key}${ttl ? ` (TTL: ${ttl}s)` : ''}`);
    } catch (error) {
      this.logger.warn(`Error setting cache for key ${key}:`, error.message);
    }
  }

  /**
   * Elimina una clave del cache
   */
  async del(key: string | string[]): Promise<number> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      const deletedCount = await this.client.del(...keys);
      this.logger.debug(`Cache deleted: ${keys.join(', ')}`);
      return deletedCount;
    } catch (error) {
      this.logger.warn(`Error deleting cache:`, error.message);
      return 0;
    }
  }

  /**
   * Elimina todas las claves que coincidan con un patrón (glob)
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.del(keys);
    } catch (error) {
      this.logger.warn(`Error deleting cache by pattern ${pattern}:`, error.message);
      return 0;
    }
  }

  /**
   * Limpia todo el cache
   */
  async flush(): Promise<void> {
    try {
      await this.client.flushdb();
      this.logger.log('Cache flushed');
    } catch (error) {
      this.logger.warn(`Error flushing cache:`, error.message);
    }
  }

  /**
   * Comprueba si existe una clave
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.warn(`Error checking cache existence for key ${key}:`, error.message);
      return false;
    }
  }

  /**
   * Obtiene el TTL de una clave
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(key);
    } catch (error) {
      this.logger.warn(`Error getting TTL for key ${key}:`, error.message);
      return -1;
    }
  }

  /**
   * Cierra la conexión a Redis
   */
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    }
  }
}
