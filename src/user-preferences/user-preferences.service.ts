import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationProviderPreference } from './entities';
import { ProviderType } from './enums';
import { UpdateProviderStatusDto, UpdateProviderConfigDto, ProviderResponseDto } from './dto';

@Injectable()
export class UserPreferencesService {
  private readonly logger = new Logger(UserPreferencesService.name);

  constructor(
    @InjectRepository(NotificationProviderPreference)
    private readonly providerPreferenceRepository: Repository<NotificationProviderPreference>,
  ) { }

  /**
   * Obtiene todas las preferencias de providers de notificación de un usuario
   * Si no existen, las crea con valores por defecto
   */
  async getNotificationProviders(userId: string): Promise<ProviderResponseDto[]> {
    // Obtener todas las preferencias del usuario
    const preferences = await this.providerPreferenceRepository.find({
      where: { userId },
    });

    // Si no existen, crear valores por defecto
    if (preferences.length === 0) {
      await this.initializeDefaultProviders(userId);
      return this.getNotificationProviders(userId);
    }

    // Mapear a DTO de respuesta
    return preferences.map(pref => this.mapToResponseDto(pref));
  }

  /**
   * Obtiene solo los providers activos de un usuario
   * Usado por NotificationService para saber por dónde enviar
   */
  async getActiveProviders(userId: string): Promise<NotificationProviderPreference[]> {
    return this.providerPreferenceRepository.find({
      where: { userId, isEnabled: true },
    });
  }

  /**
   * Obtiene un provider específico de un usuario
   */
  async getProvider(userId: string, providerType: ProviderType): Promise<ProviderResponseDto> {
    const preference = await this.findOrCreateProvider(userId, providerType);
    return this.mapToResponseDto(preference);
  }

  /**
   * Activa o desactiva un provider para un usuario
   */
  async updateProviderStatus(
    userId: string,
    providerType: ProviderType,
    dto: UpdateProviderStatusDto,
  ): Promise<ProviderResponseDto> {
    const preference = await this.findOrCreateProvider(userId, providerType);

    // Validar que el provider esté configurado si se quiere activar
    if (dto.isEnabled && !this.isProviderConfigured(preference)) {
      throw new BadRequestException(
        `Provider ${providerType} requires configuration before enabling`,
      );
    }

    preference.isEnabled = dto.isEnabled;
    const saved = await this.providerPreferenceRepository.save(preference);

    this.logger.log(
      `Provider ${providerType} ${dto.isEnabled ? 'enabled' : 'disabled'} for user ${userId}`,
    );

    return this.mapToResponseDto(saved);
  }

  /**
   * Actualiza la configuración de un provider
   */
  async updateProviderConfig(
    userId: string,
    providerType: ProviderType,
    dto: UpdateProviderConfigDto,
  ): Promise<ProviderResponseDto> {
    const preference = await this.findOrCreateProvider(userId, providerType);

    // Validar configuración según el tipo de provider
    this.validateProviderConfig(providerType, dto);

    // Actualizar configuración
    preference.config = {
      ...preference.config,
      ...dto,
    };

    const saved = await this.providerPreferenceRepository.save(preference);

    this.logger.log(`Provider ${providerType} configured for user ${userId}`);

    return this.mapToResponseDto(saved);
  }

  /**
   * Elimina la configuración de un provider (lo desactiva y limpia config)
   */
  async removeProvider(userId: string, providerType: ProviderType): Promise<void> {
    const preference = await this.providerPreferenceRepository.findOne({
      where: { userId, providerType },
    });

    if (!preference) {
      return;
    }

    preference.isEnabled = false;
    preference.config = null;
    await this.providerPreferenceRepository.save(preference);

    this.logger.log(`Provider ${providerType} removed for user ${userId}`);
  }

