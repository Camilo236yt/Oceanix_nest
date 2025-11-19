import { IsDateString } from 'class-validator';
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
}
