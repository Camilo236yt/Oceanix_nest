import { Response, CookieOptions } from 'express';
import { COOKIE_CONFIG, COOKIE_OPTIONS } from '../constants';

export class CookieHelper {
  /**
   * Configuración de cookies para producción/desarrollo
   *
   * IMPORTANTE: NO se setea el domain de la cookie para que se vincule
   * automáticamente al hostname del servidor que la genera (backend-dev.oceanix.space).
   *
   * Con sameSite: 'none' + secure: true, permite requests cross-origin desde
   * otros subdomains, pero la cookie solo se envía al backend específico.
   *
   * Esto previene que la cookie se comparta entre diferentes subdomains de empresas,
   * manteniendo el aislamiento entre tenants.
   *
   * La seguridad se mantiene mediante:
   * - httpOnly: true (JavaScript no puede acceder)
   * - secure: true (solo HTTPS)
   * - sameSite: 'none' (permite requests cross-origin)
   * - domain: NO seteado (cookie vinculada al backend específico)
   */
  private static getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const envOptions = isProduction ? COOKIE_OPTIONS.PRODUCTION : COOKIE_OPTIONS.DEVELOPMENT;

    return {
      ...envOptions,
      maxAge: COOKIE_CONFIG.MAX_AGE,
      path: COOKIE_CONFIG.PATH,
      // NO setear domain - se vincula automáticamente al hostname del servidor
    };
  }

  /**
   * Establece la cookie de autenticación
   * @param res Response object
   * @param token JWT token
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
   * @param res Response object
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
