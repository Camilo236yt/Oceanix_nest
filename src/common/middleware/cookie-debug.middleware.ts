import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de debugging exhaustivo para cookies
 * Registra cada paso del proceso de cookies
 */
@Injectable()
export class CookieDebugMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const isAuthEndpoint = req.path.includes('/auth/');

    if (isAuthEndpoint) {
      console.group(`🔍 [Cookie Debug] ${req.method} ${req.path}`);
      console.log('📍 PASO A: Request recibido en backend');
      console.log('  Origin:', req.headers.origin);
      console.log('  Referer:', req.headers.referer);
      console.log('  Host:', req.headers.host);
      console.log('  Cookie header recibido:', req.headers.cookie || 'NINGUNO');
      console.log('  User-Agent:', req.headers['user-agent']?.substring(0, 50) + '...');

      // Interceptar res.cookie para ver cuándo se setea
      const originalCookie = res.cookie.bind(res);
      res.cookie = function (name: string, value: string, options?: any) {
        console.log('📍 PASO B: Backend seteando cookie');
        console.log('  Cookie name:', name);
        console.log('  Cookie value length:', value?.length || 0);
        console.log('  Cookie options:', JSON.stringify(options, null, 2));

        const result = originalCookie(name, value, options);

        // Verificar que se haya seteado en headers
        setTimeout(() => {
          const setCookieHeader = res.getHeader('Set-Cookie');
          console.log('📍 PASO C: Verificando Set-Cookie header');
          console.log('  Set-Cookie presente:', !!setCookieHeader);
          if (setCookieHeader) {
            console.log('  Set-Cookie value:', setCookieHeader);

            // Analizar la cookie
            const cookieStr = Array.isArray(setCookieHeader) ? setCookieHeader[0] : setCookieHeader;
            console.log('  🔍 Análisis de cookie:');
            console.log('    - HttpOnly:', cookieStr.includes('HttpOnly') ? '✅' : '❌');
            console.log('    - Secure:', cookieStr.includes('Secure') ? '✅' : '❌');
            console.log('    - SameSite:', cookieStr.match(/SameSite=(\w+)/)?.[1] || '❌ No definido');
            console.log('    - Domain:', cookieStr.match(/Domain=([^;]+)/)?.[1] || '❌ No definido');
            console.log('    - Path:', cookieStr.match(/Path=([^;]+)/)?.[1] || '/');
            console.log('    - Max-Age:', cookieStr.match(/Max-Age=(\d+)/)?.[1] || 'No definido');
          } else {
            console.error('❌ Set-Cookie header NO presente después de res.cookie()');
          }
        }, 0);

        return result;
      };

      // Interceptar cuando se envía la respuesta
      const originalSend = res.send.bind(res);
      res.send = function (body: any) {
        console.log('📍 PASO D: Enviando respuesta al cliente');
        console.log('  Status Code:', res.statusCode);

        const setCookieHeader = res.getHeader('Set-Cookie');
        if (setCookieHeader) {
          console.log('✅ Respuesta incluye Set-Cookie');
        } else {
          console.warn('⚠️  Respuesta NO incluye Set-Cookie');
        }

        // Verificar CORS headers
        console.log('  CORS Headers:');
        console.log('    - Access-Control-Allow-Origin:', res.getHeader('Access-Control-Allow-Origin') || '❌');
        console.log('    - Access-Control-Allow-Credentials:', res.getHeader('Access-Control-Allow-Credentials') || '❌');
        console.log('    - Access-Control-Expose-Headers:', res.getHeader('Access-Control-Expose-Headers') || '❌');

        console.groupEnd();
        return originalSend(body);
      };
    }

    next();
  }
}
