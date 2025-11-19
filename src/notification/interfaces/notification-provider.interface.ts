import { NotificationPayload } from './notification-payload.interface';

/**
 * Interface que deben implementar todos los notification providers
 * Implementa el patrón Strategy para permitir diferentes formas de envío
 */
export interface INotificationProvider {
  /**
   * Envía una notificación a un usuario específico
   * @param userId ID del usuario destinatario
   * @param payload Datos de la notificación
   */
  send(userId: string, payload: NotificationPayload): Promise<void>;

  /**
   * Verifica si el provider está habilitado para un usuario específico
   * @param userId ID del usuario
   * @returns true si el provider está activo y configurado
   */
  isEnabled(userId: string): Promise<boolean>;

  /**
   * Nombre del provider (para logging y debugging)
   */
  readonly name: string;
}
