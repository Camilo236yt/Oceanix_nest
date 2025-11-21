import { IsOptional, IsString, IsPhoneNumber, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProviderType } from '../enums';

/**
 * DTO para actualizar la configuración específica de un provider
 * Los campos requeridos dependen del tipo de provider
 */
export class UpdateProviderConfigDto {
  // Telegram
  @ApiProperty({
    description: 'Chat ID de Telegram (requerido para TELEGRAM)',
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  chatId?: string;

  @ApiProperty({
    description: 'Username de Telegram',
    example: '@juanperez',
    required: false,
  })
  @IsOptional()
  @IsString()
  username?: string;

  // WhatsApp
  @ApiProperty({
    description: 'Número de teléfono (requerido para WHATSAPP)',
    example: '+573001234567',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Código de verificación para WhatsApp',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  verificationCode?: string;
}
