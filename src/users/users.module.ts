import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserRole } from './entities/user-role.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Enterprise } from '../enterprise/entities/enterprise.entity';
import { Role } from '../roles/entities/role.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User, UserRole, Enterprise, Role]),
    AuthModule,
    NotificationModule, // Para enviar notificaciones cuando se crea un usuario
  ],
  exports: [UsersService]
})
export class UsersModule {}
