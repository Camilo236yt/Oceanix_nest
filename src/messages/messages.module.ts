import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { Message } from './entities/message.entity';
import { Incidencia } from '../incidencias/entities/incidencia.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Incidencia]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRATION', '24h') },
      }),
    }),
  ],
  providers: [MessagesGateway, MessagesService],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