  /**
   * Inicializa providers por defecto para un usuario nuevo
   * EMAIL y WEBSOCKET activos por defecto
   */
  async initializeDefaultProviders(userId: string): Promise<void> {
    const defaultProviders = [
      {
        userId,
        providerType: ProviderType.EMAIL,
        isEnabled: true, // Email activo por defecto
        config: null,
      },
      {
        userId,
        providerType: ProviderType.WEBSOCKET,
        isEnabled: true, // WebSocket activo por defecto
        config: null,
      },
      {
        userId,
        providerType: ProviderType.TELEGRAM,
        isEnabled: false, // Telegram inactivo hasta que se configure
        config: null,
      },
      {
        userId,
        providerType: ProviderType.WHATSAPP,
        isEnabled: false, // WhatsApp inactivo hasta que se configure
        config: null,
      },
    ];

    await this.providerPreferenceRepository.save(defaultProviders);
    this.logger.log(`Default providers initialized for user ${userId}`);
  }

  /**
   * Busca o crea un provider para un usuario
   */
  private async findOrCreateProvider(
    userId: string,
    providerType: ProviderType,
  ): Promise<NotificationProviderPreference> {
    let preference = await this.providerPreferenceRepository.findOne({
      where: { userId, providerType },
    });

    if (!preference) {
      preference = this.providerPreferenceRepository.create({
        userId,
        providerType,
        isEnabled: false,
        config: null,
      });
      preference = await this.providerPreferenceRepository.save(preference);
    }

    return preference;
  }

  /**
   * Valida que la configuración sea válida según el tipo de provider
   */
  private validateProviderConfig(providerType: ProviderType, dto: UpdateProviderConfigDto): void {
    switch (providerType) {
      case ProviderType.TELEGRAM:
        if (!dto.chatId) {
          throw new BadRequestException('chatId is required for Telegram provider');
        }
        break;
      case ProviderType.WHATSAPP:
        if (!dto.phoneNumber) {
          throw new BadRequestException('phoneNumber is required for WhatsApp provider');
        }
        break;
      case ProviderType.EMAIL:
      case ProviderType.WEBSOCKET:
        // No requieren configuración adicional
        break;
    }
  }

  /**
   * Verifica si un provider está correctamente configurado
   */
  private isProviderConfigured(preference: NotificationProviderPreference): boolean {
    switch (preference.providerType) {
      case ProviderType.EMAIL:
      case ProviderType.WEBSOCKET:
        // Estos no requieren configuración adicional
        return true;
      case ProviderType.TELEGRAM:
        return !!preference.config?.chatId;
      case ProviderType.WHATSAPP:
        return !!preference.config?.phoneNumber && !!preference.config?.isVerified;
      default:
        return false;
    }
  }

  /**
   * Determina si un provider requiere configuración
   */
  private requiresConfiguration(providerType: ProviderType): boolean {
    return [ProviderType.TELEGRAM, ProviderType.WHATSAPP].includes(providerType);
  }

  /**
   * Mapea una entity a DTO de respuesta
   */
  private mapToResponseDto(preference: NotificationProviderPreference): ProviderResponseDto {
    const requiresConfig = this.requiresConfiguration(preference.providerType);
    const isConfigured = this.isProviderConfigured(preference);

    return {
      id: preference.id,
      providerType: preference.providerType,
      isEnabled: preference.isEnabled,
      requiresConfiguration: requiresConfig,
      isConfigured,
      config: this.sanitizeConfig(preference.config),
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt,
    };
  }

  /**
   * Sanitiza la configuración para no exponer datos sensibles
   */
  private sanitizeConfig(config: any): any {
    if (!config) return null;

    const sanitized = { ...config };

    // Ocultar datos sensibles parcialmente
    if (sanitized.chatId) {
      sanitized.chatId = `***${sanitized.chatId.slice(-6)}`;
    }
    if (sanitized.phoneNumber) {
      sanitized.phoneNumber = `***${sanitized.phoneNumber.slice(-4)}`;
    }

    // Remover campos sensibles
    delete sanitized.verificationCode;
    delete sanitized.verificationExpiry;

    return sanitized;
  }
}
