/**
 * Response DTO estandarizado para todas las respuestas HTTP
 */

export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  statusCode: number;
}

export interface ErrorDetail {
  field?: string;
  message: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    timestamp: string;
    path: string;
  };
  statusCode: number;
}

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Factory para crear respuestas de éxito
 */
export class ResponseFactory {
  static success<T>(data: T, statusCode: number = 200): SuccessResponse<T> {
    return {
      success: true,
      data,
      statusCode,
    };
  }

  static created<T>(data: T): SuccessResponse<T> {
    return this.success(data, 201);
  }

  static noContent(): SuccessResponse<null> {
    return this.success(null, 204);
  }

  static error(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: ErrorDetail[],
    path?: string
  ): ErrorResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        path: path || '/',
      },
      statusCode,
    };
  }
}
