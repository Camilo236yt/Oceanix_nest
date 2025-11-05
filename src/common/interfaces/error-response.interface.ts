/**
 * Estructura de respuesta de error estandarizada
 *
 * Todas las respuestas de error en la aplicación siguen este formato
 * para mantener consistencia en la API
 *
 * @example
 * {
 *   success: false,
 *   error: {
 *     code: "RESOURCE_NOT_FOUND",
 *     message: "El recurso solicitado no fue encontrado",
 *     timestamp: "2025-11-04T23:45:00.000Z",
 *     path: "/api/v1/users/999"
 *   },
 *   statusCode: 404
 * }
 */
export interface ErrorResponse {
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
