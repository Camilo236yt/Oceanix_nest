import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationProvider } from '../../interfaces';
import { NotificationPayload } from '../../interfaces';
import { User } from '../../../users/entities/user.entity';
import { NotificationProviderPreference } from '../../../user-preferences/entities';
import { ProviderType } from '../../../user-preferences/enums';

/**
 * Provider para enviar notificaciones por correo electrónico
 * Implementa INotificationProvider siguiendo el patrón Strategy
 */
@Injectable()
export class EmailNotificationProvider implements INotificationProvider {
  readonly name = 'EmailProvider';
  private readonly logger = new Logger(EmailNotificationProvider.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NotificationProviderPreference)
    private readonly providerPreferenceRepository: Repository<NotificationProviderPreference>,
  ) {}

  /**
   * Envía una notificación por email al usuario
   */
  async send(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      // Verificar que el provider esté habilitado
      const isActive = await this.isEnabled(userId);
      if (!isActive) {
        this.logger.debug(`Email provider is disabled for user ${userId}`);
        return;
      }

      // Obtener el email del usuario
      const user = await this.userRepository.findOne({
        where: { id: userId },
        select: ['id', 'email', 'name', 'lastName'],
      });

      if (!user || !user.email) {
        this.logger.warn(`User ${userId} not found or has no email`);
        return;
      }

      // TODO: Integrar con servicio de email real (Nodemailer, SendGrid, etc.)
      // Por ahora solo hacemos log
      this.logger.log(`[EMAIL] Sending notification to ${user.email}:`);
      this.logger.log(`  To: ${user.name} ${user.lastName} <${user.email}>`);
      this.logger.log(`  Subject: ${payload.title}`);
      this.logger.log(`  Message: ${payload.message}`);
      this.logger.log(`  Type: ${payload.type}`);
      this.logger.log(`  Priority: ${payload.priority || 'NORMAL'}`);
      if (payload.actionUrl) {
        this.logger.log(`  Action URL: ${payload.actionUrl}`);
      }

      // Simular envío exitoso
      // Aquí se haría el envío real:
      // await this.mailerService.sendMail({
      //   to: user.email,
      //   subject: payload.title,
      //   template: 'notification',
      //   context: {
      //     userName: `${user.name} ${user.lastName}`,
      //     title: payload.title,
      //     message: payload.message,
      //     actionUrl: payload.actionUrl,
      //     priority: payload.priority,
      //   },
      // });

      this.logger.debug(`Email notification sent successfully to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send email notification to user ${userId}:`, error);
      // No lanzar error para no interrumpir otros providers
    }
  }

  /**
   * Verifica si el provider de email está habilitado para el usuario
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.EMAIL,
          isEnabled: true,
        },
      });

      return !!preference;
    } catch (error) {
      this.logger.error(`Error checking if email provider is enabled for user ${userId}:`, error);
      return false;
    }
  }
}
