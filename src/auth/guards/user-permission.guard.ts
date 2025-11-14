import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

import { META_PERMISSIONS, ALLOW_ANY_RESOURCE_KEY } from 'src/auth/decorator';
import { ValidPermission } from 'src/auth/interfaces/valid-permission';

@Injectable()
export class UserPermissionGuard implements CanActivate {

  constructor(
    private readonly reflector:Reflector
  ) {
    
  }



  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    
    const requiredPermissions: ValidPermission[] = this.reflector.get<ValidPermission[]>(META_PERMISSIONS, context.getHandler());
    const allowAnyResource: boolean = this.reflector.get<boolean>(ALLOW_ANY_RESOURCE_KEY, context.getHandler());
    
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    
    if (!user) {
      throw new NotFoundException('User not found in request');
    }

    // Si no se requieren permisos específicos = usuario normal (permitir acceso)
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Validar permisos CRM/Admin
    if (!this.hasRequiredPermissions(user, requiredPermissions)) {
      throw new ForbiddenException('Insufficient permissions for this action');
    }

    return true;
  }


  /**
   * Valida que el usuario tenga los permisos requeridos en sus roles
   */
  private hasRequiredPermissions(user: any, requiredPermissions: ValidPermission[]): boolean {
    if (!user.roles || user.roles.length === 0) {
      console.log('❌ User has no roles');
      return false;
    }

    // Obtener todos los permisos del usuario de todos sus roles
    const userPermissions = new Set<string>();

    // NUEVA ESTRUCTURA: roles es un array de JwtUserRole {id, name, permissions: string[]}
    for (const role of user.roles) {
      if (role.permissions && Array.isArray(role.permissions)) {
        // Los permisos ya vienen como array de strings (nombres de permisos)
        for (const permissionName of role.permissions) {
          userPermissions.add(permissionName);
        }
      }
    }

    console.log(`🔑 User ${user.email} permissions:`, Array.from(userPermissions).join(', '));
    console.log(`🔒 Required permissions:`, requiredPermissions.join(', '));

    // Verificar que tenga AL MENOS UNO de los permisos requeridos (OR logic)
    const hasPermission = requiredPermissions.some(permission =>
      userPermissions.has(permission as string)
    );

    if (!hasPermission) {
      console.log('❌ User does NOT have required permissions');
    } else {
      console.log('✅ User has required permissions');
    }

    return hasPermission;
  }
}
