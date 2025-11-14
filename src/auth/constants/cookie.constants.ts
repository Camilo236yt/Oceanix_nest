export const COOKIE_CONFIG = {
  NAME: 'authToken',
  MAX_AGE: 24 * 60 * 60 * 1000, // 24 horas en milisegundos
  PATH: '/',
} as const;

export const COOKIE_OPTIONS = {
  PRODUCTION: {
    httpOnly: true,
    secure: true,
    sameSite: 'none' as const,
  },
  DEVELOPMENT: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax' as const,
  },
} as const;
