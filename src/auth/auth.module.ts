import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { jwtStrategy } from './strategy/jwt-strategy';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { UserProfile } from 'src/users/entities/user-profile.entity';
import { EmailVerificationModule } from 'src/email-verification/email-verification.module';
import { EmailQueueModule } from 'src/email-queue/email-queue.module';

@Module({
  controllers: [AuthController],
  providers: [AuthService, jwtStrategy],
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserProfile]), 
    
    PassportModule.register({defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>{
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN')
            }
        }
      }
    }),
    EmailVerificationModule,
    forwardRef(() => EmailQueueModule),
  ],
  exports: [
    TypeOrmModule, JwtModule, PassportModule, jwtStrategy
  ]
})
export class AuthModule {}
