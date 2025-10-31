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


@Module({
  imports: [IncidenciasModule, AuthModule, UsersModule, ClientsModule, EnterpriseModule, RolesModule, PermissionsModule, MessagesModule, NotificationModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
