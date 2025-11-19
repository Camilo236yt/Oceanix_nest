import { NotificationType, NotificationPriority } from '../enums';

/**
 * Payload de notificación que se envía a los providers
 */
export interface NotificationPayload {
  /**
   * ID de la notificación (opcional, se agrega después de guardarla en BD)
   */
  id?: string;

  /**
   * Título de la notificación
   */
  title: string;

  /**
   * Mensaje o cuerpo de la notificación
   */
  message: string;

  /**
   * Tipo de notificación
   */
  type: NotificationType;

  /**
   * Prioridad de la notificación
   */
  priority?: NotificationPriority;

  /**
   * Metadata adicional (opcional)
   * Puede contener información específica del contexto:
   * - ticketId, ticketNumber
   * - messageId
   * - userId
   * - etc.
   */
  metadata?: Record<string, any>;

  /**
   * URL de acción (opcional)
   * A dónde redirigir cuando el usuario hace clic en la notificación
   */
  actionUrl?: string;

  /**
   * Icono o imagen de la notificación (opcional)
   */
  imageUrl?: string;
}
