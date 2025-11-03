import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { AuthModule } from 'src/auth/auth.module';
import { RolePermission } from './entities/role-permission.entity';
import { PermissionsModule } from '../permissions/permissions.module';
import { Permission } from '../permissions/entities/permission.entity';
import { Enterprise } from '../enterprise/entities/enterprise.entity';

@Module({
  controllers: [RolesController],
  providers: [RolesService],
  imports: [
    TypeOrmModule.forFeature([Role, RolePermission, Permission, Enterprise]),
    AuthModule,
    PermissionsModule
  ],
  exports: [RolesService],
})
export class RolesModule {}
