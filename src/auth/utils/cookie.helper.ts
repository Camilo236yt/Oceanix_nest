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

    // En desarrollo (localhost), NO configurar domain para que funcione en localhost
    // En producción, usar el domain wildcard '.oceanix.space'
    const cookieOptions: CookieOptions = {
      ...envOptions,
      maxAge: COOKIE_CONFIG.MAX_AGE,
      path: COOKIE_CONFIG.PATH,
    };

    // Solo agregar domain en producción
    if (isProduction) {
      cookieOptions.domain = COOKIE_CONFIG.DOMAIN;
    }

    return cookieOptions;
  }

  /**
   * Establece la cookie de autenticación
   * @param res Response object
   * @param token JWT token
   */
  static setAuthCookie(res: Response, token: string): void {
    const options = this.getCookieOptions();
    console.log(`🍪 Setting cookie "${COOKIE_CONFIG.NAME}" with options:`, JSON.stringify(options));
    console.log(`🎫 Token: ${token.substring(0, 20)}...${token.substring(token.length - 20)}`);
    res.cookie(COOKIE_CONFIG.NAME, token, options);
    console.log(`✅ Cookie "${COOKIE_CONFIG.NAME}" set successfully`);
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
