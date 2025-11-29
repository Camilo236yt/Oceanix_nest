import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseConfig } from './entities/enterprise-config.entity';
import { UpdateEnterpriseConfigDto } from './dto/update-enterprise-config.dto';
import { VerificationStatus } from './enums/verification-status.enum';

@Injectable()
export class EnterpriseConfigService {
  private readonly logger = new Logger(EnterpriseConfigService.name);

  constructor(
    @InjectRepository(EnterpriseConfig)
    private readonly configRepository: Repository<EnterpriseConfig>,
  ) { }

  /**
   * Get or create enterprise config for a given enterprise
   */
  async getOrCreateConfig(enterpriseId: string): Promise<EnterpriseConfig> {
    let config = await this.configRepository.findOne({
      where: { enterpriseId },
      relations: ['enterprise'],
    });

    if (!config) {
      // Create default config
      config = this.configRepository.create({
        enterpriseId,
        isVerified: false,
        verificationStatus: VerificationStatus.PENDING,
        requireCorporateEmail: false,
      });
      await this.configRepository.save(config);
    }

    return config;
  }

  /**
   * Get enterprise config by enterprise ID
   */
  async getByEnterpriseId(enterpriseId: string): Promise<EnterpriseConfig> {
    return await this.getOrCreateConfig(enterpriseId);
  }

  /**
   * Update enterprise configuration (only non-verification fields)
   */
  async updateConfig(
    enterpriseId: string,
    updateDto: UpdateEnterpriseConfigDto,
  ): Promise<EnterpriseConfig> {
    const config = await this.getOrCreateConfig(enterpriseId);

    // Update allowed fields
    Object.assign(config, updateDto);

    return await this.configRepository.save(config);
  }

  /**
   * Update enterprise branding (logos, colors, theme)
   */
  async updateBranding(
    enterpriseId: string,
    brandingData: {
      logoUrl?: string;
      faviconUrl?: string;
      bannerUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      accentColor?: string;
      customTheme?: Record<string, any>;
    },
  ): Promise<EnterpriseConfig> {
    const config = await this.getOrCreateConfig(enterpriseId);

    // Update branding fields
    if (brandingData.logoUrl !== undefined) {
      config.logoUrl = brandingData.logoUrl;
    }
    if (brandingData.faviconUrl !== undefined) {
      config.faviconUrl = brandingData.faviconUrl;
    }
    if (brandingData.bannerUrl !== undefined) {
      config.bannerUrl = brandingData.bannerUrl;
    }
    if (brandingData.primaryColor !== undefined) {
      config.primaryColor = brandingData.primaryColor;
    }
    if (brandingData.secondaryColor !== undefined) {
      config.secondaryColor = brandingData.secondaryColor;
    }
    if (brandingData.accentColor !== undefined) {
      config.accentColor = brandingData.accentColor;
    }
    if (brandingData.customTheme !== undefined) {
      config.customTheme = brandingData.customTheme;
    }

    return await this.configRepository.save(config);
  }

  /**
   * Update corporate email domains
   */
  async updateEmailDomains(
    enterpriseId: string,
    emailDomains?: string[],
    requireCorporateEmail?: boolean,
  ): Promise<EnterpriseConfig> {
    const config = await this.getOrCreateConfig(enterpriseId);

    if (emailDomains !== undefined) {
      config.emailDomains = emailDomains;
    }
    if (requireCorporateEmail !== undefined) {
      config.requireCorporateEmail = requireCorporateEmail;
    }

    return await this.configRepository.save(config);
  }

  /**
   * Send email verification code to user's email
   */
  async sendEmailVerification(
    enterpriseId: string,
    userEmail: string,
    redisService: any,
    emailService: any,
  ): Promise<void> {
    this.logger.log('═'.repeat(80));
    this.logger.log('📧 INICIANDO ENVÍO DE CÓDIGO DE VERIFICACIÓN');
    this.logger.log(`   Enterprise ID: ${enterpriseId}`);
    this.logger.log(`   Email: ${userEmail}`);

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.logger.log(`   Código generado: ${code}`);

    // Store in Redis with 10 minutes expiration
    const key = `email_verification:${enterpriseId}`;
    this.logger.log(`   Redis key: ${key}`);

    await redisService.set(key, { email: userEmail, code }, 600); // 10 minutes
    this.logger.log('   ✅ Código guardado en Redis (expira en 10 minutos)');

    // Send email
    await emailService.sendVerificationEmail(userEmail, code);
    this.logger.log('   ✅ Email de verificación enviado');
    this.logger.log('═'.repeat(80));
  }

