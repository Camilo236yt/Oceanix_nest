import { UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Las credenciales proporcionadas son inválidas', 'INVALID_CREDENTIALS');
  }
}

export class UserNotVerifiedException extends UnauthorizedException {
  constructor(email: string) {
    super(`El usuario ${email} aún no ha verificado su correo electrónico`, 'USER_NOT_VERIFIED');
  }
}

export class EmailAlreadyExistsException extends ConflictException {
  constructor(email: string) {
    super(`El correo electrónico ${email} ya está registrado`, 'EMAIL_ALREADY_EXISTS');
  }
}

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('El token proporcionado no es válido o ha expirado', 'INVALID_TOKEN');
  }
}

export class AuthDatabaseException extends BadRequestException {
  constructor(operation: string, error?: string) {
    super(
      `Error en la base de datos durante ${operation}${error ? `: ${error}` : ''}`,
      'AUTH_DATABASE_ERROR'
    );
  }
}
