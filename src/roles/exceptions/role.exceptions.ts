import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

export class RoleNotFoundException extends NotFoundException {
  constructor(roleId: string) {
    super(`El rol con ID ${roleId} no fue encontrado`, 'ROLE_NOT_FOUND');
  }
}

export class RoleDuplicateException extends ConflictException {
  constructor(roleName: string) {
    super(`El rol con nombre '${roleName}' ya existe`, 'ROLE_DUPLICATE');
  }
}

export class InvalidPermissionException extends BadRequestException {
  constructor(permissionIds: string[]) {
    super(
      `Los siguientes permisos no existen: ${permissionIds.join(', ')}`,
      'INVALID_PERMISSION'
    );
  }
}

export class RoleDatabaseException extends BadRequestException {
  constructor(operation: string, error?: string) {
    super(
      `Error en la base de datos durante ${operation}${error ? `: ${error}` : ''}`,
      'ROLE_DATABASE_ERROR'
    );
  }
}
