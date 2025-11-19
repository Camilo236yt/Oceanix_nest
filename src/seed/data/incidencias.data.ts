import { TipoIncidencia, incidenciaStatus } from '../../incidencias/dto/enum/status-incidencias.enum';

/**
 * Configuración para generación de incidencias por tipo
 */
export interface IncidenciaTypeConfig {
  tipo: TipoIncidencia;
  count: number; // Cantidad por empresa
  prefix: string; // Prefijo para el nombre
}

/**
 * Distribución de incidencias por tipo
 * Basado en los datos del dashboard de reportes
 */
export const INCIDENCIAS_CONFIG: IncidenciaTypeConfig[] = [
  // Pérdidas (45 total distribuidas) - 15 por empresa
  {
    tipo: TipoIncidencia.POR_PERDIDA,
    count: 15,
    prefix: 'Pérdida',
  },

  // Daños (27 total distribuidas) - 9 por empresa
  {
    tipo: TipoIncidencia.POR_DANO,
    count: 9,
    prefix: 'Daño',
  },

  // Retrasos (30 total - agrupando tipos técnicos/operativos) - 10 por empresa
  {
    tipo: TipoIncidencia.POR_ERROR_HUMANO,
    count: 5,
    prefix: 'Error Humano',
  },
  {
    tipo: TipoIncidencia.POR_MANTENIMIENTO,
    count: 3,
    prefix: 'Mantenimiento',
  },
  {
    tipo: TipoIncidencia.POR_FALLA_TECNICA,
    count: 2,
    prefix: 'Falla Técnica',
  },

  // Otros (18 total distribuidas) - 6 por empresa
  {
    tipo: TipoIncidencia.OTRO,
    count: 6,
    prefix: 'Otros',
  },
];

/**
 * Distribución de estados para las incidencias
 * Según el dashboard: Resueltas: 65%, Pendientes: 28%, Críticas (IN_PROGRESS): 10%
 */
export function getStatusDistribution(count: number): incidenciaStatus[] {
  return [
    ...Array(Math.ceil(count * 0.65)).fill(incidenciaStatus.RESOLVED),
    ...Array(Math.ceil(count * 0.20)).fill(incidenciaStatus.PENDING),
    ...Array(Math.ceil(count * 0.10)).fill(incidenciaStatus.IN_PROGRESS),
    ...Array(Math.ceil(count * 0.05)).fill(incidenciaStatus.CLOSED),
  ];
}

/**
 * Rango de fechas para generar incidencias
 */
export const DATE_RANGE = {
  start: new Date('2025-01-01'),
  end: new Date('2025-11-30'),
};

/**
 * Días para resolución (1-5 días)
 */
export const RESOLUTION_DAYS = {
  min: 1,
  max: 5,
};
