import { Module } from '@nestjs/common';
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
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [

ConfigModule.forRoot({
      isGlobal: true,
    }),


      TypeOrmModule.forRootAsync({

        useFactory: () => ({
          type: 'postgres',
          host: process.env.DB_host,
          port: 5432,
          username: process.env.DB_user,
          password: process.env.DB_password,
          database: process.env.DB_name,
          autoLoadEntities: true,
          synchronize: true,
        }),
    }),
     IncidenciasModule,
     AuthModule,
     UsersModule,
     ClientsModule,
     EnterpriseModule,
     RolesModule,
     PermissionsModule,
     MessagesModule,
     NotificationModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {


  constructor() {    console.log('Database Host:', process.env.DB_host);
  }
}
