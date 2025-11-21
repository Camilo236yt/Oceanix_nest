import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserType } from 'src/users/entities/user.entity';

/**
 * Guard que verifica que el usuario autenticado sea de tipo CLIENT
 * Se usa en conjunto con JwtAuthGuard
 */
@Injectable()
export class ClientAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    if (user.userType !== UserType.CLIENT) {
      throw new ForbiddenException('Este endpoint es solo para clientes');
    }

    return true;
  }
}
