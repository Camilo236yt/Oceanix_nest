import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestImageReuploadDto {
  @ApiProperty({
    description: 'Mensaje para el cliente explicando por qué debe re-subir las imágenes',
    example: 'Por favor, envía imágenes más claras de la incidencia. Las actuales están borrosas.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    description: 'Horas permitidas para que el cliente suba las imágenes (por defecto 24 horas)',
    example: 24,
    required: false,
    minimum: 1,
    maximum: 168,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  hoursAllowed?: number;
}
