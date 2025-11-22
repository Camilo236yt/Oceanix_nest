import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IncidenciaStatus, TipoIncidencia } from '../enums/incidencia.enums';
import { AlertLevel } from '../enums/alert-level.enum';

/**
 * DTO para filtros específicos de incidencias
 * Se combina con los query params de paginación de nestjs-paginate
 */
export class FilterIncidenciasDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de la incidencia',
    enum: IncidenciaStatus,
    example: IncidenciaStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(IncidenciaStatus)
  status?: IncidenciaStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de incidencia',
    enum: TipoIncidencia,
    example: TipoIncidencia.POR_DANO,
  })
  @IsOptional()
  @IsEnum(TipoIncidencia)
  tipo?: TipoIncidencia;

  @ApiPropertyOptional({
    description: 'Filtrar por nivel de alerta',
    enum: AlertLevel,
    example: AlertLevel.RED,
  })
  @IsOptional()
  @IsEnum(AlertLevel)
  alertLevel?: AlertLevel;

  @ApiPropertyOptional({
    description: 'Filtrar por empleado asignado (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  assignedEmployeeId?: string;
}
