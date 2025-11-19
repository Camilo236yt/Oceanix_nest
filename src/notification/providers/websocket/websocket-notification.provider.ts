import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { INotificationProvider, NotificationPayload } from '../../interfaces';
import { NotificationGateway } from '../../gateways/notification.gateway';
import { NotificationProviderPreference } from '../../../user-preferences/entities';
import { ProviderType } from '../../../user-preferences/enums';

/**
 * Provider para enviar notificaciones por WebSocket en tiempo real
 * Implementa INotificationProvider siguiendo el patrón Strategy
 */
@Injectable()
export class WebSocketNotificationProvider implements INotificationProvider {
  readonly name = 'WebSocketProvider';
  private readonly logger = new Logger(WebSocketNotificationProvider.name);

  constructor(
    private readonly notificationGateway: NotificationGateway,
    @InjectRepository(NotificationProviderPreference)
    private readonly providerPreferenceRepository: Repository<NotificationProviderPreference>,
  ) {}

  /**
   * Envía una notificación por WebSocket al usuario
   * Solo se envía si el usuario está conectado
   */
  async send(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      // Verificar que el provider esté habilitado
      const isActive = await this.isEnabled(userId);
      if (!isActive) {
        this.logger.debug(`WebSocket provider is disabled for user ${userId}`);
        return;
      }

      // Verificar si el usuario está conectado
      const isConnected = this.notificationGateway.isUserConnected(userId);
      if (!isConnected) {
        this.logger.debug(`User ${userId} is not connected to WebSocket`);
        return;
      }

      // Enviar notificación por WebSocket (asegurarse de que tenga un ID)
      if (!payload.id) {
        this.logger.warn(`Notification sent without ID for user ${userId}`);
      }

      this.notificationGateway.sendToUser(userId, {
        id: payload.id || 'pending',
        ...payload,
      });

      this.logger.log(`WebSocket notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send WebSocket notification to user ${userId}:`, error);
      // No lanzar error para no interrumpir otros providers
    }
  }

  /**
   * Verifica si el provider de WebSocket está habilitado para el usuario
   * Por defecto está habilitado para todos los usuarios
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const preference = await this.providerPreferenceRepository.findOne({
        where: {
          userId,
          providerType: ProviderType.WEBSOCKET,
          isEnabled: true,
        },
      });

      return !!preference;
    } catch (error) {
      this.logger.error(`Error checking if WebSocket provider is enabled for user ${userId}:`, error);
      return false;
    }
  }
}
