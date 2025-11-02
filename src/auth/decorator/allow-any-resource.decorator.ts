import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANY_RESOURCE_KEY = 'allow_any_resource';

/**
 * Decorador para permitir acceso a cualquier recurso sin validación de ownership
 * Úsalo solo en endpoints que tienen validación de permisos específicos
 */
export const AllowAnyResource = () => SetMetadata(ALLOW_ANY_RESOURCE_KEY, true);