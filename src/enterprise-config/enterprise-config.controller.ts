import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { EnterpriseConfigService } from './enterprise-config.service';
import { EnterpriseDocumentService } from './enterprise-document.service';
import { StorageService } from '../storage/storage.service';
import { Auth } from '../auth/decorator/auth.decorator';
import { GetUser } from '../auth/decorator/get-user.decorator';
import { ValidPermission } from '../auth/interfaces/valid-permission';
import { User } from '../users/entities/user.entity';
import { UpdateEnterpriseConfigDto } from './dto/update-enterprise-config.dto';
import { UpdateEmailDomainsDto } from './dto/update-email-domains.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { DocumentType } from './enums/verification-status.enum';
import {
  STORAGE_BUCKETS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from '../storage/config/storage.config';
import { EmailService } from './email.service';
import { RedisService } from '../redis/redis.service';

@ApiTags('Enterprise Configuration')
@Controller('enterprise-config')
export class EnterpriseConfigController {
  constructor(
    private readonly configService: EnterpriseConfigService,
    private readonly documentService: EnterpriseDocumentService,
    private readonly storageService: StorageService,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) { }

  // ========== Configuration Endpoints ==========

  @Get()
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Configuration')
  @ApiOperation({
    summary: 'Get enterprise configuration',
    description:
      'Obtiene la configuración de la empresa autenticada (colores, logos, dominios permitidos, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración obtenida exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  async getConfig(@GetUser() user: User) {
    return await this.configService.getByEnterpriseId(user.enterpriseId);
  }

  @Get('status')
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Configuration')
  @ApiOperation({
    summary: 'Get configuration status',
    description:
      'Obtiene el estado de la configuración (qué pasos están completos) en forma de booleanos',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de configuración obtenido',
    schema: {
      type: 'object',
      properties: {
        documentsUploaded: {
          type: 'boolean',
          example: true,
          description: 'Si se subieron los 3 documentos obligatorios',
        },
        brandingConfigured: {
          type: 'boolean',
          example: false,
          description: 'Si se configuró logo, colores o banner',
        },
        emailDomainsConfigured: {
          type: 'boolean',
          example: true,
          description: 'Si se configuraron dominios de email corporativo',
        },
      },
    },
  })
  async getConfigurationStatus(@GetUser() user: User) {
    return await this.configService.getConfigurationStatus(
      user.enterpriseId,
      this.documentService,
    );
  }

  @Patch()
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Configuration')
  @ApiOperation({
    summary: 'Update enterprise configuration',
    description:
      'Actualiza colores, tema personalizado y dominios de email permitidos',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuración actualizada exitosamente',
  })
  async updateConfig(
    @GetUser() user: User,
    @Body() updateDto: UpdateEnterpriseConfigDto,
  ) {
    return await this.configService.updateConfig(user.enterpriseId, updateDto);
  }

  // ========== Branding Endpoints ==========

  @Patch('branding')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'logo', maxCount: 1 },
      { name: 'favicon', maxCount: 1 },
      { name: 'banner', maxCount: 1 },
    ]),
  )
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Branding')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update enterprise branding',
    description:
      'Personaliza la apariencia de la empresa: logos, colores de marca y tema personalizado',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
          description: 'Logo de la empresa (PNG, JPG máx 5MB)',
        },
        favicon: {
          type: 'string',
          format: 'binary',
          description: 'Favicon (ICO, PNG máx 1MB)',
        },
        banner: {
          type: 'string',
          format: 'binary',
          description: 'Banner/Hero image (PNG, JPG máx 10MB)',
        },
        primaryColor: {
          type: 'string',
          pattern: '^#[0-9A-Fa-f]{6}$',
          description: 'Color principal (HEX)',
          example: '#9333EA',
        },
        secondaryColor: {
          type: 'string',
          pattern: '^#[0-9A-Fa-f]{6}$',
          description: 'Color secundario (HEX)',
          example: '#424242',
        },
        accentColor: {
          type: 'string',
          pattern: '^#[0-9A-Fa-f]{6}$',
          description: 'Color de acento (HEX)',
          example: '#FF4081',
        },
        customTheme: {
          type: 'string',
          description: 'Tema avanzado (JSON string)',
          example: '{"darkMode": true, "fontSize": "16px"}',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Branding actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Branding updated successfully' },
        config: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            logoUrl: { type: 'string' },
            faviconUrl: { type: 'string' },
            bannerUrl: { type: 'string' },
            primaryColor: { type: 'string', example: '#9333EA' },
            secondaryColor: { type: 'string', example: '#424242' },
            accentColor: { type: 'string', example: '#FF4081' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivos inválidos o colores HEX incorrectos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async updateBranding(
    @GetUser() user: User,
    @UploadedFiles()
    files?: {
      logo?: Express.Multer.File[];
      favicon?: Express.Multer.File[];
      banner?: Express.Multer.File[];
    },
    @Body() body?: any,
  ) {
    const brandingData: any = {};

    // Process logo if uploaded
    if (files?.logo) {
      const logoFile = files.logo[0];
      this.storageService.validateFileType(logoFile, [
        ...ALLOWED_FILE_TYPES.IMAGES,
      ]);
      this.storageService.validateFileSize(logoFile, 5 * 1024 * 1024); // 5MB

      const logoResult = await this.storageService.uploadFile(
        logoFile,
        STORAGE_BUCKETS.AVATARS,
        `enterprises/${user.enterpriseId}/branding`,
      );
      brandingData.logoUrl = logoResult.key;
    }

    // Process favicon if uploaded
    if (files?.favicon) {
      const faviconFile = files.favicon[0];
      this.storageService.validateFileType(faviconFile, [
        ...ALLOWED_FILE_TYPES.IMAGES,
      ]);
      this.storageService.validateFileSize(faviconFile, 1 * 1024 * 1024); // 1MB

      const faviconResult = await this.storageService.uploadFile(
        faviconFile,
        STORAGE_BUCKETS.AVATARS,
        `enterprises/${user.enterpriseId}/branding`,
      );
      brandingData.faviconUrl = faviconResult.key;
    }

    // Process banner if uploaded
    if (files?.banner) {
      const bannerFile = files.banner[0];
      this.storageService.validateFileType(bannerFile, [
        ...ALLOWED_FILE_TYPES.IMAGES,
      ]);
      this.storageService.validateFileSize(bannerFile, MAX_FILE_SIZES.IMAGE);

      const bannerResult = await this.storageService.uploadFile(
        bannerFile,
        STORAGE_BUCKETS.AVATARS,
        `enterprises/${user.enterpriseId}/branding`,
      );
      brandingData.bannerUrl = bannerResult.key;
    }

    // Add colors from body
    if (body?.primaryColor) brandingData.primaryColor = body.primaryColor;
    if (body?.secondaryColor) brandingData.secondaryColor = body.secondaryColor;
    if (body?.accentColor) brandingData.accentColor = body.accentColor;

    // Parse and add custom theme if provided
    if (body?.customTheme) {
      try {
        brandingData.customTheme =
          typeof body.customTheme === 'string'
            ? JSON.parse(body.customTheme)
            : body.customTheme;
      } catch (error) {
        throw new BadRequestException('customTheme must be valid JSON');
      }
    }

    // Update branding
    const config = await this.configService.updateBranding(
      user.enterpriseId,
      brandingData,
    );

    return {
      message: 'Branding updated successfully',
      config,
    };
  }

  // ========== Email Configuration Endpoints ==========

  @Patch('email-domains')
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Email Configuration')
  @ApiOperation({
    summary: 'Update corporate email domains',
    description:
      'Configura los dominios de email corporativo permitidos y si se requiere email corporativo para registro',
  })
  @ApiBody({
    type: UpdateEmailDomainsDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Dominios actualizados exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email domains updated successfully',
        },
        config: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            emailDomains: {
              type: 'array',
              items: { type: 'string' },
              example: ['empresa.com', 'subsidiary.com'],
            },
            requireCorporateEmail: { type: 'boolean', example: false },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async updateEmailDomains(
    @GetUser() user: User,
    @Body() dto: UpdateEmailDomainsDto,
  ) {
    const config = await this.configService.updateEmailDomains(
      user.enterpriseId,
      dto.emailDomains,
      dto.requireCorporateEmail,
    );

    return {
      message: 'Email domains updated successfully',
      config,
    };
  }

  @Get('current-email')
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Email Configuration')
  @ApiOperation({
    summary: 'Get current user email',
    description:
      'Obtiene el email del usuario autenticado (solo lectura). Este endpoint es útil para mostrar qué email recibirá el código de verificación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Email obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'admin@empresa.com',
          description: 'Email del usuario autenticado',
        },
        hasEmail: {
          type: 'boolean',
          example: true,
          description: 'Si el usuario tiene email configurado',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  async getCurrentEmail(@GetUser() user: User) {
    return {
      email: user.email || null,
      hasEmail: !!user.email,
    };
  }

  @Post('send-email-verification')
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Email Verification')
  @ApiOperation({
    summary: 'Send email verification code',
    description:
      'Envía un código de verificación de 6 dígitos al email del usuario autenticado. El código expira en 10 minutos.',
  })
  @ApiResponse({
    status: 201,
    description: 'Código enviado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Verification code sent successfully',
        },
        emailSentTo: {
          type: 'string',
          example: 'admin@empresa.com',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Usuario no tiene email configurado',
  })
  async sendEmailVerification(@GetUser() user: User) {
    if (!user.email) {
      throw new BadRequestException(
        'Usuario no tiene email configurado en su perfil',
      );
    }

    await this.configService.sendEmailVerification(
      user.enterpriseId,
      user.email,
      this.redisService,
      this.emailService,
    );

    return {
      message: 'Verification code sent successfully',
      emailSentTo: user.email,
    };
  }

  @Post('verify-email')
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiTags('Email Verification')
  @ApiOperation({
    summary: 'Verify email code',
    description:
      'Verifica el código de 6 dígitos enviado al email del usuario autenticado',
  })
  @ApiBody({
    type: VerifyEmailDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Email verificado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Email verified successfully',
        },
        verified: { type: 'boolean', example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Código incorrecto, expirado o usuario sin email',
  })
  async verifyEmail(@GetUser() user: User, @Body() dto: VerifyEmailDto) {
    if (!user.email) {
      throw new BadRequestException(
        'Usuario no tiene email configurado en su perfil',
      );
    }

    const verified = await this.configService.verifyEmailCode(
      user.enterpriseId,
      user.email,
      dto.code,
      this.redisService,
      this.emailService,
    );

    return {
      message: 'Email verified successfully',
      verified,
    };
  }

  // ========== Document Management Endpoints ==========
  @Get('documents')
  @Auth(ValidPermission.uploadEnterpriseDocuments)
  @ApiTags('Documents')
  @ApiOperation({
    summary: 'List enterprise documents',
    description: 'Lista todos los documentos de la empresa autenticada',
  })
  @ApiResponse({
    status: 200,
    description: 'Documentos obtenidos exitosamente',
  })
  async listDocuments(@GetUser() user: User) {
    return await this.documentService.getDocumentsByEnterprise(
      user.enterpriseId,
    );
  }

  @Post('documents/upload')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'taxId', maxCount: 1 },
      { name: 'chamberCommerce', maxCount: 1 },
      { name: 'legalRepId', maxCount: 1 },
    ]),
  )
  @Auth(ValidPermission.uploadEnterpriseDocuments)
  @ApiTags('Documents')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload required enterprise documents',
    description:
      'Sube los 3 documentos legales obligatorios de la empresa: ' +
      '(1) RUT/NIT/CUIT, (2) Cámara de Comercio, (3) Cédula Representante Legal.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        taxId: {
          type: 'string',
          format: 'binary',
          description: 'RUT/NIT/CUIT (PDF, JPG, PNG máx 10MB)',
        },
        chamberCommerce: {
          type: 'string',
          format: 'binary',
          description: 'Cámara de Comercio (PDF, JPG, PNG máx 10MB)',
        },
        legalRepId: {
          type: 'string',
          format: 'binary',
          description: 'Cédula Representante Legal (PDF, JPG, PNG máx 10MB)',
        },
      },
      required: ['taxId', 'chamberCommerce', 'legalRepId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documentos subidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Documents uploaded successfully' },
        documents: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['tax_id', 'chamber_commerce', 'legal_rep_id'] },
              fileName: { type: 'string' },
              status: { type: 'string', example: 'pending' },
              version: { type: 'number', example: 1 },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivos faltantes, tipos no soportados o tamaños excedidos',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes',
  })
  async uploadDocuments(
    @GetUser() user: User,
    @UploadedFiles()
    files: {
      taxId?: Express.Multer.File[];
      chamberCommerce?: Express.Multer.File[];
      legalRepId?: Express.Multer.File[];
    },
  ) {
    // Validate that all 3 required files are present
    if (!files.taxId || !files.chamberCommerce || !files.legalRepId) {
      throw new BadRequestException(
        'Los 3 documentos son obligatorios: RUT/NIT, Cámara de Comercio y Cédula Representante Legal',
      );
    }

    const documentsToCreate: Array<{
      type: DocumentType;
      fileData: {
        fileName: string;
        fileKey: string;
        fileUrl: string;
        mimeType: string;
        fileSize: number;
      };
    }> = [];

    // Process RUT/NIT/CUIT
    const taxIdFile = files.taxId[0];
    this.storageService.validateFileType(taxIdFile, [
      ...ALLOWED_FILE_TYPES.DOCUMENTS,
      ...ALLOWED_FILE_TYPES.IMAGES,
    ]);
    this.storageService.validateFileSize(taxIdFile, MAX_FILE_SIZES.DOCUMENT);

    const taxIdResult = await this.storageService.uploadFile(
      taxIdFile,
      STORAGE_BUCKETS.DOCUMENTS,
      `enterprises/${user.enterpriseId}/documents`,
    );

    documentsToCreate.push({
      type: DocumentType.TAX_ID,
      fileData: {
        fileName: taxIdFile.originalname,
        fileKey: taxIdResult.key,
        fileUrl: taxIdResult.url,
        mimeType: taxIdFile.mimetype,
        fileSize: taxIdFile.size,
      },
    });

    // Process Cámara de Comercio
    const chamberFile = files.chamberCommerce[0];
    this.storageService.validateFileType(chamberFile, [
      ...ALLOWED_FILE_TYPES.DOCUMENTS,
      ...ALLOWED_FILE_TYPES.IMAGES,
    ]);
    this.storageService.validateFileSize(chamberFile, MAX_FILE_SIZES.DOCUMENT);

    const chamberResult = await this.storageService.uploadFile(
      chamberFile,
      STORAGE_BUCKETS.DOCUMENTS,
      `enterprises/${user.enterpriseId}/documents`,
    );

    documentsToCreate.push({
      type: DocumentType.CHAMBER_COMMERCE,
      fileData: {
        fileName: chamberFile.originalname,
        fileKey: chamberResult.key,
        fileUrl: chamberResult.url,
        mimeType: chamberFile.mimetype,
        fileSize: chamberFile.size,
      },
    });

    // Process Cédula Representante Legal
    const legalRepFile = files.legalRepId[0];
    this.storageService.validateFileType(legalRepFile, [
      ...ALLOWED_FILE_TYPES.DOCUMENTS,
      ...ALLOWED_FILE_TYPES.IMAGES,
    ]);
    this.storageService.validateFileSize(legalRepFile, MAX_FILE_SIZES.DOCUMENT);

    const legalRepResult = await this.storageService.uploadFile(
      legalRepFile,
      STORAGE_BUCKETS.DOCUMENTS,
      `enterprises/${user.enterpriseId}/documents`,
    );

    documentsToCreate.push({
      type: DocumentType.LEGAL_REP_ID,
      fileData: {
        fileName: legalRepFile.originalname,
        fileKey: legalRepResult.key,
        fileUrl: legalRepResult.url,
        mimeType: legalRepFile.mimetype,
        fileSize: legalRepFile.size,
      },
    });

    // Create all documents
    const documents = await this.documentService.createMultipleDocuments(
      user.enterpriseId,
      documentsToCreate,
    );

    return {
      message: 'Documents uploaded successfully',
      documents,
    };
  }

  @Get('documents/:id')
  @Auth(ValidPermission.uploadEnterpriseDocuments)
  @ApiOperation({
    summary: 'Get document by ID',
    description: 'Obtiene un documento específico por su ID',
  })
  async getDocument(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) documentId: string,
  ) {
    return await this.documentService.getDocumentById(
      documentId,
      user.enterpriseId,
    );
  }

  @Delete('documents/:id')
  @Auth(ValidPermission.uploadEnterpriseDocuments)
  @ApiOperation({
    summary: 'Delete document',
    description: 'Elimina un documento (soft delete)',
  })
  async deleteDocument(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) documentId: string,
  ) {
    await this.documentService.deleteDocument(documentId, user.enterpriseId);
    return { message: 'Document deleted successfully' };
  }
}
