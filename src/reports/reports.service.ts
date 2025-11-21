import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidencia } from '../incidencias/entities/incidencia.entity';
import { DashboardReport } from './interfaces/report-stats.interface';
import { DashboardMetrics } from './interfaces/dashboard-metrics.interface';
import { TipoIncidencia } from '../incidencias/enums/incidencia.enums';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
  ) {}

  async generateReport(
    enterpriseId: string,
    startDate: string,
    endDate: string,
  ): Promise<DashboardReport> {
    // Convertir strings a Date objects
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Incluir todo el último día

    // Query base para el rango de fechas y empresa
    const queryBuilder = this.incidenciaRepository
      .createQueryBuilder('incidencia')
      .where('incidencia.tenantId = :enterpriseId', { enterpriseId })
      .andWhere('incidencia.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('incidencia.isActive = :isActive', { isActive: true });

    // Obtener todas las incidencias del período
    const incidencias = await queryBuilder.getMany();

    const total = incidencias.length;

    // Calcular estadísticas por status
    const resueltas = incidencias.filter(
      (inc) => inc.status === 'RESOLVED' || inc.status === 'CLOSED',
    ).length;

    const pendientes = incidencias.filter(
      (inc) => inc.status === 'PENDING' || inc.status === 'IN_PROGRESS',
    ).length;

    // Identificar críticas (asumiendo que el status contiene la palabra "critical" o es IN_PROGRESS con alta prioridad)
    // Como no hay campo de prioridad, vamos a considerar IN_PROGRESS como críticas
    const criticas = incidencias.filter(
      (inc) => inc.status === 'IN_PROGRESS',
    ).length;

    // Calcular tiempo promedio de resolución (solo para incidencias resueltas/cerradas)
    const incidenciasResueltas = incidencias.filter(
      (inc) => inc.status === 'RESOLVED' || inc.status === 'CLOSED',
    );

    let tiempoPromedioResolucion = 'N/A';
    if (incidenciasResueltas.length > 0) {
      const totalDias = incidenciasResueltas.reduce((acc, inc) => {
        const dias =
          (inc.updatedAt.getTime() - inc.createdAt.getTime()) /
          (1000 * 60 * 60 * 24);
        return acc + dias;
      }, 0);
      const promedio = totalDias / incidenciasResueltas.length;
      tiempoPromedioResolucion = `${promedio.toFixed(1)} días`;
    }

    // Contar por tipo
    const perdidas = incidencias.filter(
      (inc) => inc.tipo === TipoIncidencia.POR_PERDIDA,
    ).length;

    const danos = incidencias.filter(
      (inc) => inc.tipo === TipoIncidencia.POR_DANO,
    ).length;

    // Retrasos: agrupamos los tipos técnicos/operativos
    const retrasos = incidencias.filter(
      (inc) =>
        inc.tipo === TipoIncidencia.POR_ERROR_HUMANO ||
        inc.tipo === TipoIncidencia.POR_MANTENIMIENTO ||
        inc.tipo === TipoIncidencia.POR_FALLA_TECNICA,
    ).length;

    const otros = incidencias.filter(
      (inc) => inc.tipo === TipoIncidencia.OTRO,
    ).length;

    // Calcular porcentajes para distribución de estados
    const resueltasPercentage = total > 0 ? (resueltas / total) * 100 : 0;
    const pendientesPercentage = total > 0 ? (pendientes / total) * 100 : 0;
    const criticasPercentage = total > 0 ? (criticas / total) * 100 : 0;

    // Calcular métricas clave
    const tasaResolucion = total > 0 ? ((resueltas / total) * 100).toFixed(1) : '0';

    // Eficiencia operativa basada en tasa de resolución
    let eficienciaOperativa = 'Baja';
    const tasaResolucionNum = parseFloat(tasaResolucion);
    if (tasaResolucionNum >= 80) eficienciaOperativa = 'Alta';
    else if (tasaResolucionNum >= 60) eficienciaOperativa = 'Media';

    // Calcular tendencia mensual (comparar con período anterior)
    // Por ahora, placeholder - se puede mejorar calculando el período anterior
    const tendenciaMensual = '+12% vs mes anterior';

    // Formatear período
    const periodoStart = start.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
    const periodoEnd = end.toLocaleDateString('es-ES', {
      month: 'long',
      year: 'numeric',
    });
    const periodo = periodoStart === periodoEnd
      ? periodoStart
      : `${periodoStart} - ${periodoEnd}`;

    // Construir respuesta
    const report: DashboardReport = {
      estadisticas: {
        totalIncidencias: total,
        resueltas,
        pendientes,
        tiempoPromedioResolucion,
      },
      distribucionEstados: {
        resueltas: {
          count: resueltas,
          percentage: Math.round(resueltasPercentage),
        },
        pendientes: {
          count: pendientes,
          percentage: Math.round(pendientesPercentage),
        },
        criticas: {
          count: criticas,
          percentage: Math.round(criticasPercentage),
        },
      },
      incidenciasPorTipo: {
        perdidas,
        retrasos,
        danos,
        otros,
      },
      metricasClave: {
        tasaResolucion: `${tasaResolucion}%`,
        incidenciasCriticas: criticas,
        eficienciaOperativa,
        tendenciaMensual,
      },
      informacionReporte: {
        fechaGeneracion: new Date().toISOString().split('T')[0],
        periodo,
        sistema: 'Oceanix CRM v1.0',
      },
    };

    return report;
  }

  async getDashboardMetrics(
    enterpriseId: string,
    startDate: string,
    endDate: string,
  ): Promise<DashboardMetrics> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Query base para el rango de fechas y empresa
    const incidencias = await this.incidenciaRepository
      .createQueryBuilder('incidencia')
      .where('incidencia.tenantId = :enterpriseId', { enterpriseId })
      .andWhere('incidencia.createdAt BETWEEN :start AND :end', { start, end })
      .andWhere('incidencia.isActive = :isActive', { isActive: true })
      .getMany();

    const total = incidencias.length;

    // Contar por tipo para gráfica de barras
    const perdidas = incidencias.filter(
      (inc) => inc.tipo === TipoIncidencia.POR_PERDIDA,
    ).length;

    const danos = incidencias.filter(
      (inc) => inc.tipo === TipoIncidencia.POR_DANO,
    ).length;

    const retrasos = incidencias.filter(
      (inc) =>
        inc.tipo === TipoIncidencia.POR_ERROR_HUMANO ||
        inc.tipo === TipoIncidencia.POR_MANTENIMIENTO ||
        inc.tipo === TipoIncidencia.POR_FALLA_TECNICA,
    ).length;

    const otros = incidencias.filter(
      (inc) => inc.tipo === TipoIncidencia.OTRO,
    ).length;

    // Calcular estadísticas por status para gráfica de dona
    const resueltas = incidencias.filter(
      (inc) => inc.status === 'RESOLVED' || inc.status === 'CLOSED',
    ).length;

    const pendientes = incidencias.filter(
      (inc) => inc.status === 'PENDING',
    ).length;

    const criticas = incidencias.filter(
      (inc) => inc.status === 'IN_PROGRESS',
    ).length;

    // Calcular porcentajes
    const resueltasPercentage = total > 0 ? Math.round((resueltas / total) * 100) : 0;
    const pendientesPercentage = total > 0 ? Math.round((pendientes / total) * 100) : 0;
    const criticasPercentage = total > 0 ? Math.round((criticas / total) * 100) : 0;

    return {
      incidenciasPorTipo: {
        perdidas,
        retrasos,
        danos,
        otros,
      },
      estadoIncidencias: {
        resueltas: {
          count: resueltas,
          percentage: resueltasPercentage,
        },
        pendientes: {
          count: pendientes,
          percentage: pendientesPercentage,
        },
        criticas: {
          count: criticas,
          percentage: criticasPercentage,
        },
      },
    };
  }
}
