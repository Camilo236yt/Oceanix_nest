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
  CANCELLED_SUCCESSFULLY: 'Incidencia cancelada exitosamente',
  DELETED_BY_CLIENT_SUCCESSFULLY: 'Incidencia eliminada exitosamente',

  // Errores
  NOT_FOUND: 'Incidencia no encontrada',
  TENANT_REQUIRED: 'enterpriseId es requerido para crear incidencias',
  USER_REQUIRED: 'userId es requerido para crear incidencias',
  MAX_IMAGES_EXCEEDED: 'Máximo 5 imágenes permitidas',
  IMAGE_NOT_FOUND: 'Imagen no encontrada para esta incidencia',
  IMAGE_NOT_FOUND_TENANT: 'Imagen no encontrada para este tenant',
  DUPLICATE_ERROR: 'Error: registro duplicado',
  CANNOT_CANCEL: 'No puedes cancelar una incidencia que ya está resuelta o cerrada',
  CANNOT_DELETE: 'Solo puedes eliminar incidencias en estado PENDING o CANCELLED',
  NOT_OWNER: 'No tienes permiso para realizar esta acción en esta incidencia',

  // Asignación
  NO_EMPLOYEES_AVAILABLE: 'No hay empleados disponibles para asignación',
  ASSIGNED_SUCCESSFULLY: 'Incidencia asignada exitosamente',
};

// Configuración de alertas/semáforo (basado en MINUTOS desde creación)
export const ALERT_CONFIG = {
  // Rangos de minutos para cada nivel (desde createdAt)
  GREEN_MAX_MINUTES: 1,    // 0-1 minutos: Verde (recién creada)
  YELLOW_MAX_MINUTES: 3,   // 2-3 minutos: Amarillo (advertencia)
  ORANGE_MAX_MINUTES: 5,   // 4-5 minutos: Naranja (urgente)
  RED_MIN_MINUTES: 6,      // 6+ minutos: Rojo (crítico)

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
  // Ejecutar cada 1 minuto para monitoreo en tiempo real
  ALERT_CHECK_SCHEDULE: '*/1 * * * *', // Cada 1 minuto
};
