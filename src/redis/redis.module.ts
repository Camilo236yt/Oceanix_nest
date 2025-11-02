import { Module, Global, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';

@Global()
@Module({
  providers: [
    {
      provide: 'CACHE_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('RedisModule');
        
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const redisUsername = configService.get<string>('REDIS_USERNAME');
        const redisPassword = configService.get<string>('REDIS_PASSWORD');
        const redisDb = configService.get<number>('REDIS_DB', 0);

        logger.log(`🎯 ATTEMPTING REDIS CONNECTION FIRST 🎯`);
        logger.log(`Target: ${redisHost}:${redisPort} (DB: ${redisDb})`);
        
        try {
          const client = createClient({
            socket: {
              host: redisHost,
              port: redisPort,
              connectTimeout: 5000,
            },
            username: redisUsername,
            password: redisPassword,
            database: redisDb,
          });

          client.on('error', (err) => {
            logger.warn('Redis client error detected:', err.message);
          });

          client.on('connect', () => {
            logger.log('✅ Redis client connected successfully');
          });

          await client.connect();
          
          // Test connection
          await client.set('__connection_test__', 'redis_working');
          const testResult = await client.get('__connection_test__');
          await client.del('__connection_test__');
          
          if (testResult !== 'redis_working') {
            throw new Error('Redis test failed - could not retrieve test value');
          }
          
          logger.log('🚀 REDIS IS ACTIVE - Using Redis for caching');
          return { client, type: 'redis' };
          
        } catch (error) {
          logger.warn('❌ Redis connection failed, falling back to memory cache');
          logger.warn(`Redis error: ${error.message}`);
          logger.log('💾 MEMORY CACHE ACTIVATED - Using in-memory fallback');
          
          // Crear cliente de memoria simple
          const memoryStore = new Map<string, { value: any; expires?: number }>();
          
          const memoryClient = {
            type: 'memory',
            async set(key: string, value: string, options?: { EX?: number }) {
              const expires = options?.EX ? Date.now() + (options.EX * 1000) : undefined;
              memoryStore.set(key, { value, expires });
              return 'OK';
            },
            async setEx(key: string, seconds: number, value: string) {
              const expires = Date.now() + (seconds * 1000);
              memoryStore.set(key, { value, expires });
              return 'OK';
            },
            async get(key: string) {
              const item = memoryStore.get(key);
              if (!item) return null;
              
              if (item.expires && Date.now() > item.expires) {
                memoryStore.delete(key);
                return null;
              }
              
              return item.value;
            },
            async del(key: string) {
              return memoryStore.delete(key) ? 1 : 0;
            },
            async exists(key: string) {
              const item = memoryStore.get(key);
              if (!item) return 0;
              
              if (item.expires && Date.now() > item.expires) {
                memoryStore.delete(key);
                return 0;
              }
              
              return 1;
            },
            async incrBy(key: string, increment: number) {
              const current = await this.get(key);
              const newValue = (parseInt(current) || 0) + increment;
              await this.set(key, newValue.toString());
              return newValue;
            },
            async decrBy(key: string, decrement: number) {
              return this.incrBy(key, -decrement);
            },
            async flushDb() {
              memoryStore.clear();
              return 'OK';
            }
          };
          
          return { client: memoryClient, type: 'memory' };
        }
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  controllers: [RedisController],
  exports: [RedisService, 'CACHE_CLIENT'],
})
export class RedisModule {}