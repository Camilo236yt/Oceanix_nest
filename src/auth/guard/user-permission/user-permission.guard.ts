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
      return false;
    }

    // Obtener todos los permisos del usuario de todos sus roles (incluyendo permisos heredados)
    const userPermissions = new Set<string>();
    
    for (const userRole of user.roles) {
      if (userRole.role && userRole.role.permissions) {
        for (const rolePermission of userRole.role.permissions) {
          if (rolePermission.permission && rolePermission.permission.isActive) {
            // Agregar el permiso principal
            userPermissions.add(rolePermission.permission.name);
            
            // Agregar permisos hijos (recursivo)
            this.addChildPermissions(rolePermission.permission, userPermissions);
            
            // Agregar permisos padre (heredados)
            this.addParentPermissions(rolePermission.permission, userPermissions);
          }
        }
      }
    }

    // Verificar que tenga TODOS los permisos requeridos
    return requiredPermissions.every(permission => 
      userPermissions.has(permission as string)
    );
  }

  /**
   * Agrega recursivamente todos los permisos hijos
   */
  private addChildPermissions(permission: any, userPermissions: Set<string>): void {
    if (permission.children && permission.children.length > 0) {
      for (const child of permission.children) {
        if (child.isActive) {
          userPermissions.add(child.name);
          // Recursión para permisos hijos de hijos
          this.addChildPermissions(child, userPermissions);
        }
      }
    }
  }

  /**
   * Agrega recursivamente todos los permisos padre (herencia hacia arriba)
   */
  private addParentPermissions(permission: any, userPermissions: Set<string>): void {
    if (permission.parent && permission.parent.isActive) {
      userPermissions.add(permission.parent.name);
      // Recursión para permisos padre de padre
      this.addParentPermissions(permission.parent, userPermissions);
    }
  }
}
