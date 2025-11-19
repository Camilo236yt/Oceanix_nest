import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { GetDashboardDto } from './dto/get-dashboard.dto';
import { Auth } from '../auth/decorator/auth.decorator';
import { ValidPermission } from '../auth/interfaces/valid-permission';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Auth(ValidPermission.readDashboard)
  @ApiOperation({
    summary: 'Obtener datos del dashboard',
    description:
      'Obtiene todos los datos necesarios para renderizar el dashboard principal con KPIs, gráficas y métricas. Si no se proporcionan fechas, trae todos los datos.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Fecha de inicio en formato ISO (YYYY-MM-DD) - opcional',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Fecha de fin en formato ISO (YYYY-MM-DD) - opcional',
    example: '2025-11-30',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del dashboard obtenidos exitosamente',
    schema: {
      example: {
        totalIncidencias: {
          value: 120,
          label: 'Total Incidencias',
          trend: '+12% vs mes anterior',
          trendDirection: 'up',
          icon: 'alert',
        },
        incidenciasResueltas: {
          value: 78,
          label: 'Incidencias Resueltas',
          trend: '+8% vs mes anterior',
          trendDirection: 'up',
          icon: 'check',
        },
        pendientes: {
          value: 42,
          label: 'Pendientes',
          icon: 'clock',
        },
        tiempoPromedio: {
          value: '2.5 días',
          label: 'Tiempo Promedio',
          trend: '-15% vs mes anterior',
          trendDirection: 'down',
          icon: 'calendar',
        },
        incidenciasPorTipo: {
          perdidas: 45,
          retrasos: 30,
          danos: 27,
          otros: 18,
        },
        estadoIncidencias: [
          {
            label: 'Resueltas',
            count: 78,
            percentage: 65,
            color: '#00D9A5',
          },
          {
            label: 'Pendientes',
            count: 30,
            percentage: 25,
            color: '#FFB800',
          },
          {
            label: 'Críticas',
            count: 12,
            percentage: 10,
            color: '#FF4757',
          },
        ],
        fechaConsulta: '2025-11-18',
        periodo: 'Martes, 18 De Noviembre 2025',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido o faltante',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Usuario no tiene permiso readDashboard',
  })
  async getDashboard(
    @Query() getDashboardDto: GetDashboardDto,
    @GetUser() user: User,
  ) {
    return await this.dashboardService.getDashboardData(
      user.enterpriseId,
      getDashboardDto.startDate,
      getDashboardDto.endDate,
    );
  }
}
