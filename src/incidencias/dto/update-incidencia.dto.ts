import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidenciaStatus } from '../enums/incidencia.enums';

export class UpdateIncidenciaDto {
  @ApiProperty({
    description: 'Status of the incident',
    enum: IncidenciaStatus,
    example: IncidenciaStatus.IN_PROGRESS,
    required: false,
  })
  @IsOptional()
  @IsEnum(IncidenciaStatus)
  status?: IncidenciaStatus;

  @ApiProperty({
    description: 'UUID of the employee to reassign the incident to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}
