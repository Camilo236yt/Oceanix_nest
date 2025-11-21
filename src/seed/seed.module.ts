import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { Permission } from 'src/permissions/entities/permission.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { Role } from 'src/roles/entities/role.entity';
import { RolePermission } from 'src/roles/entities/role-permission.entity';
import { User } from 'src/users/entities/user.entity';
import { UserRole } from 'src/users/entities/user-role.entity';
import { Incidencia } from 'src/incidencias/entities/incidencia.entity';
import { EnterpriseConfig } from 'src/enterprise-config/entities/enterprise-config.entity';
import { EnterpriseDocument } from 'src/enterprise-config/entities/enterprise-document.entity';
import { NotificationProviderPreference } from 'src/user-preferences/entities/notification-provider-preference.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Permission,
      Enterprise,
      Role,
      RolePermission,
      User,
      UserRole,
      Incidencia,
      EnterpriseConfig,
      EnterpriseDocument,
      NotificationProviderPreference,
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
