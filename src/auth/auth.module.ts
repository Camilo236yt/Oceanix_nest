import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { jwtStrategy } from './strategy/jwt-strategy';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Enterprise } from 'src/enterprise/entities/enterprise.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Permission } from 'src/permissions/entities/permission.entity';
import { RolePermission } from 'src/roles/entities/role-permission.entity';
import { UserRole } from 'src/users/entities/user-role.entity';
import { CryptoService, AuthValidationService } from './services';
import { LocationModule } from 'src/location/location.module';
import { EnterpriseConfigModule } from 'src/enterprise-config/enterprise-config.module';
import { UserPreferencesModule } from 'src/user-preferences/user-preferences.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, jwtStrategy, CryptoService, AuthValidationService],
  imports: [
    ConfigModule,
    LocationModule,
    EnterpriseConfigModule,
    UserPreferencesModule,
    TypeOrmModule.forFeature([User, Enterprise, Role, Permission, RolePermission, UserRole]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '24h'
        }
      })
    })
  ],
  exports: [
    TypeOrmModule,
    JwtModule,
    PassportModule,
    jwtStrategy,
    CryptoService
  ]
})
export class AuthModule { }
