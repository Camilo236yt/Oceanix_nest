import { IsDateString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetReportDto {
  @ApiProperty({
    description: 'Fecha de inicio del reporte en formato ISO (YYYY-MM-DD)',
    example: '2025-01-01',
    required: true
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de fin del reporte en formato ISO (YYYY-MM-DD)',
    example: '2025-11-30',
    required: true
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    description: 'ID de la empresa (opcional, usa la empresa del usuario autenticado por defecto)',
    example: 'uuid-empresa-123',
    required: false
  })
  @IsOptional()
  @Type(() => String)
  enterpriseId?: string;
}
