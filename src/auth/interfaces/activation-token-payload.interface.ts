/**
 * Payload del JWT de activación
 *
 * Este token es temporal (5 min) y se usa para activar la cuenta
 * después del registro desde el subdomain correcto
 */
export interface ActivationTokenPayload {
  /** ID del usuario a activar */
  userId: string;

  /** Tipo de token para validación */
  type: 'ACTIVATION';

  /** Subdomain de la empresa del usuario */
  subdomain: string;
}
