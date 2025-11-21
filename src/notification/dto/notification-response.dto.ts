import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationPriority } from '../enums';

/**
 * DTO de respuesta para una notificación
 */
export class NotificationResponseDto {
  @ApiProperty({
    description: 'ID de la notificación',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nuevo ticket asignado',
  })
  title: string;

  @ApiProperty({
    description: 'Mensaje o cuerpo de la notificación',
    example: 'Te han asignado el ticket #1234',
  })
  message: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: NotificationType,
    example: NotificationType.TICKET_ASSIGNED,
  })
  type: NotificationType;

  @ApiProperty({
    description: 'Prioridad de la notificación',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @ApiProperty({
    description: 'Indica si la notificación ha sido leída',
    example: false,
  })
  isRead: boolean;

  @ApiPropertyOptional({
    description: 'Fecha y hora en que se leyó la notificación',
    example: '2025-11-19T18:00:00Z',
  })
  readAt: Date | null;

  @ApiPropertyOptional({
    description: 'Metadata adicional de la notificación',
    example: { ticketId: 'uuid', ticketNumber: 1234 },
  })
  metadata: Record<string, any> | null;

  @ApiPropertyOptional({
    description: 'URL de acción (donde redirigir al hacer clic)',
    example: '/tickets/uuid',
  })
  actionUrl: string | null;

  @ApiPropertyOptional({
    description: 'URL de la imagen/icono de la notificación',
    example: 'https://example.com/icon.png',
  })
  imageUrl: string | null;

  @ApiProperty({
    description: 'Fecha de creación de la notificación',
    example: '2025-11-19T18:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-11-19T18:00:00Z',
  })
  updatedAt: Date;
}
