import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configValidationSchema } from './config/validation.config';
import { databaseConfig } from './config/database.config';
import { LocationModule } from './location/location.module';
import { UsersModule } from './users/users.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RedisModule } from './redis/redis.module';
import { SeedLocationsCommand } from './location/commands/seed-locations.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: databaseConfig
    }),
    RedisModule,
    LocationModule,
    RolesModule,
    PermissionsModule,
    UsersModule,
    EnterpriseModule,
  ],
  providers: [SeedLocationsCommand],
})
export class CliModule {}