  /**
   * Verify email code
   */
  async verifyEmailCode(
    enterpriseId: string,
    userEmail: string,
    code: string,
    redisService: any,
    emailService: any,
  ): Promise<boolean> {
    this.logger.log('═'.repeat(80));
    this.logger.log('🔍 VERIFICANDO CÓDIGO DE EMAIL');
    this.logger.log(`   Enterprise ID: ${enterpriseId}`);
    this.logger.log(`   Email recibido: ${userEmail}`);
    this.logger.log(`   Código recibido: ${code}`);

    const key = `email_verification:${enterpriseId}`;
    this.logger.log(`   Buscando en Redis con key: ${key}`);

    const stored = await redisService.get(key);

    if (!stored) {
      this.logger.error('   ❌ ERROR: Código expirado o no encontrado en Redis');
      this.logger.log('═'.repeat(80));
      throw new BadRequestException('Código expirado o no encontrado');
    }

    this.logger.log(`   ✅ Datos encontrados en Redis:`);
    this.logger.log(`      - Email almacenado: ${stored.email}`);
    this.logger.log(`      - Código almacenado: ${stored.code}`);

    if (stored.email !== userEmail) {
      this.logger.error(`   ❌ ERROR: Email no coincide`);
      this.logger.error(`      - Esperado: ${stored.email}`);
      this.logger.error(`      - Recibido: ${userEmail}`);
      this.logger.log('═'.repeat(80));
      throw new BadRequestException('Email no coincide');
    }

    this.logger.log('   ✅ Email coincide');

    if (stored.code !== code) {
      this.logger.error(`   ❌ ERROR: Código incorrecto`);
      this.logger.error(`      - Esperado: ${stored.code}`);
      this.logger.error(`      - Recibido: ${code}`);
      this.logger.log('═'.repeat(80));
      throw new BadRequestException('Código incorrecto');
    }

    this.logger.log('   ✅ Código correcto');

    // Delete code after verification
    await redisService.del(key);
    this.logger.log('   ✅ Código eliminado de Redis');

    // TODO: Mark user email as verified in User entity if needed
    // For now we just return true

    // Send welcome email
    const config = await this.getOrCreateConfig(enterpriseId);
    if (config.enterprise?.name) {
      this.logger.log(`   📧 Enviando email de bienvenida a ${userEmail}`);
      await emailService.sendWelcomeEmail(userEmail, config.enterprise.name);
      this.logger.log('   ✅ Email de bienvenida enviado');
    } else {
      this.logger.warn('   ⚠️  No se encontró nombre de empresa, no se envió email de bienvenida');
    }

    this.logger.log('   ✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE');
    this.logger.log('═'.repeat(80));
    return true;
  }

  /**
   * Get configuration status (what's been configured)
   */
  async getConfigurationStatus(
    enterpriseId: string,
    documentService: any,
  ): Promise<{
    documentsUploaded: boolean;
    brandingConfigured: boolean;
    emailDomainsConfigured: boolean;
  }> {
    const config = await this.getOrCreateConfig(enterpriseId);

    // Check if documents are uploaded (3 required docs)
    const documents = await documentService.getDocumentsByEnterprise(enterpriseId);
    const hasDocuments = documents.length >= 3;

    // Check if branding is configured
    const hasBranding = !!(
      config.logoUrl ||
      config.faviconUrl ||
      config.bannerUrl ||
      config.primaryColor
    );

    // Check if email domains are configured
    const hasEmailDomains = !!(
      config.emailDomains && config.emailDomains.length > 0
    );

    return {
      documentsUploaded: hasDocuments,
      brandingConfigured: hasBranding,
      emailDomainsConfigured: hasEmailDomains,
    };
  }

  /**
   * Get all verified enterprises
   */
  async getVerifiedEnterprises(): Promise<EnterpriseConfig[]> {
    return await this.configRepository.find({
      where: { isVerified: true },
      relations: ['enterprise'],
      order: { verificationDate: 'DESC' },
    });
  }
}
