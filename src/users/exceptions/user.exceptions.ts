import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`El usuario con ID ${userId} no fue encontrado`, 'USER_NOT_FOUND');
  }
}

export class UserInactiveException extends BadRequestException {
  constructor(userId: string) {
    super(`El usuario con ID ${userId} está inactivo`, 'USER_INACTIVE');
  }
}

export class EmailAlreadyRegisteredExceptionUser extends ConflictException {
  constructor(email: string) {
    super(`El correo electrónico ${email} ya está registrado`, 'EMAIL_ALREADY_REGISTERED');
  }
}

export class InvalidRoleException extends BadRequestException {
  constructor(roleIds: string[]) {
    super(
      `Los siguientes roles no existen o están inactivos: ${roleIds.join(', ')}`,
      'INVALID_ROLE'
    );
  }
}

export class UserDatabaseException extends BadRequestException {
  constructor(operation: string, error?: string) {
    super(
      `Error en la base de datos durante ${operation}${error ? `: ${error}` : ''}`,
      'USER_DATABASE_ERROR'
    );
  }
}

export class MissingRolesException extends BadRequestException {
  constructor() {
    super('Los usuarios del sistema deben tener al menos un rol asignado', 'MISSING_ROLES');
  }
}

export class PasswordMismatchException extends BadRequestException {
  constructor() {
    super('Las contraseñas no coinciden', 'PASSWORD_MISMATCH');
  }
}
