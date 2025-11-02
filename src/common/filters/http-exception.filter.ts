import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
    timestamp: string;
    path: string;
  };
  statusCode: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const timestamp = new Date().toISOString();
    const path = request.url;

    const exceptionResponse = exception.getResponse();
    let errorResponse: ErrorResponse;

    // Handle validation errors (class-validator)
    if (status === HttpStatus.BAD_REQUEST && typeof exceptionResponse === 'object' && exceptionResponse !== null && 'message' in exceptionResponse) {
      const validationErrors = Array.isArray((exceptionResponse as any).message)
        ? (exceptionResponse as any).message
        : [(exceptionResponse as any).message];

      errorResponse = {
        success: false,
        error: {
          code: this.getErrorCode(exception, 'BAD_REQUEST'),
          message: 'Los datos proporcionados no cumplen con los requisitos esperados',
          details: validationErrors,
          timestamp,
          path,
        },
        statusCode: status,
      };
    } else {
      errorResponse = {
        success: false,
        error: {
          code: this.getErrorCode(exception, this.getDefaultErrorCode(status)),
          message: this.getErrorMessage(exception, status),
          timestamp,
          path,
        },
        statusCode: status,
      };
    }

    this.logger.error(
      `HTTP Exception: ${status} - ${errorResponse.error.message}`,
      `Path: ${path}`,
    );

    response.status(status).json(errorResponse);
  }

  private getErrorCode(exception: HttpException, defaultCode: string): string {
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null && 'error' in response && typeof response.error === 'string') {
      return response.error;
    }
    return defaultCode;
  }

  private getErrorMessage(exception: HttpException, status: number): string {
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null && 'message' in response) {
      const message = (response as any).message;
      return Array.isArray(message) ? message[0] : message;
    }

    return this.getDefaultErrorMessage(status);
  }

  private getDefaultErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'RESOURCE_NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  private getDefaultErrorMessage(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'La solicitud no es válida o contiene parámetros incorrectos';
      case HttpStatus.UNAUTHORIZED:
        return 'Acceso no autorizado. Se requiere autenticación';
      case HttpStatus.FORBIDDEN:
        return 'Acceso prohibido. No tienes permisos suficientes';
      case HttpStatus.NOT_FOUND:
        return 'El recurso solicitado no fue encontrado';
      case HttpStatus.CONFLICT:
        return 'Conflicto con el estado actual del recurso';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Los datos proporcionados no pueden ser procesados';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'Demasiadas solicitudes. Intenta de nuevo más tarde';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Ha ocurrido un error interno. Nuestro equipo ha sido notificado';
      default:
        return 'Ha ocurrido un error inesperado';
    }
  }
}
