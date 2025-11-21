import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationProvider, NotificationPayload } from '../../interfaces';
import { NotificationProviderPreference } from '../../../user-preferences/entities';
import { ProviderType } from '../../../user-preferences/enums';

/**
 * Provider para enviar notificaciones por WhatsApp
 * TODO: Implementar integración con WhatsApp Business API o Twilio
 * Implementa INotificationProvider siguiendo el patrón Strategy
 */
@Injectable()
export class WhatsAppNotificationProvider implements INotificationProvider {
  readonly name = 'WhatsAppProvider';
  private readonly logger = new Logger(WhatsAppNotificationProvider.name);

  constructor(
    @InjectRepository(NotificationProviderPreference)
    private readonly providerPreferenceRepository: Repository<NotificationProviderPreference>,
  ) {}

  /**
   * Envía una notificación por WhatsApp al usuario
   * TODO: Implementar envío real usando WhatsApp Business API o Twilio
   */
  async send(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const isActive = await this.isEnabled(userId);
      if (!isActive) {
        this.logger.debug(`WhatsApp provider is disabled for user ${userId}`);
        return;
      }

      // Obtener configuración del usuario (phoneNumber)
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.WHATSAPP,
          isEnabled: true,
        },
      });

      if (!preference || !preference.config?.phoneNumber || !preference.config?.isVerified) {
        this.logger.warn(`User ${userId} has no verified WhatsApp number configured`);
        return;
      }

      const phoneNumber = preference.config.phoneNumber;

      // TODO: Implementar envío real
      this.logger.log(`[WHATSAPP] Would send notification to ${phoneNumber}:`);
      this.logger.log(`  Message: ${payload.title} - ${payload.message}`);
      this.logger.log(`  Type: ${payload.type}`);

      // Aquí se implementaría el envío real usando Twilio o WhatsApp Business API:
      // await this.twilioClient.messages.create({
      //   from: 'whatsapp:+14155238886', // Twilio Sandbox o número oficial
      //   to: `whatsapp:${phoneNumber}`,
      //   body: `*${payload.title}*\n\n${payload.message}${payload.actionUrl ? `\n\n${payload.actionUrl}` : ''}`
      // });

      this.logger.warn('WhatsApp provider not fully implemented yet');
    } catch (error) {
      this.logger.error(`Failed to send WhatsApp notification to user ${userId}:`, error);
    }
  }

  /**
   * Verifica si el provider de WhatsApp está habilitado y configurado
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.WHATSAPP,
          isEnabled: true,
        },
      });

      return (
        !!preference &&
        !!preference.config?.phoneNumber &&
        preference.config?.isVerified === true
      );
    } catch (error) {
      this.logger.error(`Error checking if WhatsApp provider is enabled for user ${userId}:`, error);
      return false;
    }
  }
}
