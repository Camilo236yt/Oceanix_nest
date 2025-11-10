/**
 * Interfaces para la API de Dokploy
 * Documentación: https://docs.dokploy.com/docs/api
 */

export interface DokployDomainCreateRequest {
  host: string;
  path?: string;
  port?: number;
  https?: boolean;
  applicationId?: string;
  certificateType?: 'letsencrypt' | 'none';
  composeId?: string;
  serviceName?: string;
  domainType?: 'compose' | 'application';
}

export interface DokployDomainResponse {
  domainId: string;
  host: string;
  certificateType: string;
  https: boolean;
  port: number;
  createdAt: string;
}

export interface DokployApiError {
  message: string;
  statusCode: number;
  error?: string;
}
