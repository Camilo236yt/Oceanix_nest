import { IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetReportDto {
  @ApiProperty({
    description: 'Fecha de inicio del reporte en formato ISO (YYYY-MM-DD). Si no se envía, retorna desde el inicio.',
    example: '2025-01-01',
    required: false
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de fin del reporte en formato ISO (YYYY-MM-DD). Si no se envía, retorna hasta hoy.',
    example: '2025-11-30',
    required: false
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
