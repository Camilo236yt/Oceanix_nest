import { Controller, Get } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Health check para Redis
   * Verifica si la conexión a Redis está activa
   */
  @Get('health')
  async health() {
    try {
      const exists = await this.redisService.exists('health-check');
      return {
        status: 'ok',
        message: 'Redis connection is active',
        exists
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Redis connection failed',
        error: error.message
      };
    }
  }

  /**
   * Obtiene estadísticas del cache
   */
  @Get('stats')
  async stats() {
    return {
      message: 'Redis cache system is running',
      description: 'Use @Cached decorator in controllers to cache endpoints'
    };
  }
}
