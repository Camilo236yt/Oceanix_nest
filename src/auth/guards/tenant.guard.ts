import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UserType } from '../../users/entities/user.entity';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found in request');
    }

    // SUPER_ADMIN can access everything
    if (user.userType === UserType.SUPER_ADMIN) {
      return true;
    }

    // Other user types must have an enterpriseId
    if (!user.enterpriseId) {
      throw new ForbiddenException('Invalid tenant context');
    }

    // Add tenantId to request for easy access in services
    request.tenantId = user.enterpriseId;

    return true;
  }
}
