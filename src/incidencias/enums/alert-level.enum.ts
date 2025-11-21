import { ALERT_CONFIG } from '../constants';

/**
 * Niveles de alerta para incidencias basado en días sin atender
 * Sistema de semáforo para priorización
 */
export enum AlertLevel {
  // 0-5 días - Sin problemas
  GREEN = 'GREEN',

  // 6-10 días - Advertencia
  YELLOW = 'YELLOW',

  // 11-12 días - Urgente
  ORANGE = 'ORANGE',

  // 13-15 días - Crítico
  RED = 'RED',
}

/**
 * Determina el nivel de alerta basado en los días sin actualización
 */
export function getAlertLevel(daysSinceUpdate: number): AlertLevel {
  if (daysSinceUpdate <= ALERT_CONFIG.GREEN_MAX_DAYS) return AlertLevel.GREEN;
  if (daysSinceUpdate <= ALERT_CONFIG.YELLOW_MAX_DAYS) return AlertLevel.YELLOW;
  if (daysSinceUpdate <= ALERT_CONFIG.ORANGE_MAX_DAYS) return AlertLevel.ORANGE;
  return AlertLevel.RED;
}
