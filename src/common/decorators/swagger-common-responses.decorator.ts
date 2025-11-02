import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiResponse
} from '@nestjs/swagger';

export function SwaggerAuthenticationResponses() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Token de autenticación inválido o ausente' }),
    ApiForbiddenResponse({ description: 'Permisos insuficientes para realizar esta acción' })
  );
}

export function SwaggerValidationResponses() {
  return applyDecorators(
    ApiBadRequestResponse({ description: 'Datos de entrada inválidos o formato incorrecto' })
  );
}

export function SwaggerResourceNotFoundResponse() {
  return applyDecorators(
    ApiNotFoundResponse({ description: 'El recurso solicitado no existe' })
  );
}

export function SwaggerResourceConflictResponse() {
  return applyDecorators(
    ApiConflictResponse({ description: 'El recurso ya existe o hay un conflicto' })
  );
}

export function SwaggerStandardCrudResponses() {
  return applyDecorators(
    SwaggerAuthenticationResponses(),
    SwaggerValidationResponses(),
    SwaggerResourceNotFoundResponse()
  );
}