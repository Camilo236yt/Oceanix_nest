import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UserType } from '../../users/entities/user.entity';

/**
 * Guard que valida el contexto de tenant (multi-tenancy)
 *
 * Validaciones:
 * 1. Usuario debe estar autenticado (tener JWT válido)
 * 2. Usuario debe tener enterpriseId (excepto SUPER_ADMIN)
 * 3. Si hay subdomain en el request, debe coincidir con el enterprise del usuario
 *
 * SUPER_ADMIN tiene acceso ilimitado y puede operar desde cualquier subdomain
 */
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const subdomain = request['subdomain']; // Agregado por SubdomainMiddleware

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // SUPER_ADMIN can access everything from any subdomain
    if (user.userType === UserType.SUPER_ADMIN) {
      request.tenantId = user.enterpriseId;
      return true;
    }

    // Other user types must have an enterpriseId
    if (!user.enterpriseId) {
      throw new ForbiddenException('Invalid tenant context: User has no enterprise assigned');
    }

    // Validate subdomain matches user's enterprise (if subdomain exists)
    if (subdomain && user.enterprise) {
      if (user.enterprise.subdomain !== subdomain) {
        throw new ForbiddenException(
          `Subdomain mismatch: Cannot access from '${subdomain}'. Please use: ${user.enterprise.subdomain}.oceanix.space`
        );
      }
    }

    // Add tenantId to request for easy access in services
    request.tenantId = user.enterpriseId;

    return true;
  }
}
