import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Configuración de CORS para multi-tenancy
 * Permite oceanix.space y todos sus subdominios dinámicos
 */
export function getCorsConfig(): CorsOptions {
  const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

  // Lista de URLs permitidas
  const allowedOrigins = [
    apiBaseUrl,
    frontendUrl,
    'https://oceanix.space',
    'http://oceanix.space',
    'http://localhost:3000',
    'http://localhost:4200',
    'http://localhost:4300',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:4200',
  ].filter(Boolean);

  // Función para validar origen
  const corsOriginValidator = (
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Permitir requests sin origin (Postman, mobile apps, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Permitir todos los subdominios de oceanix.space
    if (origin.includes('oceanix.space')) {
      return callback(null, true);
    }

    // Permitir localhost en desarrollo
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Verificar si está en la lista de permitidos
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Rechazar otros orígenes
    console.warn(`🚫 CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'), false);
  };

  const corsConfig: CorsOptions = {
    origin: corsOriginValidator,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Cookie',
      'Accept',
      'Origin',
      'X-Requested-With',
      'X-Tenant-Id',
      'Cache-Control',
    ],
    exposedHeaders: ['Set-Cookie', 'Authorization', 'X-Tenant-Id'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // Cache preflight por 24h
  };

  console.log('🌐 CORS configurado para:', allowedOrigins);
  console.log('✅ Aceptando todos los subdominios de oceanix.space');

  return corsConfig;
}
