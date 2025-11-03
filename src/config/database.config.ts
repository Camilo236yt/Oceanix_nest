import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USER', 'oceanix_user'),
  password: configService.get<string>('DATABASE_PASSWORD', 'oceanix_password_dev'),
  database: configService.get<string>('DATABASE_NAME', 'oceanix_db'),
  autoLoadEntities: true,
  synchronize: configService.get<string>('NODE_ENV') !== 'production',
  logging: configService.get<string>('NODE_ENV') === 'development',
  retryAttempts: 3,
  retryDelay: 3000,
  connectTimeoutMS: 10000,
});
