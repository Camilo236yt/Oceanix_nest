import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants';

/**
 * Filtro global que captura todas las excepciones HTTP y las formatea
 * en una estructura de respuesta consistente
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Construir respuesta de error
    const errorResponse = this.isValidationError(status, exceptionResponse)
      ? this.buildValidationErrorResponse(exceptionResponse, status, request)
      : this.buildStandardErrorResponse(exception, status, request);

    // Enviar respuesta
    response.status(status).json(errorResponse);
  }

  /**
   * Verifica si es un error de validación (class-validator)
   */
  private isValidationError(status: number, exceptionResponse: any): boolean {
    return (
      status === HttpStatus.BAD_REQUEST &&
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    );
  }

  /**
   * Construye respuesta para errores de validación
   */
  private buildValidationErrorResponse(
    exceptionResponse: any,
    status: number,
    request: Request,
  ): ErrorResponse {
    const validationErrors = Array.isArray(exceptionResponse.message)
      ? exceptionResponse.message
      : [exceptionResponse.message];

    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Los datos proporcionados no cumplen con los requisitos esperados',
        details: validationErrors,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
      statusCode: status,
    };
  }

  /**
   * Construye respuesta para errores estándar
   */
  private buildStandardErrorResponse(
    exception: HttpException,
    status: number,
    request: Request,
  ): ErrorResponse {
    const exceptionResponse = exception.getResponse();

    return {
      success: false,
      error: {
        code: this.extractErrorCode(exceptionResponse, status),
        message: this.extractErrorMessage(exceptionResponse, status),
        timestamp: new Date().toISOString(),
        path: request.url,
      },
      statusCode: status,
    };
  }

  /**
   * Extrae el código de error personalizado o usa el predeterminado
   */
  private extractErrorCode(exceptionResponse: any, status: number): string {
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'error' in exceptionResponse &&
      typeof exceptionResponse.error === 'string'
    ) {
      return exceptionResponse.error;
    }

    return ERROR_CODES[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Extrae el mensaje de error personalizado o usa el predeterminado
   */
  private extractErrorMessage(exceptionResponse: any, status: number): string {
    // Si es un string simple
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    // Si tiene un campo message
    if (
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'message' in exceptionResponse
    ) {
      const message = exceptionResponse.message;
      return Array.isArray(message) ? message[0] : message;
    }

    // Mensaje por defecto
    return ERROR_MESSAGES[status] || 'Ha ocurrido un error inesperado';
  }
}
