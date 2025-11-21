import { UserType } from 'src/users/entities/user.entity';

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
  userType?: UserType; // Opcional: tipo de usuario para el frontend
  message?: string; // Opcional: usado en registro para dar info adicional
}
