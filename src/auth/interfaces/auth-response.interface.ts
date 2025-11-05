/**
 * DTO de respuesta unificado para autenticación
 * Usado en login, register y registerEnterprise
 */
export interface AuthResponseDto {
  id: string;
  email: string;
  name: string;
  lastName: string;
  token: string;
  message?: string; // Opcional: usado en registro para dar info adicional
}
