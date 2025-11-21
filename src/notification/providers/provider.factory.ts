import { Injectable, Logger } from '@nestjs/common';
import { INotificationProvider } from '../interfaces';
import { ProviderType } from '../../user-preferences/enums';
import { EmailNotificationProvider } from './email/email-notification.provider';
import { WebSocketNotificationProvider } from './websocket/websocket-notification.provider';
import { TelegramNotificationProvider } from './telegram/telegram-notification.provider';
import { WhatsAppNotificationProvider } from './whatsapp/whatsapp-notification.provider';

/**
 * Factory para obtener el provider de notificación apropiado
 * Implementa el patrón Factory para crear providers dinámicamente
 */
@Injectable()
export class NotificationProviderFactory {
  private readonly logger = new Logger(NotificationProviderFactory.name);

  constructor(
    private readonly emailProvider: EmailNotificationProvider,
    private readonly websocketProvider: WebSocketNotificationProvider,
    private readonly telegramProvider: TelegramNotificationProvider,
    private readonly whatsappProvider: WhatsAppNotificationProvider,
  ) {}

  /**
   * Obtiene el provider correspondiente al tipo especificado
   * @param type Tipo de provider
   * @returns Provider de notificación
   */
  getProvider(type: ProviderType): INotificationProvider {
    switch (type) {
      case ProviderType.EMAIL:
        return this.emailProvider;
      case ProviderType.WEBSOCKET:
        return this.websocketProvider;
      case ProviderType.TELEGRAM:
        return this.telegramProvider;
      case ProviderType.WHATSAPP:
        return this.whatsappProvider;
      default:
        this.logger.error(`Unknown provider type: ${type}`);
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  /**
   * Obtiene todos los providers disponibles
   * @returns Array de todos los providers
   */
  getAllProviders(): INotificationProvider[] {
    return [
      this.emailProvider,
      this.websocketProvider,
      this.telegramProvider,
      this.whatsappProvider,
    ];
  }

  /**
   * Obtiene los tipos de providers implementados
   * @returns Array de tipos de providers
   */
  getAvailableProviderTypes(): ProviderType[] {
    return [
      ProviderType.EMAIL,
      ProviderType.WEBSOCKET,
      ProviderType.TELEGRAM,
      ProviderType.WHATSAPP,
    ];
  }
}
