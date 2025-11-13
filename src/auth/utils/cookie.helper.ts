import { Response, CookieOptions } from 'express';
import { COOKIE_CONFIG, COOKIE_OPTIONS } from '../constants';

export class CookieHelper {
  /**
   * Configuración de cookies para producción/desarrollo
   *
   * IMPORTANTE: En arquitectura multi-tenant, se setea el domain específico
   * del subdomain de la empresa (ej: techsol-abc.oceanix.space) en lugar de
   * usar '.oceanix.space' (que compartiría entre todos los subdominios).
   *
   * Esto previene que la cookie persista al cambiar de subdomain.
   *
   * La seguridad se mantiene mediante:
   * - httpOnly: true (JavaScript no puede acceder)
   * - secure: true (solo HTTPS)
   * - sameSite: 'none' (permite requests cross-origin desde backend-dev)
   * - domain: subdomain específico de la empresa
   */
  private static getCookieOptions(subdomain?: string): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';
    const envOptions = isProduction ? COOKIE_OPTIONS.PRODUCTION : COOKIE_OPTIONS.DEVELOPMENT;

    const cookieOptions: CookieOptions = {
      ...envOptions,
      maxAge: COOKIE_CONFIG.MAX_AGE,
      path: COOKIE_CONFIG.PATH,
    };

    // Solo setear domain si estamos en producción con subdomain específico
    // En desarrollo, no setear domain para que funcione en localhost
    if (isProduction && subdomain) {
      // Usar subdomain específico en lugar de wildcard
      cookieOptions.domain = `${subdomain}.oceanix.space`;
    }

    return cookieOptions;
  }

  /**
   * Establece la cookie de autenticación
   * @param res Response object
   * @param token JWT token
   * @param subdomain Subdomain de la empresa para setear el domain de la cookie
   */
  static setAuthCookie(res: Response, token: string, subdomain?: string): void {
    const options = this.getCookieOptions(subdomain);

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
   * @param subdomain Subdomain de la empresa (debe coincidir con el usado al setear)
   */
  static clearAuthCookie(res: Response, subdomain?: string): void {
    const options = this.getCookieOptions(subdomain);
    res.clearCookie(COOKIE_CONFIG.NAME, options);
  }

  /**
   * Obtiene el nombre de la cookie
   */
  static getCookieName(): string {
    return COOKIE_CONFIG.NAME;
  }
}
