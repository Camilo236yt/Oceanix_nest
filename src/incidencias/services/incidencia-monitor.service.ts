import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Incidencia } from '../entities/incidencia.entity';
import { IncidenciaStatus } from '../enums/incidencia.enums';
import { AlertLevel, getAlertLevel } from '../enums/alert-level.enum';
import { NotificationService } from '../../notification/notification.service';
import { NotificationType } from '../../notification/enums/notification-type.enum';
import { NotificationPriority } from '../../notification/enums/notification-priority.enum';
import { ALERT_CONFIG, CRON_CONFIG } from '../constants';
import { MessagesGateway } from '../../messages/messages.gateway';

@Injectable()
export class IncidenciaMonitorService {
  private readonly logger = new Logger(IncidenciaMonitorService.name);

  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
    private readonly notificationService: NotificationService,
    @Inject(forwardRef(() => MessagesGateway))
    private readonly messagesGateway: MessagesGateway,
  ) { }

  /**
   * Cronjob que se ejecuta cada minuto
   * Actualiza niveles de alerta basado en minutos desde creación y notifica según el semáforo
   */
  @Cron(CRON_CONFIG.ALERT_CHECK_SCHEDULE)
  async updateAlertLevelsAndNotify(): Promise<void> {
    const startTime = new Date();
    this.logger.log('═'.repeat(80));
    this.logger.log(`⏰ CRONJOB INICIADO - ${startTime.toLocaleString('es-ES')}`);
    this.logger.log('═'.repeat(80));

    try {
      // Buscar todas las incidencias activas pendientes o en progreso
      const incidencias = await this.incidenciaRepository.find({
        where: {
          status: In([IncidenciaStatus.PENDING, IncidenciaStatus.IN_PROGRESS]),
          isActive: true,
        },
        relations: ['enterprise'],
      });

      if (incidencias.length === 0) {
        this.logger.log('✅ No hay incidencias activas para procesar');
        this.logger.log('═'.repeat(80));
        return;
      }

      this.logger.log(`📊 Procesando ${incidencias.length} incidencia(s) activa(s)...`);
      this.logger.log('─'.repeat(80));

      let updatedCount = 0;
      let notifiedCount = 0;

      for (const incidencia of incidencias) {
        const minutesSinceCreation = this.calculateMinutesSinceCreation(incidencia.createdAt);
        const newAlertLevel = getAlertLevel(minutesSinceCreation);
        const previousLevel = incidencia.alertLevel;

        // Actualizar nivel de alerta si cambió
        if (previousLevel !== newAlertLevel) {
          incidencia.alertLevel = newAlertLevel;
          await this.incidenciaRepository.save(incidencia);
          updatedCount++;

          // Log detallado del cambio de nivel
          this.logger.warn(
            `🚨 ALERTA CAMBIADA - Incidencia: "${incidencia.name}" (ID: ${incidencia.id})`,
          );
          this.logger.warn(
            `   Nivel anterior: ${this.getAlertEmoji(previousLevel)} ${previousLevel} -> Nivel nuevo: ${this.getAlertEmoji(newAlertLevel)} ${newAlertLevel}`,
          );
          this.logger.warn(
            `   Minutos desde creación: ${minutesSinceCreation} minutos`,
          );
          this.logger.warn(
            `   Fecha de creación: ${incidencia.createdAt.toLocaleString('es-ES')}`,
          );
          this.logger.warn(
            `   Empleado asignado: ${incidencia.assignedEmployeeId || 'Sin asignar'}`,
          );
          this.logger.warn('─'.repeat(80));

          // Emitir evento WebSocket a la sala de la incidencia para actualizar en tiempo real
          this.emitAlertLevelChange(incidencia.id, previousLevel, newAlertLevel, minutesSinceCreation);

          // IMPORTANTE: Solo notificar por EMAIL cuando cambia el nivel de alerta (no cada minuto)
          // Notificar si tiene empleado asignado y el nuevo nivel no es verde
          if (incidencia.assignedEmployeeId && newAlertLevel !== AlertLevel.GREEN) {
            await this.sendAlertNotification(incidencia, minutesSinceCreation, newAlertLevel);
            notifiedCount++;

            this.logger.log(
              `📧 Notificación enviada al empleado ${incidencia.assignedEmployeeId} - Incidencia: "${incidencia.name}" (${this.getAlertEmoji(newAlertLevel)} ${newAlertLevel})`,
            );
          }
        }
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      this.logger.log('─'.repeat(80));
      this.logger.log(`✅ CRONJOB COMPLETADO - ${endTime.toLocaleString('es-ES')}`);
      this.logger.log(`   📈 Alertas actualizadas: ${updatedCount}`);
      this.logger.log(`   📧 Notificaciones enviadas: ${notifiedCount}`);
      this.logger.log(`   ⏱️  Duración: ${duration}ms`);
      this.logger.log('═'.repeat(80));
    } catch (error) {
      this.logger.error('═'.repeat(80));
      this.logger.error('❌ ERROR EN CRONJOB:', error);
      this.logger.error('═'.repeat(80));
    }
  }

  /**
   * Envía notificación según el nivel de alerta
   */
  private async sendAlertNotification(
    incidencia: Incidencia,
    minutesSinceCreation: number,
    alertLevel: AlertLevel,
  ): Promise<void> {
    if (!incidencia.assignedEmployeeId) {
      return;
    }

    const { title, priority } = this.getNotificationConfig(alertLevel, minutesSinceCreation);

    try {
      await this.notificationService.sendToUser(
        incidencia.assignedEmployeeId,
        incidencia.enterpriseId,
        {
          title,
          message: `La incidencia "${incidencia.name}" lleva ${minutesSinceCreation} minutos desde su creación.`,
          type: NotificationType.TICKET_REMINDER,
          priority,
          metadata: {
            incidenciaId: incidencia.id,
            incidenciaName: incidencia.name,
            minutesSinceCreation,
            alertLevel,
            status: incidencia.status,
          },
          actionUrl: `https://${incidencia.enterprise?.subdomain || 'app'}.oceanix.space/incidencias/${incidencia.id}`,
        },
      );

      this.logger.debug(
        `[${alertLevel}] Notification sent to ${incidencia.assignedEmployeeId} for incidencia ${incidencia.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send notification for incidencia ${incidencia.id}:`,
        error,
      );
    }
  }

  /**
   * Obtiene configuración de notificación según nivel de alerta
   */
  private getNotificationConfig(
    alertLevel: AlertLevel,
    minutes: number,
  ): { title: string; priority: NotificationPriority } {
    switch (alertLevel) {
      case AlertLevel.YELLOW:
        return {
          title: ALERT_CONFIG.NOTIFICATION_TITLES.YELLOW,
          priority: NotificationPriority.NORMAL,
        };
      case AlertLevel.ORANGE:
        return {
          title: ALERT_CONFIG.NOTIFICATION_TITLES.ORANGE,
          priority: NotificationPriority.HIGH,
        };
      case AlertLevel.RED:
        return {
          title: ALERT_CONFIG.NOTIFICATION_TITLES.RED,
          priority: NotificationPriority.URGENT,
        };
      default:
        return {
          title: ALERT_CONFIG.NOTIFICATION_TITLES.DEFAULT,
          priority: NotificationPriority.LOW,
        };
    }
  }

  /**
   * Calcula los minutos transcurridos desde la creación de la incidencia
   */
  private calculateMinutesSinceCreation(createdAt: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60)); // Convertir ms a minutos
    return diffMinutes;
  }

  /**
   * Método manual para forzar actualización de alertas (útil para testing)
   */
  async forceUpdateAlertLevels(): Promise<{ updated: number }> {
    await this.updateAlertLevelsAndNotify();
    return { updated: 1 };
  }

  /**
   * Obtiene el emoji correspondiente al nivel de alerta
   */
  private getAlertEmoji(alertLevel: AlertLevel): string {
    switch (alertLevel) {
      case AlertLevel.GREEN:
        return '🟢';
      case AlertLevel.YELLOW:
        return '🟡';
      case AlertLevel.ORANGE:
        return '🟠';
      case AlertLevel.RED:
        return '🔴';
      default:
        return '⚪';
    }
  }

  /**
   * Emite evento WebSocket cuando cambia el nivel de alerta
   */
  private emitAlertLevelChange(
    incidenciaId: string,
    previousLevel: AlertLevel,
    newLevel: AlertLevel,
    minutesSinceCreation: number,
  ): void {
    const roomName = `incidencia:${incidenciaId}`;

    this.messagesGateway.server.to(roomName).emit('alertLevelChanged', {
      incidenciaId,
      previousLevel,
      newLevel,
      minutesSinceCreation,
      emoji: this.getAlertEmoji(newLevel),
      timestamp: new Date().toISOString(),
    });

    this.logger.log(
      `📡 WebSocket: Alert level change emitted to room ${roomName} (${this.getAlertEmoji(previousLevel)} ${previousLevel} -> ${this.getAlertEmoji(newLevel)} ${newLevel})`,
    );
  }
}
