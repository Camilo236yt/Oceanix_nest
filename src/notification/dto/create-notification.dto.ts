import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationType, NotificationPriority } from '../enums';

/**
 * DTO para crear una nueva notificación
 * Usado internamente por otros módulos al llamar NotificationService
 */
export class CreateNotificationDto {
  @ApiProperty({
    description: 'Título de la notificación',
    example: 'Nuevo ticket asignado',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Mensaje o cuerpo de la notificación',
    example: 'Te han asignado el ticket #1234',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Tipo de notificación',
    enum: NotificationType,
    example: NotificationType.TICKET_ASSIGNED,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiPropertyOptional({
    description: 'Prioridad de la notificación',
    enum: NotificationPriority,
    example: NotificationPriority.NORMAL,
    default: NotificationPriority.NORMAL,
  })
  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @ApiPropertyOptional({
    description: 'Metadata adicional de la notificación',
    example: { ticketId: 'uuid', ticketNumber: 1234 },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'URL de acción (donde redirigir al hacer clic)',
    example: '/tickets/uuid',
  })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: 'URL de la imagen/icono de la notificación',
    example: 'https://example.com/icon.png',
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
