import { Response, CookieOptions } from 'express';
import { COOKIE_CONFIG, COOKIE_OPTIONS } from '../constants';

export class CookieHelper {
  /**
   * Configuración de cookies para producción/desarrollo
   *
   * IMPORTANTE: En arquitectura multi-tenant con backend en subdomain separado,
   * NO se debe setear el domain de la cookie. El navegador la asociará automáticamente
   * al subdomain del frontend que hizo la petición (gracias al header Origin).
   */
  private static getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const envOptions = isProduction ? COOKIE_OPTIONS.PRODUCTION : COOKIE_OPTIONS.DEVELOPMENT;

    return {
      ...envOptions,
      maxAge: COOKIE_CONFIG.MAX_AGE,
      // NO setear domain para permitir cookies cross-subdomain
      // La cookie se asociará al origen de la petición automáticamente
      path: COOKIE_CONFIG.PATH,
    };
  }

  /**
   * Establece la cookie de autenticación
   */
  static setAuthCookie(res: Response, token: string): void {
    const options = this.getCookieOptions();

    // Log detallado de la configuración
    console.log('🍪 Setting cookie:', {
      name: COOKIE_CONFIG.NAME,
      options,
      tokenLength: token?.length || 0,
    });

    // Setear la cookie
    res.cookie(COOKIE_CONFIG.NAME, token, options);

    // Verificar que se haya seteado en los headers
    const setCookieHeader = res.getHeader('Set-Cookie');
    console.log('📤 Set-Cookie header after setting:', setCookieHeader);
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
