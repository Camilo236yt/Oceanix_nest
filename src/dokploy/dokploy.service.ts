import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DokployDomainCreateRequest,
  DokployDomainResponse,
} from './interfaces/dokploy-api.interface';

@Injectable()
export class DokployService {
  private readonly logger = new Logger(DokployService.name);
  private readonly dokployApiUrl: string;
  private readonly dokployApiToken: string;
  private readonly frontendAppId: string;
  private readonly appDomain: string;

  constructor(private configService: ConfigService) {
    this.dokployApiUrl = this.configService.get<string>('DOKPLOY_API_URL') || '';
    this.dokployApiToken = this.configService.get<string>('DOKPLOY_API_TOKEN') || '';
    this.frontendAppId = this.configService.get<string>(
      'DOKPLOY_FRONTEND_APP_ID',
    ) || '';
    this.appDomain = this.configService.get<string>('APP_DOMAIN') || 'oceanix.space';

    if (!this.dokployApiUrl || !this.dokployApiToken || !this.frontendAppId) {
      this.logger.warn(
        'Dokploy API credentials not configured. Domain creation will be skipped.',
      );
    }
  }

  /**
   * Crea un nuevo dominio en Dokploy para el subdominio especificado
   * @param subdomain El subdominio a crear (ej: "tap")
   * @returns Promise<DokployDomainResponse> o null si falla
   */
  async createDomain(subdomain: string): Promise<DokployDomainResponse | null> {
    if (!this.isConfigured()) {
      this.logger.warn(
        `Dokploy not configured. Skipping domain creation for ${subdomain}`,
      );
      return null;
    }

    const fullDomain = `${subdomain}.${this.appDomain}`;

    this.logger.log(`Creating domain in Dokploy: ${fullDomain}`);

    const payload: DokployDomainCreateRequest = {
      host: fullDomain,
      path: '/',
      port: 80,
      https: true,
      applicationId: this.frontendAppId,
      certificateType: 'letsencrypt',
      domainType: 'application',
    };

    try {
      const response = await fetch(`${this.dokployApiUrl}/domain.create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.dokployApiToken}`,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(
          `Failed to create domain in Dokploy: ${response.status}`,
          errorData,
        );
        throw new InternalServerErrorException(
          `Failed to create domain: ${errorData.message || response.statusText}`,
        );
      }

      const data = await response.json();
      this.logger.log(`Successfully created domain: ${fullDomain}`, data);

      return data as DokployDomainResponse;
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.error(`Timeout creating domain: ${fullDomain}`);
      } else {
        this.logger.error(
          `Error creating domain: ${fullDomain}`,
          error.message,
        );
      }

      // No lanzamos el error para no bloquear el registro de la empresa
      // La empresa se creó exitosamente, solo falló la creación del dominio
      return null;
    }
  }

  /**
   * Elimina un dominio de Dokploy
   * @param domainId ID del dominio a eliminar
   * @returns Promise<boolean> true si se eliminó correctamente
   */
  async deleteDomain(domainId: string): Promise<boolean> {
    if (!this.isConfigured()) {
      this.logger.warn('Dokploy not configured. Skipping domain deletion');
      return false;
    }

    this.logger.log(`Deleting domain from Dokploy: ${domainId}`);

    try {
      const response = await fetch(`${this.dokployApiUrl}/domain.delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.dokployApiToken}`,
        },
        body: JSON.stringify({ domainId }),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        this.logger.error(
          `Failed to delete domain in Dokploy: ${response.status}`,
          errorData,
        );
        return false;
      }

      this.logger.log(`Successfully deleted domain: ${domainId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting domain: ${domainId}`, error.message);
      return false;
    }
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  private isConfigured(): boolean {
    return !!(
      this.dokployApiUrl &&
      this.dokployApiToken &&
      this.frontendAppId
    );
  }
}
