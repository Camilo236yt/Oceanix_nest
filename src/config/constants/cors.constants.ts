/**
 * Constantes de configuración CORS para multi-tenancy
 */

// ============================================
// DOMINIO PRINCIPAL
// ============================================

/** Dominio principal de la plataforma */
export const MAIN_DOMAIN = 'oceanix.space';

// ============================================
// MÉTODOS Y HEADERS HTTP
// ============================================

/** Métodos HTTP permitidos en requests CORS */
export const ALLOWED_METHODS = [
  'GET',
  'POST',
  'PUT',
  'DELETE',
  'PATCH',
  'OPTIONS',
  'HEAD',
] as const;

/** Headers permitidos en requests CORS */
export const ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'Cookie',
  'Accept',
  'Origin',
  'X-Requested-With',
  'X-Tenant-Id',
  'X-Subdomain',
  'Cache-Control',
] as const;

/** Headers expuestos en responses CORS */
export const EXPOSED_HEADERS = [
  'Set-Cookie',
  'Authorization',
  'X-Tenant-Id',
] as const;

// ============================================
// CONFIGURACIÓN DE PREFLIGHT
// ============================================

/** Duración del cache de preflight en segundos (24 horas) */
export const PREFLIGHT_MAX_AGE = 86400;

/** Status code de respuesta exitosa para OPTIONS requests */
export const OPTIONS_SUCCESS_STATUS = 204;

// ============================================
// ORÍGENES PARA DESARROLLO
// ============================================

/** Puertos de localhost permitidos para desarrollo */
export const LOCALHOST_PORTS = [3000, 4200, 4300] as const;

/** Hosts locales permitidos */
export const LOCALHOST_HOSTS = ['localhost', '127.0.0.1'] as const;
