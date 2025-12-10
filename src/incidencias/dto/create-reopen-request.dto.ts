import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReopenRequestDto {
  @IsString()
  @IsNotEmpty({ message: 'El motivo es obligatorio' })
  @MinLength(10, { message: 'El motivo debe tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'El motivo no puede exceder 500 caracteres' })
  @ApiProperty({
    description: 'Motivo por el cual el cliente solicita reabrir la incidencia',
    example: 'El problema de la fuga de agua ha vuelto a aparecer después de 3 días de la reparación. El agua sigue filtrándose por la misma zona.',
    minLength: 10,
    maxLength: 500,
  })
  clientReason: string;
}
