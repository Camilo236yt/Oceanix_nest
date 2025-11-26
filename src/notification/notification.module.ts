import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { Notification } from './entities/notification.entity';
import { User } from '../users/entities/user.entity';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';
import { NotificationProviderPreference } from '../user-preferences/entities';

// Providers
import { EmailNotificationProvider } from './providers/email/email-notification.provider';
import { WebSocketNotificationProvider } from './providers/websocket/websocket-notification.provider';
import { TelegramNotificationProvider } from './providers/telegram/telegram-notification.provider';
import { WhatsAppNotificationProvider } from './providers/whatsapp/whatsapp-notification.provider';
import { NotificationProviderFactory } from './providers/provider.factory';

// Gateway
import { NotificationGateway } from './gateways/notification.gateway';

import { TestNotificationController } from './test-notification.controller';
import { WhatsAppController } from './controllers/whatsapp.controller';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { PostgresAuthStore } from './providers/whatsapp/postgres-auth-store';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, User, NotificationProviderPreference, WhatsAppSession]),
    UserPreferencesModule, // Importar módulo de preferencias
    JwtModule, // Para verificar tokens en WebSocket
  ],
  controllers: [NotificationController, TestNotificationController, WhatsAppController],
  providers: [
    NotificationService,
    NotificationGateway,
    NotificationProviderFactory,
    EmailNotificationProvider,
    WebSocketNotificationProvider,
    TelegramNotificationProvider,
    WhatsAppNotificationProvider,
    PostgresAuthStore,
  ],
  exports: [NotificationService], // Exportar para que otros módulos puedan usarlo
})
export class NotificationModule { }
