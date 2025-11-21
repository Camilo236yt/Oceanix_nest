import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto, NotificationResponseDto } from './dto';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';
import { NotificationProviderFactory } from './providers/provider.factory';
import { NotificationPayload } from './interfaces';
import { NotificationPriority } from './enums';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly userPreferencesService: UserPreferencesService,
    private readonly providerFactory: NotificationProviderFactory,
  ) {}

  /**
   * Envía una notificación a un usuario específico
   * 1. Guarda la notificación en BD
   * 2. Obtiene providers activos del usuario
   * 3. Envía por cada provider activo
   *
   * Este es el método principal que otros módulos deben usar
   */
  async sendToUser(
    userId: string,
    enterpriseId: string,
    payload: NotificationPayload,
  ): Promise<NotificationResponseDto> {
    try {
      // 1. Guardar notificación en base de datos
      const notification = await this.create(userId, enterpriseId, payload);

      // 2. Obtener providers activos del usuario
      const activeProviders = await this.userPreferencesService.getActiveProviders(userId);

      if (activeProviders.length === 0) {
        this.logger.warn(`User ${userId} has no active notification providers`);
        return this.mapToResponseDto(notification);
      }

      // 3. Enviar por cada provider activo en paralelo
      const sendPromises = activeProviders.map(async (providerConfig) => {
        try {
          const provider = this.providerFactory.getProvider(providerConfig.providerType);
          await provider.send(userId, { ...payload, id: notification.id });
          this.logger.debug(`Notification sent via ${provider.name} to user ${userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to send notification via ${providerConfig.providerType} to user ${userId}:`,
            error,
          );
          // No lanzar error para no interrumpir otros providers
        }
      });

      await Promise.allSettled(sendPromises);

      return this.mapToResponseDto(notification);
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Crea y guarda una notificación en la base de datos
   */
  private async create(
    userId: string,
    enterpriseId: string,
    payload: NotificationPayload,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      enterpriseId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      priority: payload.priority || NotificationPriority.NORMAL,
      metadata: payload.metadata || null,
      actionUrl: payload.actionUrl || null,
      imageUrl: payload.imageUrl || null,
      isRead: false,
      readAt: null,
    });

    return await this.notificationRepository.save(notification);
  }

  /**
   * Obtiene todas las notificaciones de un usuario con paginación
   */
  async findAllByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: NotificationResponseDto[]; total: number; unread: number }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const unread = await this.countUnread(userId);

    return {
      data: notifications.map(n => this.mapToResponseDto(n)),
      total,
      unread,
    };
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario
   */
  async countUnread(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Obtiene una notificación específica
   */
  async findOne(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return this.mapToResponseDto(notification);
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(id: string, userId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return this.mapToResponseDto(notification);
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return { affected: result.affected || 0 };
  }

  /**
   * Elimina una notificación
   */
  async remove(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    await this.notificationRepository.remove(notification);
  }

  /**
   * Elimina todas las notificaciones leídas de un usuario
   */
  async removeAllRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.delete({
      userId,
      isRead: true,
    });

    return { affected: result.affected || 0 };
  }

  /**
   * Mapea una entity a DTO de respuesta
   */
  private mapToResponseDto(notification: Notification): NotificationResponseDto {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.isRead,
      readAt: notification.readAt,
      metadata: notification.metadata,
      actionUrl: notification.actionUrl,
      imageUrl: notification.imageUrl,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
