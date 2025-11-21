import { TipoIncidencia, IncidenciaStatus } from '../../incidencias/enums/incidencia.enums';

/**
 * Configuración para generación de incidencias por tipo
 */
export interface IncidenciaTypeConfig {
  tipo: TipoIncidencia;
  count: number; // Cantidad por empresa
  prefix: string; // Prefijo para el nombre
}

/**
 * Distribución de incidencias por tipo - Empresa 1 (TechCorp - más incidencias)
 */
export const INCIDENCIAS_CONFIG_ENTERPRISE_1: IncidenciaTypeConfig[] = [
  { tipo: TipoIncidencia.POR_PERDIDA, count: 18, prefix: 'Pérdida' },
  { tipo: TipoIncidencia.POR_DANO, count: 12, prefix: 'Daño' },
  { tipo: TipoIncidencia.POR_ERROR_HUMANO, count: 7, prefix: 'Error Humano' },
  { tipo: TipoIncidencia.POR_MANTENIMIENTO, count: 4, prefix: 'Mantenimiento' },
  { tipo: TipoIncidencia.POR_FALLA_TECNICA, count: 3, prefix: 'Falla Técnica' },
  { tipo: TipoIncidencia.OTRO, count: 8, prefix: 'Otros' },
];

/**
 * Distribución de incidencias por tipo - Empresa 2 (LogiTrans - cantidad media)
 */
export const INCIDENCIAS_CONFIG_ENTERPRISE_2: IncidenciaTypeConfig[] = [
  { tipo: TipoIncidencia.POR_PERDIDA, count: 10, prefix: 'Pérdida' },
  { tipo: TipoIncidencia.POR_DANO, count: 8, prefix: 'Daño' },
  { tipo: TipoIncidencia.POR_ERROR_HUMANO, count: 4, prefix: 'Error Humano' },
  { tipo: TipoIncidencia.POR_MANTENIMIENTO, count: 3, prefix: 'Mantenimiento' },
  { tipo: TipoIncidencia.POR_FALLA_TECNICA, count: 2, prefix: 'Falla Técnica' },
  { tipo: TipoIncidencia.OTRO, count: 5, prefix: 'Otros' },
];

/**
 * Distribución de incidencias por tipo - Empresa 3 (ServiExpress - menos incidencias)
 */
export const INCIDENCIAS_CONFIG_ENTERPRISE_3: IncidenciaTypeConfig[] = [
  { tipo: TipoIncidencia.POR_PERDIDA, count: 6, prefix: 'Pérdida' },
  { tipo: TipoIncidencia.POR_DANO, count: 4, prefix: 'Daño' },
  { tipo: TipoIncidencia.POR_ERROR_HUMANO, count: 2, prefix: 'Error Humano' },
  { tipo: TipoIncidencia.POR_MANTENIMIENTO, count: 2, prefix: 'Mantenimiento' },
  { tipo: TipoIncidencia.POR_FALLA_TECNICA, count: 1, prefix: 'Falla Técnica' },
  { tipo: TipoIncidencia.OTRO, count: 3, prefix: 'Otros' },
];

/**
 * Array de configuraciones por empresa (índice 0, 1, 2)
 */
export const INCIDENCIAS_CONFIG_BY_ENTERPRISE: IncidenciaTypeConfig[][] = [
  INCIDENCIAS_CONFIG_ENTERPRISE_1,
  INCIDENCIAS_CONFIG_ENTERPRISE_2,
  INCIDENCIAS_CONFIG_ENTERPRISE_3,
];

/**
 * Configuración por defecto (para mantener compatibilidad)
 * @deprecated Use INCIDENCIAS_CONFIG_BY_ENTERPRISE instead
 */
export const INCIDENCIAS_CONFIG: IncidenciaTypeConfig[] = INCIDENCIAS_CONFIG_ENTERPRISE_1;

/**
 * Distribución de estados para las incidencias
 * Según el dashboard: Resueltas: 65%, Pendientes: 28%, Críticas (IN_PROGRESS): 10%
 */
export function getStatusDistribution(count: number): IncidenciaStatus[] {
  return [
    ...Array(Math.ceil(count * 0.65)).fill(IncidenciaStatus.RESOLVED),
    ...Array(Math.ceil(count * 0.20)).fill(IncidenciaStatus.PENDING),
    ...Array(Math.ceil(count * 0.10)).fill(IncidenciaStatus.IN_PROGRESS),
    ...Array(Math.ceil(count * 0.05)).fill(IncidenciaStatus.CLOSED),
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
