import { Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @Get('health')
  @ApiOperation({ summary: 'Check Redis connection status' })
  @ApiResponse({ status: 200, description: 'Redis status information' })
  async getHealthStatus() {
    const status = this.redisService.getConnectionStatus();
    
    // Test cache operations
    const testKey = `health_test_${Date.now()}`;
    const testValue = { timestamp: new Date().toISOString(), test: true };
    
    try {
      // Test SET operation
      await this.redisService.set(testKey, testValue, 60);
      
      // Test GET operation
      const retrieved = await this.redisService.get(testKey);
      
      // Test DELETE operation
      await this.redisService.del(testKey);
      
      return {
        status: 'healthy',
        cache_type: status.isRedis ? 'Redis' : 'Memory',
        store_info: status.storeInfo,
        redis_connected: status.isRedis,
        operations_working: true,
        test_result: {
          set_success: true,
          get_success: !!retrieved,
          delete_success: true
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        cache_type: status.isRedis ? 'Redis' : 'Memory',
        store_info: status.storeInfo,
        redis_connected: false,
        operations_working: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get cache statistics' })
  @ApiResponse({ status: 200, description: 'Cache statistics' })
  async getStats() {
    const status = this.redisService.getConnectionStatus();
    
    return {
      cache_type: status.isRedis ? 'Redis Server' : 'In-Memory Cache',
      store_class: status.storeInfo,
      redis_active: status.isRedis,
      performance_note: status.isRedis 
        ? 'Using persistent Redis cache - optimal performance' 
        : 'Using memory cache - limited to single instance',
      recommendations: status.isRedis 
        ? ['Redis is active and working correctly']
        : [
            'Consider starting Redis server for better performance',
            'Current cache will be lost on server restart',
            'Limited cache sharing between multiple instances'
          ]
    };
  }

  @Get('connection-info')
  @ApiOperation({ summary: 'Get Redis connection information' })
  @ApiResponse({ status: 200, description: 'Connection details' })
  async getConnectionInfo() {
    const status = this.redisService.getConnectionStatus();
    
    return {
      current_status: status.isRedis ? 'Redis Connected' : 'Using Memory Cache',
      store_type: status.storeInfo,
      troubleshooting: {
        steps: [
          '1. Check if Docker is running',
          '2. Start Redis: docker-compose up redis -d',
          '3. Verify Redis is listening on port 6379',
          '4. Check firewall settings',
          '5. Restart the application after Redis is running'
        ],
        docker_commands: [
          'docker-compose ps',
          'docker-compose up redis -d',
          'docker-compose logs redis',
          'docker exec -it secarredis redis-cli ping'
        ]
      },
      environment_variables: {
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: process.env.REDIS_PORT || '6379',
        REDIS_DB: process.env.REDIS_DB || '0',
        REDIS_TTL: process.env.REDIS_TTL || '300'
      }
    };
  }
}