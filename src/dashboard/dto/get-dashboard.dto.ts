import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDashboardDto {
  @ApiProperty({
    description: 'Fecha de inicio para filtrar datos (opcional, por defecto inicio del mes actual)',
    example: '2025-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin para filtrar datos (opcional, por defecto fecha actual)',
    example: '2025-11-30',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
