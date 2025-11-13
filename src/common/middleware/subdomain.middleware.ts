import { Injectable, NestMiddleware,  } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware que extrae el subdomain del request
 *
 * Prioridad:
 * 1. Header X-Subdomain (enviado explícitamente por el cliente)
 * 2. Header Host (subdomain del backend)
 *
 * Ejemplo Host: acme.forif.co -> extrae "acme"
 * Ejemplo Header: X-Subdomain: acme -> extrae "acme"
 *
 * Para desarrollo local, puedes usar:
 * - acme.localhost:3000
 * - Editar /etc/hosts para agregar subdominios personalizados
 * - Usar herramientas como ngrok con subdominios reales
 */
@Injectable()
export class SubdomainMiddleware implements NestMiddleware {

  use(req: Request, res: Response, next: NextFunction) {
    // Prioridad 1: Leer del header X-Subdomain (enviado por el frontend)
    const xSubdomain = req.headers['x-subdomain'] as string;
    console.log("middelware",xSubdomain);
    
    if (xSubdomain) {
      req['subdomain'] = xSubdomain;
      return next();
    }

    // Prioridad 2: Extraer del Host
    const host = req.headers.host || req.hostname;

    if (!host) {
      req['subdomain'] = undefined;
      return next();
    }

    // Extraer el subdomain del host
    // Ejemplo: acme.forif.co -> ["acme", "forif", "co"]
    const hostParts = host.split(':')[0].split('.');

    // Si hay al menos 3 partes (subdomain.domain.tld), extraer el subdomain
    if (hostParts.length >= 3) {
      const subdomain = hostParts[0];

      // Validar que el subdomain no sea "www" (caso especial)
      if (subdomain && subdomain !== 'www' && subdomain !== 'backend-dev') {
        req['subdomain'] = subdomain;
      } else {
        req['subdomain'] = undefined;
      }
    } else {
      // Para desarrollo local (localhost, 127.0.0.1, etc.)
      // O cuando se accede directamente al dominio principal
      req['subdomain'] = undefined;
    }

    next();
  }
}