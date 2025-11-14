import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para activar una cuenta después del registro
 */
export class ActivateAccountDto {
  @ApiProperty({
    description: 'Token temporal de activación generado durante el registro',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsString()
  @IsNotEmpty()
  activationToken: string;
}
