/**
 * Constantes del módulo de incidencias
 */

// Configuración de imágenes
export const INCIDENCIA_CONFIG = {
  MAX_IMAGES: 5,
  STORAGE_PATH: 'incidencias',
};

// Mensajes de respuesta
export const INCIDENCIA_MESSAGES = {
  // Éxito
  CREATED_SUCCESSFULLY: 'Incidencia creada exitosamente',
  UPDATED_SUCCESSFULLY: 'Incidencia actualizada exitosamente',
  DELETED_SUCCESSFULLY: 'Incidencia eliminada exitosamente',
  RESTORED_SUCCESSFULLY: 'Incidencia restaurada exitosamente',

  // Errores
  NOT_FOUND: 'Incidencia no encontrada',
  TENANT_REQUIRED: 'enterpriseId es requerido para crear incidencias',
  USER_REQUIRED: 'userId es requerido para crear incidencias',
  MAX_IMAGES_EXCEEDED: 'Máximo 5 imágenes permitidas',
  IMAGE_NOT_FOUND: 'Imagen no encontrada para esta incidencia',
  IMAGE_NOT_FOUND_TENANT: 'Imagen no encontrada para este tenant',
  DUPLICATE_ERROR: 'Error: registro duplicado',

  // Asignación
  NO_EMPLOYEES_AVAILABLE: 'No hay empleados disponibles para asignación',
  ASSIGNED_SUCCESSFULLY: 'Incidencia asignada exitosamente',
};

// Configuración de alertas/semáforo
export const ALERT_CONFIG = {
  // Rangos de días para cada nivel
  GREEN_MAX_DAYS: 5,
  YELLOW_MAX_DAYS: 10,
  ORANGE_MAX_DAYS: 12,
  RED_MIN_DAYS: 13,

  // Mensajes de notificación
  NOTIFICATION_TITLES: {
    YELLOW: '⚠️ Advertencia: Incidencia pendiente',
    ORANGE: '🟠 Urgente: Incidencia sin atender',
    RED: '🔴 CRÍTICO: Incidencia requiere atención inmediata',
    DEFAULT: 'Recordatorio: Incidencia pendiente',
  },
};

// Configuración del cronjob
export const CRON_CONFIG = {
  // Ejecutar cada 5 minutos para monitoreo en tiempo real
  ALERT_CHECK_SCHEDULE: '*/5 * * * *', // Cada 5 minutos
};
