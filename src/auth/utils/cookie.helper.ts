import { Response, CookieOptions } from 'express';
import { COOKIE_CONFIG, COOKIE_OPTIONS } from '../constants';

export class CookieHelper {
  /**
   * Configuración de cookies para producción/desarrollo
   */
  private static getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const envOptions = isProduction ? COOKIE_OPTIONS.PRODUCTION : COOKIE_OPTIONS.DEVELOPMENT;

    return {
      ...envOptions,
      maxAge: COOKIE_CONFIG.MAX_AGE,
      domain: isProduction ? process.env.COOKIE_DOMAIN : undefined,
      path: COOKIE_CONFIG.PATH,
    };
  }

  /**
   * Establece la cookie de autenticación
   */
  static setAuthCookie(res: Response, token: string): void {
    res.cookie(COOKIE_CONFIG.NAME, token, this.getCookieOptions());
  }

  /**
   * Limpia la cookie de autenticación
   */
  static clearAuthCookie(res: Response): void {
    const options = this.getCookieOptions();
    res.clearCookie(COOKIE_CONFIG.NAME, options);
  }

  /**
   * Obtiene el nombre de la cookie
   */
  static getCookieName(): string {
    return COOKIE_CONFIG.NAME;
  }
}
