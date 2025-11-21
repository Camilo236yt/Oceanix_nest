import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateClientDto {
  @ApiProperty({
    description: 'Nombre del cliente',
    example: 'Juan',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Apellido del cliente',
    example: 'Pérez',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'Número de teléfono del cliente',
    example: '+573001234567',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
