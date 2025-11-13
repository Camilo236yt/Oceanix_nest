import { Injectable, NestMiddleware,  } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que extrae el subdomain del request
 *
 * Prioridades:
 * 1. Header X-Subdomain (enviado explícitamente por el cliente)
 * 2. Header Origin/Referer (extraído automáticamente del origen de la petición)
 *
 * Ejemplos:
 * - Origin: https://techcorp.oceanix.space -> extrae "techcorp"
 * - X-Subdomain: techcorp -> extrae "techcorp"
 */
@Injectable()
export class SubdomainMiddleware implements NestMiddleware {

  use(req: Request, res: Response, next: NextFunction) {
    // Prioridad 1: Header X-Subdomain (control explícito del cliente)
    const xSubdomain = req.headers['x-subdomain'] as string;
    if (xSubdomain) {
      req['subdomain'] = xSubdomain;
      console.log('🔵 Subdomain from X-Subdomain header:', xSubdomain);
      return next();
    }

    // Prioridad 2: Extraer del Origin/Referer (automático desde el origen de la petición)
    const origin = req.headers.origin || req.headers.referer;
    if (origin) {
      try {
        const url = new URL(origin);
        const hostname = url.hostname;
        const hostParts = hostname.split('.');

        // Si hay al menos 3 partes (subdomain.domain.tld), extraer el subdomain
        if (hostParts.length >= 3 && hostParts[0] !== 'www') {
          req['subdomain'] = hostParts[0];
          console.log('🟢 Subdomain from Origin:', hostParts[0]);
          return next();
        }
      } catch (error) {
        // Si hay error parseando la URL, continuar
        console.log('⚠️  Error parsing Origin/Referer:', error.message);
      }
    }

    // No se encontró subdomain
    req['subdomain'] = undefined;
    console.log('🔴 No subdomain found');
    next();
  }
}