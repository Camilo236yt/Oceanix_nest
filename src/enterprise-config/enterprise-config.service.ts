import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseConfig } from './entities/enterprise-config.entity';
import { UpdateEnterpriseConfigDto } from './dto/update-enterprise-config.dto';
import { VerificationStatus } from './enums/verification-status.enum';

@Injectable()
export class EnterpriseConfigService {
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
