import { IsEnum, IsString, IsOptional, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ReviewDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class ReviewReopenRequestDto {
  @IsEnum(ReviewDecision, { message: 'La decisión debe ser APPROVED o REJECTED' })
  @ApiProperty({
    description: 'Decisión del empleado sobre la solicitud de reapertura',
    enum: ReviewDecision,
    example: ReviewDecision.APPROVED,
  })
  decision: ReviewDecision;

  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'Las notas deben tener al menos 10 caracteres' })
  @MaxLength(500, { message: 'Las notas no pueden exceder 500 caracteres' })
  @ApiProperty({
    description: 'Notas del empleado sobre la decisión (obligatorio al rechazar)',
    example: 'El problema reportado ya fue solucionado vía telefónica con el cliente. No requiere reapertura de la incidencia.',
    required: false,
    minLength: 10,
    maxLength: 500,
  })
  reviewNotes?: string;
}
