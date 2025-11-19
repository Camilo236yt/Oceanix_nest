import { Module } from '@nestjs/common';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { IncidenciasModule } from './incidencias/incidencias.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { EnterpriseModule } from './enterprise/enterprise.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationModule } from './notification/notification.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { configValidationSchema } from './config/validation.config';
import { databaseConfig } from './config/database.config';
import { RedisModule } from './redis/redis.module';
import { StorageModule } from './storage/storage.module';
import { LocationModule } from './location/location.module';
import { HttpExceptionFilter } from './common/filters';
import { ResponseInterceptor, CacheInterceptor } from './common/interceptors';
import { SeedModule } from './seed/seed.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EnterpriseConfigModule } from './enterprise-config/enterprise-config.module';

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

    ThrottlerModule.forRoot([{
      ttl: 60000,  // 60 segundos
      limit: 10,   // 10 requests por defecto
    }]),
     IncidenciasModule,
     AuthModule,
     UsersModule,
     ClientsModule,
     EnterpriseModule,
     RolesModule,
     PermissionsModule,
     MessagesModule,
     NotificationModule,
     RedisModule,
     StorageModule,
     LocationModule,
     SeedModule,
     ReportsModule,
     DashboardModule,
     EnterpriseConfigModule
  ],
  controllers: [],
  providers: [
    // Guards globales
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Filtros globales
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Interceptores globales (orden importante: ResponseInterceptor debe ir primero)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
