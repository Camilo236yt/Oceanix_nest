import { ApiProperty } from '@nestjs/swagger';
import { ProviderType } from '../enums';

/**
 * DTO de respuesta con la información de un provider de notificaciones
 */
export class ProviderResponseDto {
  @ApiProperty({
    description: 'ID del registro',
    example: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Tipo de provider',
    enum: ProviderType,
    example: ProviderType.EMAIL,
  })
  providerType: ProviderType;

  @ApiProperty({
    description: 'Indica si el provider está habilitado',
    example: true,
  })
  isEnabled: boolean;

  @ApiProperty({
    description: 'Indica si el provider requiere configuración adicional',
    example: false,
  })
  requiresConfiguration: boolean;

  @ApiProperty({
    description: 'Indica si el provider está correctamente configurado',
    example: true,
  })
  isConfigured: boolean;

  @ApiProperty({
    description: 'Configuración pública del provider (sin datos sensibles)',
    example: { chatId: '***456789' },
    required: false,
  })
  config?: {
    chatId?: string;
    username?: string;
    phoneNumber?: string;
    isVerified?: boolean;
  };

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-11-19T18:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-11-19T18:00:00Z',
  })
  updatedAt: Date;
}
