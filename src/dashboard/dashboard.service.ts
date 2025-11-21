import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incidencia } from '../incidencias/entities/incidencia.entity';
import { DashboardData } from './interfaces/dashboard-data.interface';
import { TipoIncidencia } from '../incidencias/enums/incidencia.enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>,
  ) {}

  async getDashboardData(
    enterpriseId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardData> {
    // Si no se proporcionan fechas, traer todo
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    // Obtener todas las incidencias del período
    const queryBuilder = this.incidenciaRepository
      .createQueryBuilder('inc')
      .where('inc.tenantId = :enterpriseId', { enterpriseId })
      .andWhere('inc.isActive = :isActive', { isActive: true });

    // Solo aplicar filtro de fechas si se proporcionan
    if (start && end) {
      queryBuilder.andWhere('inc.createdAt BETWEEN :start AND :end', { start, end });
    }

    const incidencias = await queryBuilder.getMany();

    const total = incidencias.length;

    // Calcular KPIs
    const resueltas = incidencias.filter(
      (inc) => inc.status === 'RESOLVED' || inc.status === 'CLOSED',
    ).length;

    const pendientes = incidencias.filter(
      (inc) => inc.status === 'PENDING' || inc.status === 'IN_PROGRESS',
    ).length;

    // Calcular tiempo promedio
    const incidenciasResueltas = incidencias.filter(
      (inc) => inc.status === 'RESOLVED' || inc.status === 'CLOSED',
    );

    let tiempoPromedioDias = 0;
    if (incidenciasResueltas.length > 0) {
      const totalDias = incidenciasResueltas.reduce((acc, inc) => {
        const dias =
          (inc.updatedAt.getTime() - inc.createdAt.getTime()) /
          (1000 * 60 * 60 * 24);
        return acc + dias;
      }, 0);
      tiempoPromedioDias = totalDias / incidenciasResueltas.length;
    }

    // Calcular tendencias solo si se proporcionaron fechas
    let trendTotal = 0;
    let trendResueltas = 0;

    if (start && end) {
      const periodLength = end.getTime() - start.getTime();
      const previousStart = new Date(start.getTime() - periodLength);
      const previousEnd = new Date(start.getTime() - 1);

      const incidenciasPrevias = await this.incidenciaRepository
        .createQueryBuilder('inc')
        .where('inc.tenantId = :enterpriseId', { enterpriseId })
        .andWhere('inc.createdAt BETWEEN :start AND :end', {
          start: previousStart,
          end: previousEnd,
        })
        .andWhere('inc.isActive = :isActive', { isActive: true })
        .getCount();

      trendTotal =
        incidenciasPrevias > 0
          ? Math.round(((total - incidenciasPrevias) / incidenciasPrevias) * 100)
          : 0;

      const resueltasPrevias = await this.incidenciaRepository
        .createQueryBuilder('inc')
        .where('inc.tenantId = :enterpriseId', { enterpriseId })
        .andWhere('inc.createdAt BETWEEN :start AND :end', {
          start: previousStart,
          end: previousEnd,
        })
        .andWhere('inc.isActive = :isActive', { isActive: true })
        .andWhere("inc.status IN ('RESOLVED', 'CLOSED')")
        .getCount();

      trendResueltas =
        resueltasPrevias > 0
          ? Math.round(((resueltas - resueltasPrevias) / resueltasPrevias) * 100)
          : 0;
    }

    // Contar por tipo
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

    // Calcular estados para la gráfica de dona
    const criticas = incidencias.filter(
      (inc) => inc.status === 'IN_PROGRESS',
    ).length;

    const resueltasPercentage = total > 0 ? Math.round((resueltas / total) * 100) : 0;
    const pendientesPercentage = total > 0 ? Math.round(((pendientes - criticas) / total) * 100) : 0;
    const criticasPercentage = total > 0 ? Math.round((criticas / total) * 100) : 0;

    // Construir respuesta
    const dashboard: DashboardData = {
      totalIncidencias: {
        value: total,
        label: 'Total Incidencias',
        trend: `${trendTotal >= 0 ? '+' : ''}${trendTotal}% vs mes anterior`,
        trendDirection: trendTotal >= 0 ? 'up' : 'down',
        icon: 'alert',
      },
      incidenciasResueltas: {
        value: resueltas,
        label: 'Incidencias Resueltas',
        trend: `${trendResueltas >= 0 ? '+' : ''}${trendResueltas}% vs mes anterior`,
        trendDirection: trendResueltas >= 0 ? 'up' : 'down',
        icon: 'check',
      },
      pendientes: {
        value: pendientes,
        label: 'Pendientes',
        icon: 'clock',
      },
      tiempoPromedio: {
        value: `${tiempoPromedioDias.toFixed(1)} días`,
        label: 'Tiempo Promedio',
        trend: '-15% vs mes anterior',
        trendDirection: 'down',
        icon: 'calendar',
      },
      incidenciasPorTipo: {
        perdidas,
        retrasos,
        danos,
        otros,
      },
      estadoIncidencias: [
        {
          label: 'Resueltas',
          count: resueltas,
          percentage: resueltasPercentage,
          color: '#00D9A5', // Verde
        },
        {
          label: 'Pendientes',
          count: pendientes - criticas,
          percentage: pendientesPercentage,
          color: '#FFB800', // Amarillo
        },
        {
          label: 'Críticas',
          count: criticas,
          percentage: criticasPercentage,
          color: '#FF4757', // Rojo
        },
      ],
      fechaConsulta: new Date().toISOString().split('T')[0],
      periodo: start && end ? this.formatPeriodo(start, end) : 'Todos los datos',
    };

    return dashboard;
  }

  private formatPeriodo(start: Date, end: Date): string {
    const startStr = start.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const endStr = end.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (startStr === endStr) {
      return startStr;
    }

    return `${startStr} - ${endStr}`;
  }
}
