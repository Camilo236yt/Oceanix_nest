import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserType } from '../../users/entities/user.entity';

export const ALLOWED_USER_TYPES = 'allowed_user_types';

export const AllowedUserTypes = (...userTypes: UserType[]) => {
  return (target: any, key?: any, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      // Method decorator
      Reflect.defineMetadata(ALLOWED_USER_TYPES, userTypes, descriptor.value);
    } else {
      // Class decorator
      Reflect.defineMetadata(ALLOWED_USER_TYPES, userTypes, target);
    }
    return target;
  };
};

@Injectable()
export class UserTypeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedTypes = this.reflector.getAllAndOverride<UserType[]>(
      ALLOWED_USER_TYPES,
      [context.getHandler(), context.getClass()]
    );

    // If no types are specified, allow all
    if (!allowedTypes || allowedTypes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userType) {
      throw new ForbiddenException('User type not found');
    }

    if (!allowedTypes.includes(user.userType)) {
      throw new ForbiddenException(
        `User type '${user.userType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }

    return true;
  }
}
