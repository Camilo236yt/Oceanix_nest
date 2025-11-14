import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import {
  MAIN_DOMAIN,
  ALLOWED_METHODS,
  ALLOWED_HEADERS,
  EXPOSED_HEADERS,
  PREFLIGHT_MAX_AGE,
  OPTIONS_SUCCESS_STATUS,
  LOCALHOST_HOSTS,
} from './constants';

/**
 * Configuración de CORS para multi-tenancy
 * Permite oceanix.space y todos sus subdominios dinámicos
 */

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Verifica si un origen pertenece al dominio principal o subdominios
 */
function isMainDomainOrigin(origin: string): boolean {
  return origin.includes(MAIN_DOMAIN);
}

/**
 * Verifica si un origen es localhost (desarrollo)
 */
function isLocalhostOrigin(origin: string): boolean {
  return LOCALHOST_HOSTS.some((host) => origin.includes(host));
}

/**
 * Obtiene lista de orígenes permitidos explícitamente
 */
function getAllowedOrigins(): string[] {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  return [
    apiBaseUrl,
    frontendUrl,
    `https://${MAIN_DOMAIN}`,
    `http://${MAIN_DOMAIN}`,
    'http://localhost:3000',
    'http://localhost:4200',
    'http://localhost:4300',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4200',
  ].filter(Boolean);
}

/**
 * Valida si un origen tiene permitido hacer requests CORS
 */
function corsOriginValidator(
  origin: string,
  callback: (err: Error | null, allow?: boolean) => void,
): void {
  // Permitir requests sin origin (Postman, mobile apps, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // Permitir todos los subdominios de oceanix.space
  if (isMainDomainOrigin(origin)) {
    return callback(null, true);
  }

  // Permitir localhost en desarrollo
  if (isLocalhostOrigin(origin)) {
    return callback(null, true);
  }

  // Verificar si está en la lista de permitidos explícitos
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  // Rechazar otros orígenes
  console.warn(`🚫 CORS blocked origin: ${origin}`);
  callback(new Error('Not allowed by CORS'), false);
}

// ============================================
// CONFIGURACIÓN PRINCIPAL
// ============================================

/**
 * Obtiene la configuración completa de CORS
 */
export function getCorsConfig(): CorsOptions {
  const allowedOrigins = getAllowedOrigins();

  const corsConfig: CorsOptions = {
    origin: corsOriginValidator,
    credentials: true,
    methods: [...ALLOWED_METHODS],
    allowedHeaders: [...ALLOWED_HEADERS],
    exposedHeaders: [...EXPOSED_HEADERS],
    preflightContinue: false,
    optionsSuccessStatus: OPTIONS_SUCCESS_STATUS,
    maxAge: PREFLIGHT_MAX_AGE,
  };

  // Logs de configuración
  console.log('🌐 CORS configurado para:', allowedOrigins);
  console.log(`✅ Aceptando todos los subdominios de ${MAIN_DOMAIN}`);

  return corsConfig;
}
