import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import {
  VerifyEnterpriseDto,
  RejectEnterpriseDto,
} from './dto/verify-enterprise.dto';
import {
  UploadDocumentDto,
  ApproveDocumentDto,
  RejectDocumentDto,
} from './dto/upload-document.dto';
import {
  STORAGE_BUCKETS,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZES,
} from '../storage/config/storage.config';

@ApiTags('Enterprise Configuration')
@Controller('enterprise-config')
export class EnterpriseConfigController {
  constructor(
    private readonly configService: EnterpriseConfigService,
    private readonly documentService: EnterpriseDocumentService,
    private readonly storageService: StorageService,
  ) {}

  // ========== Configuration Endpoints ==========

  @Get()
  @Auth(ValidPermission.manageEnterpriseConfig)
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

  @Patch()
  @Auth(ValidPermission.manageEnterpriseConfig)
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

  // ========== File Upload Endpoints ==========

  @Post('upload-logo')
  @UseInterceptors(FileInterceptor('logo'))
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload enterprise logo',
    description: 'Sube el logo de la empresa (solo imágenes)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        logo: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Logo subido exitosamente' })
  async uploadLogo(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Validate file type and size
    this.storageService.validateFileType(file, [...ALLOWED_FILE_TYPES.IMAGES]);
    this.storageService.validateFileSize(file, MAX_FILE_SIZES.IMAGE);

    // Upload to MinIO
    const result = await this.storageService.uploadFile(
      file,
      STORAGE_BUCKETS.AVATARS,
      `enterprises/${user.enterpriseId}/logo`,
    );

    // Update config with new logo URL
    await this.configService.updateLogo(user.enterpriseId, result.key);

    return {
      message: 'Logo uploaded successfully',
      logoUrl: result.url,
      key: result.key,
    };
  }

  @Post('upload-favicon')
  @UseInterceptors(FileInterceptor('favicon'))
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload enterprise favicon',
    description: 'Sube el favicon de la empresa',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        favicon: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadFavicon(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.storageService.validateFileType(file, [...ALLOWED_FILE_TYPES.IMAGES]);
    this.storageService.validateFileSize(file, MAX_FILE_SIZES.IMAGE);

    const result = await this.storageService.uploadFile(
      file,
      STORAGE_BUCKETS.AVATARS,
      `enterprises/${user.enterpriseId}/favicon`,
    );

    await this.configService.updateFavicon(user.enterpriseId, result.key);

    return {
      message: 'Favicon uploaded successfully',
      faviconUrl: result.url,
      key: result.key,
    };
  }

  @Post('upload-banner')
  @UseInterceptors(FileInterceptor('banner'))
  @Auth(ValidPermission.manageEnterpriseConfig)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload enterprise banner',
    description: 'Sube el banner/hero image de la empresa',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        banner: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadBanner(
    @GetUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.storageService.validateFileType(file, [...ALLOWED_FILE_TYPES.IMAGES]);
    this.storageService.validateFileSize(file, MAX_FILE_SIZES.IMAGE);

    const result = await this.storageService.uploadFile(
      file,
      STORAGE_BUCKETS.AVATARS,
      `enterprises/${user.enterpriseId}/banner`,
    );

    await this.configService.updateBanner(user.enterpriseId, result.key);

    return {
      message: 'Banner uploaded successfully',
      bannerUrl: result.url,
      key: result.key,
    };
  }

  // ========== Document Management Endpoints ==========

  @Get('documents')
  @Auth(ValidPermission.uploadEnterpriseDocuments)
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
  @UseInterceptors(FileInterceptor('document'))
  @Auth(ValidPermission.uploadEnterpriseDocuments)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload enterprise document',
    description:
      'Sube un documento legal de la empresa (RUT, cámara de comercio, etc.)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        document: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: [
            'tax_id',
            'chamber_commerce',
            'legal_rep_id',
            'power_attorney',
            'bank_certificate',
            'other',
          ],
        },
        description: { type: 'string' },
        expirationDate: { type: 'string', format: 'date' },
      },
      required: ['document', 'type'],
    },
  })
  async uploadDocument(
    @GetUser() user: User,
    @Body() uploadDto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Validate file
    this.storageService.validateFileType(file, [
      ...ALLOWED_FILE_TYPES.DOCUMENTS,
      ...ALLOWED_FILE_TYPES.IMAGES,
    ]);
    this.storageService.validateFileSize(file, MAX_FILE_SIZES.DOCUMENT);

    // Upload to MinIO
    const result = await this.storageService.uploadFile(
      file,
      STORAGE_BUCKETS.DOCUMENTS,
      `enterprises/${user.enterpriseId}/documents`,
    );

    // Create document record
    const document = await this.documentService.createDocument(
      user.enterpriseId,
      uploadDto,
      {
        fileName: file.originalname,
        fileKey: result.key,
        fileUrl: result.url,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    );

    return {
      message: 'Document uploaded successfully',
      document,
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

  // ========== Verification Endpoints (SUPER_ADMIN only) ==========

  @Get('pending')
  @Auth(ValidPermission.verifyEnterprises)
  @ApiOperation({
    summary: 'List pending enterprises',
    description:
      'Lista todas las empresas pendientes de verificación (solo SUPER_ADMIN)',
  })
  async getPendingEnterprises() {
    return await this.configService.getPendingEnterprises();
  }

  @Patch(':enterpriseId/verify')
  @Auth(ValidPermission.verifyEnterprises)
  @ApiOperation({
    summary: 'Verify enterprise',
    description: 'Verifica una empresa (solo SUPER_ADMIN)',
  })
  async verifyEnterprise(
    @Param('enterpriseId', ParseUUIDPipe) enterpriseId: string,
    @GetUser() user: User,
    @Body() verifyDto: VerifyEnterpriseDto,
  ) {
    return await this.configService.verifyEnterprise(enterpriseId, user.id);
  }

  @Patch(':enterpriseId/reject')
  @Auth(ValidPermission.verifyEnterprises)
  @ApiOperation({
    summary: 'Reject enterprise verification',
    description: 'Rechaza la verificación de una empresa (solo SUPER_ADMIN)',
  })
  async rejectEnterprise(
    @Param('enterpriseId', ParseUUIDPipe) enterpriseId: string,
    @Body() rejectDto: RejectEnterpriseDto,
  ) {
    return await this.configService.rejectEnterprise(
      enterpriseId,
      rejectDto.rejectionReason,
    );
  }

  @Get('documents/pending/all')
  @Auth(ValidPermission.approveDocuments)
  @ApiOperation({
    summary: 'List all pending documents',
    description:
      'Lista todos los documentos pendientes de aprobación de todas las empresas (solo SUPER_ADMIN)',
  })
  async getAllPendingDocuments() {
    return await this.documentService.getAllPendingDocuments();
  }

  @Patch('documents/:id/approve')
  @Auth(ValidPermission.approveDocuments)
  @ApiOperation({
    summary: 'Approve document',
    description: 'Aprueba un documento (solo SUPER_ADMIN)',
  })
  async approveDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @GetUser() user: User,
    @Body() approveDto: ApproveDocumentDto,
  ) {
    return await this.documentService.approveDocument(documentId, user.id);
  }

  @Patch('documents/:id/reject')
  @Auth(ValidPermission.approveDocuments)
  @ApiOperation({
    summary: 'Reject document',
    description: 'Rechaza un documento (solo SUPER_ADMIN)',
  })
  async rejectDocument(
    @Param('id', ParseUUIDPipe) documentId: string,
    @Body() rejectDto: RejectDocumentDto,
  ) {
    return await this.documentService.rejectDocument(
      documentId,
      rejectDto.rejectionReason,
    );
  }
}
