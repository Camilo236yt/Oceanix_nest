import { HttpStatus } from '@nestjs/common';

/**
 * Mapeo de códigos HTTP a códigos de error amigables
 *
 * Estos códigos se usan en las respuestas de error para identificar
 * el tipo de error de forma consistente en toda la aplicación
 */
export const ERROR_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'RESOURCE_NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
} as const;

/**
 * Mensajes de error por defecto en español
 *
 * Estos mensajes se muestran al usuario cuando no hay un mensaje
 * personalizado para el error
 */
export const ERROR_MESSAGES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'La solicitud no es válida o contiene parámetros incorrectos',
  [HttpStatus.UNAUTHORIZED]: 'Acceso no autorizado. Se requiere autenticación',
  [HttpStatus.FORBIDDEN]: 'Acceso prohibido. No tienes permisos suficientes',
  [HttpStatus.NOT_FOUND]: 'El recurso solicitado no fue encontrado',
  [HttpStatus.CONFLICT]: 'Conflicto con el estado actual del recurso',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Los datos proporcionados no pueden ser procesados',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Demasiadas solicitudes. Intenta de nuevo más tarde',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Ha ocurrido un error interno. Nuestro equipo ha sido notificado',
} as const;
