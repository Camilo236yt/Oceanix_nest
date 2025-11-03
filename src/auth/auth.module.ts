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
import { CryptoService } from './services/crypto.service';
import { LocationModule } from 'src/location/location.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, jwtStrategy, CryptoService],
  imports: [
    ConfigModule,
    LocationModule,
    TypeOrmModule.forFeature([User, Enterprise]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN')
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
export class AuthModule {}
