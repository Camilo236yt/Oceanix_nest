import { Response, CookieOptions } from 'express';
import { COOKIE_CONFIG, COOKIE_OPTIONS } from '../constants';

export class CookieHelper {
  /**
   * Configuración de cookies para producción/desarrollo
   *
   * IMPORTANTE: Se usa domain wildcard '.oceanix.space' para que la cookie
   * sea accesible desde todos los subdominios (frontend y backend).
   *
   * La cookie se comparte entre subdominios, pero la seguridad se mantiene mediante:
   * - httpOnly: true (JavaScript no puede acceder)
   * - secure: true (solo HTTPS)
   * - sameSite: 'none' (permite requests cross-origin)
   * - Validación en frontend: limpia sesión si subdomain no coincide con empresa
   * - Validación en backend: verifica que subdomain coincida con usuario.enterprise
   *
   * Esto permite persistencia al recargar la página mientras mantiene aislamiento
   * entre tenants mediante validación en ambos lados.
   */
  private static getCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const envOptions = isProduction ? COOKIE_OPTIONS.PRODUCTION : COOKIE_OPTIONS.DEVELOPMENT;

    return {
      ...envOptions,
      maxAge: COOKIE_CONFIG.MAX_AGE,
      path: COOKIE_CONFIG.PATH,
      domain: COOKIE_CONFIG.DOMAIN, // '.oceanix.space' - wildcard para todos los subdominios
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
