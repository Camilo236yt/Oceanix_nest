/**
 * Respuesta del endpoint de registro de empresa
 *
 * Retorna información necesaria para redirigir al usuario a su subdomain
 * y completar la activación de la cuenta
 */
export interface RegisterEnterpriseResponseDto {
  /** Subdomain de la empresa registrada */
  subdomain: string;

  /** Token temporal de activación (válido por 5 minutos) */
  activationToken: string;

  /** Mensaje de confirmación */
  message: string;

  /** URL completa para redirección automática */
  redirectUrl: string;
}
