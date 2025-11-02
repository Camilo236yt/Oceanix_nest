import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { RedisClientType } from 'redis';

interface CacheClient {
  client: RedisClientType | any;
  type: 'redis' | 'memory';
}

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private isRedisConnected = false;
  private cacheType: 'redis' | 'memory' = 'memory';

  constructor(@Inject('CACHE_CLIENT') private cacheClient: CacheClient) {}

  async onModuleInit() {
    await this.checkConnection();
  }

  private async checkConnection(): Promise<void> {
    try {
      this.cacheType = this.cacheClient.type;
      
      // Test connection based on type
      await this.cacheClient.client.set('__health_check__', 'ok');
      const result = await this.cacheClient.client.get('__health_check__');
      await this.cacheClient.client.del('__health_check__');
      
      if (result === 'ok') {
        this.isRedisConnected = this.cacheType === 'redis';
        
        if (this.cacheType === 'redis') {
          this.logger.log('🚀 REDIS IS ACTIVE - Persistent cache enabled');
          this.logger.log(`Redis client: ${this.cacheClient.client.constructor.name}`);
        } else {
          this.logger.warn('💾 MEMORY CACHE ACTIVE - Fallback mode (data will be lost on restart)');
          this.logger.warn('💡 Start Redis for persistent caching: docker-compose up redis -d');
        }
      } else {
        throw new Error('Cache test failed - could not retrieve test value');
      }
    } catch (error) {
      this.logger.error('❌ CACHE CONNECTION FAILED');
      this.logger.error(`Error: ${error.message}`);
      throw error;
    }
  }

  getConnectionStatus(): { isRedis: boolean; storeInfo: string } {
    return {
      isRedis: this.isRedisConnected,
      storeInfo: this.cacheType === 'redis' 
        ? this.cacheClient.client?.constructor?.name || 'Redis Client'
        : 'Memory Cache'
    };
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const result = await this.cacheClient.client.get(key);
      if (result) {
        this.logger.debug(`${this.cacheType.toUpperCase()} HIT for key: ${key}`);
        return JSON.parse(result) as T;
      } else {
        this.logger.debug(`${this.cacheType.toUpperCase()} MISS for key: ${key}`);
        return undefined;
      }
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} GET error for key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.cacheClient.client.setEx(key, ttl, serializedValue);
      } else {
        await this.cacheClient.client.set(key, serializedValue);
      }
      this.logger.debug(`${this.cacheType.toUpperCase()} SET for key: ${key} (TTL: ${ttl || 'none'})`);
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} SET error for key ${key}:`, error);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheClient.client.del(key);
      this.logger.debug(`${this.cacheType.toUpperCase()} DEL for key: ${key}`);
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} DEL error for key ${key}:`, error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cacheClient.client.flushDb();
      this.logger.debug(`${this.cacheType.toUpperCase()} database flushed`);
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} FLUSH error:`, error);
      throw error;
    }
  }

  async getMany<T>(keys: string[]): Promise<(T | undefined)[]> {
    const promises = keys.map(key => this.get<T>(key));
    return Promise.all(promises);
  }

  async setMany<T>(keyValuePairs: Array<{ key: string; value: T; ttl?: number }>): Promise<void> {
    const promises = keyValuePairs.map(({ key, value, ttl }) => 
      this.set(key, value, ttl)
    );
    await Promise.all(promises);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.cacheClient.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.cacheClient.client.incrBy(key, amount);
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} INCREMENT error for key ${key}:`, error);
      throw error;
    }
  }

  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.cacheClient.client.decrBy(key, amount);
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} DECREMENT error for key ${key}:`, error);
      throw error;
    }
  }

  generateKey(...parts: string[]): string {
    return parts.filter(Boolean).join(':');
  }

  // Método para acceder al cliente Redis directamente
  getRedisClient(): RedisClientType | any {
    return this.cacheClient.client;
  }

  // Método para verificar si Redis está disponible
  isRedisAvailable(): boolean {
    return this.isRedisConnected && this.cacheType === 'redis';
  }

  // Método SCAN para buscar claves por patrón
  async scan(pattern: string): Promise<string[]> {
    if (!this.isRedisAvailable()) {
      this.logger.warn('SCAN operation not available - Redis not connected or using memory cache');
      return [];
    }

    try {
      const keys: string[] = [];
      let cursor = 0;

      do {
        const result = await this.cacheClient.client.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        });
        
        cursor = result.cursor;
        keys.push(...result.keys);
        
      } while (cursor !== 0);

      this.logger.debug(`REDIS SCAN found ${keys.length} keys for pattern: ${pattern}`);
      return keys;
      
    } catch (error) {
      this.logger.error(`REDIS SCAN error for pattern ${pattern}:`, error);
      return [];
    }
  }

  // Método para eliminar múltiples claves de una vez
  async delMany(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    try {
      const result = await this.cacheClient.client.del(keys);
      this.logger.debug(`${this.cacheType.toUpperCase()} DEL ${result} keys`);
      return result;
    } catch (error) {
      this.logger.error(`${this.cacheType.toUpperCase()} DEL MANY error:`, error);
      throw error;
    }
  }
}