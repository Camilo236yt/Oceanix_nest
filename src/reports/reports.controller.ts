import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GetReportDto } from './dto/get-report.dto';
import { Auth } from '../auth/decorator/auth.decorator';
import { ValidPermission } from '../auth/interfaces/valid-permission';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('generate')
  @Auth(ValidPermission.viewReports)
  @ApiOperation({
    summary: 'Generar reporte de incidencias',
    description: 'Genera un reporte estadístico de incidencias filtrado por rango de fechas y empresa (multi-tenant). Devuelve datos en JSON para que el frontend genere el PDF.'
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Fecha de inicio en formato ISO (YYYY-MM-DD)',
    example: '2025-01-01'
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Fecha de fin en formato ISO (YYYY-MM-DD)',
    example: '2025-11-30'
  })
  @ApiResponse({
    status: 200,
    description: 'Reporte generado exitosamente',
    schema: {
      example: {
        estadisticas: {
          totalIncidencias: 120,
          resueltas: 78,
          pendientes: 42,
          tiempoPromedioResolucion: '2.5 días'
        },
        distribucionEstados: {
          resueltas: { count: 78, percentage: 65 },
          pendientes: { count: 34, percentage: 28 },
          criticas: { count: 12, percentage: 10 }
        },
        incidenciasPorTipo: {
          perdidas: 45,
          retrasos: 30,
          danos: 27,
          otros: 18
        },
        metricasClave: {
          tasaResolucion: '65.0%',
          incidenciasCriticas: 12,
          eficienciaOperativa: 'Alta',
          tendenciaMensual: '+12% vs mes anterior'
        },
        informacionReporte: {
          fechaGeneracion: '2025-11-18',
          periodo: 'Enero - Noviembre 2025',
          sistema: 'Oceanix CRM v1.0'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido o faltante'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Usuario no tiene permiso viewReports'
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Fechas inválidas'
  })
  async generateReport(
    @Query() getReportDto: GetReportDto,
    @GetUser() user: User,
  ) {
    return await this.reportsService.generateReport(
      user.enterpriseId,
      getReportDto.startDate,
      getReportDto.endDate,
    );
  }
}
