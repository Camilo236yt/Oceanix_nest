import { ALERT_CONFIG } from '../constants';

/**
 * Niveles de alerta para incidencias basado en minutos desde creación
 * Sistema de semáforo para priorización
 */
export enum AlertLevel {
  // 0-1 minutos - Sin problemas (recién creada)
  GREEN = 'GREEN',

  // 2-3 minutos - Advertencia
  YELLOW = 'YELLOW',

  // 4-5 minutos - Urgente
  ORANGE = 'ORANGE',

  // 6+ minutos - Crítico
  RED = 'RED',
}

/**
 * Determina el nivel de alerta basado en los minutos transcurridos desde creación
 */
export function getAlertLevel(minutesSinceCreation: number): AlertLevel {
  if (minutesSinceCreation <= ALERT_CONFIG.GREEN_MAX_MINUTES) return AlertLevel.GREEN;
  if (minutesSinceCreation <= ALERT_CONFIG.YELLOW_MAX_MINUTES) return AlertLevel.YELLOW;
  if (minutesSinceCreation <= ALERT_CONFIG.ORANGE_MAX_MINUTES) return AlertLevel.ORANGE;
  return AlertLevel.RED;
}
