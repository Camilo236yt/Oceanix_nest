import { IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para activar o desactivar un provider de notificaciones
 */
export class UpdateProviderStatusDto {
  @ApiProperty({
    description: 'Indica si el provider está habilitado o no',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isEnabled: boolean;
}
