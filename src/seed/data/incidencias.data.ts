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

/**
 * Incidencias personalizadas para clientes específicos
 * Estas se crean además de las auto-generadas
 */
export interface CustomIncidenciaData {
  clientEmail: string; // Email del cliente que creó la incidencia
  name: string;
  description: string;
  tipo: TipoIncidencia;
  status: IncidenciaStatus;
  ProducReferenceId: string;
  daysAgo: number; // Cuántos días atrás se creó
}

export const CUSTOM_INCIDENCIAS_DATA: CustomIncidenciaData[] = [
  {
    clientEmail: 'camargoandres507@gmail.com',
    name: 'Laptop Dell no enciende',
    description: 'La laptop Dell Inspiron 15 asignada a mi escritorio no enciende. La luz de carga parpadea pero la pantalla permanece negra.',
    tipo: TipoIncidencia.POR_FALLA_TECNICA,
    status: IncidenciaStatus.IN_PROGRESS,
    ProducReferenceId: 'INC-CAMARGO-001',
    daysAgo: 2,
  },
  {
    clientEmail: 'camargoandres507@gmail.com',
    name: 'Teclado mecánico con teclas pegadas',
    description: 'El teclado mecánico Logitech tiene las teclas W, A, S pegadas. Dificulta mi trabajo en diseño gráfico.',
    tipo: TipoIncidencia.POR_DANO,
    status: IncidenciaStatus.PENDING,
    ProducReferenceId: 'INC-CAMARGO-002',
    daysAgo: 5,
  },
  {
    clientEmail: 'camargoandres507@gmail.com',
    name: 'Monitor LG con manchas en pantalla',
    description: 'El monitor LG 27" tiene manchas oscuras en la esquina superior derecha que afectan la visualización de colores.',
    tipo: TipoIncidencia.POR_DANO,
    status: IncidenciaStatus.RESOLVED,
    ProducReferenceId: 'INC-CAMARGO-003',
    daysAgo: 15,
  },
  {
    clientEmail: 'camargoandres507@gmail.com',
    name: 'Mouse inalámbrico perdido',
    description: 'Extravié el mouse inalámbrico Logitech MX Master 3 durante la mudanza de oficina. Solicito reemplazo.',
    tipo: TipoIncidencia.POR_PERDIDA,
    status: IncidenciaStatus.PENDING,
    ProducReferenceId: 'INC-CAMARGO-004',
    daysAgo: 7,
  },
  {
    clientEmail: 'camargoandres507@gmail.com',
    name: 'Cable HDMI dañado',
    description: 'El cable HDMI de 2m que conecta mi laptop al monitor externo tiene el conector roto. No transmite señal.',
    tipo: TipoIncidencia.POR_DANO,
    status: IncidenciaStatus.CLOSED,
    ProducReferenceId: 'INC-CAMARGO-005',
    daysAgo: 30,
  },
  // Incidencias de Julio Bonifacio
  {
    clientEmail: 'juliobonifacio53@gmail.com',
    name: 'Impresora HP no imprime',
    description: 'La impresora HP LaserJet Pro asignada a mi área no imprime. La pantalla muestra error de atasco de papel pero no hay papel atascado.',
    tipo: TipoIncidencia.POR_FALLA_TECNICA,
    status: IncidenciaStatus.PENDING,
    ProducReferenceId: 'INC-BONIFACIO-001',
    daysAgo: 1,
  },
  {
    clientEmail: 'juliobonifacio53@gmail.com',
    name: 'Audífonos Bluetooth defectuosos',
    description: 'Los audífonos Sony WH-1000XM4 tienen problemas de conexión. Se desconectan cada 5 minutos.',
    tipo: TipoIncidencia.POR_DANO,
    status: IncidenciaStatus.IN_PROGRESS,
    ProducReferenceId: 'INC-BONIFACIO-002',
    daysAgo: 3,
  },
  {
    clientEmail: 'juliobonifacio53@gmail.com',
    name: 'Cargador de laptop extraviado',
    description: 'Olvidé el cargador original de mi laptop Dell en la sala de reuniones y no lo encuentro. Necesito uno de reemplazo.',
    tipo: TipoIncidencia.POR_PERDIDA,
    status: IncidenciaStatus.RESOLVED,
    ProducReferenceId: 'INC-BONIFACIO-003',
    daysAgo: 10,
  },
];
