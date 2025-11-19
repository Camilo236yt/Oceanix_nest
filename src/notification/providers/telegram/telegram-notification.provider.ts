import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationProvider, NotificationPayload } from '../../interfaces';
import { NotificationProviderPreference } from '../../../user-preferences/entities';
import { ProviderType } from '../../../user-preferences/enums';

/**
 * Provider para enviar notificaciones por Telegram
 * TODO: Implementar integración con Telegram Bot API
 * Implementa INotificationProvider siguiendo el patrón Strategy
 */
@Injectable()
export class TelegramNotificationProvider implements INotificationProvider {
  readonly name = 'TelegramProvider';
  private readonly logger = new Logger(TelegramNotificationProvider.name);

  constructor(
    @InjectRepository(NotificationProviderPreference)
    private readonly providerPreferenceRepository: Repository<NotificationProviderPreference>,
  ) {}

  /**
   * Envía una notificación por Telegram al usuario
   * TODO: Implementar envío real usando Telegram Bot API
   */
  async send(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const isActive = await this.isEnabled(userId);
      if (!isActive) {
        this.logger.debug(`Telegram provider is disabled for user ${userId}`);
        return;
      }

      // Obtener configuración del usuario (chatId)
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.TELEGRAM,
          isEnabled: true,
        },
      });

      if (!preference || !preference.config?.chatId) {
        this.logger.warn(`User ${userId} has no Telegram chatId configured`);
        return;
      }

      const chatId = preference.config.chatId;

      // TODO: Implementar envío real
      this.logger.log(`[TELEGRAM] Would send notification to chatId ${chatId}:`);
      this.logger.log(`  Message: ${payload.title} - ${payload.message}`);
      this.logger.log(`  Type: ${payload.type}`);

      // Aquí se implementaría el envío real:
      // await this.telegramBot.sendMessage(chatId, {
      //   text: `*${payload.title}*\n\n${payload.message}`,
      //   parse_mode: 'Markdown',
      //   reply_markup: payload.actionUrl ? {
      //     inline_keyboard: [[
      //       { text: 'Ver detalles', url: payload.actionUrl }
      //     ]]
      //   } : undefined
      // });

      this.logger.warn('Telegram provider not fully implemented yet');
    } catch (error) {
      this.logger.error(`Failed to send Telegram notification to user ${userId}:`, error);
    }
  }

  /**
   * Verifica si el provider de Telegram está habilitado y configurado
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.TELEGRAM,
          isEnabled: true,
        },
      });

      return !!preference && !!preference.config?.chatId;
    } catch (error) {
      this.logger.error(`Error checking if Telegram provider is enabled for user ${userId}:`, error);
      return false;
    }
  }
}
