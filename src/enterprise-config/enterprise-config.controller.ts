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
  UseInterceptors,
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
import { UploadDocumentDto } from './dto/upload-document.dto';
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
  ) { }

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
      'Sube un documento legal de la empresa (RUT/NIT/CUIT, Cámara de Comercio, Cédula Representante Legal, etc.). ' +
      'El sistema valida el tipo de archivo y tamaño, almacena en MinIO y registra en la base de datos. ' +
      'Soporta versionamiento automático: si ya existe un documento del mismo tipo, se crea una nueva versión.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        document: {
          type: 'string',
          format: 'binary',
          description: 'Archivo del documento (PDF, JPG, PNG máx 10MB)',
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
          description: 'Tipo de documento: tax_id (RUT/NIT), chamber_commerce (Cámara de Comercio), legal_rep_id (Cédula Rep. Legal)',
          example: 'tax_id',
        },
        description: {
          type: 'string',
          maxLength: 500,
          description: 'Descripción opcional del documento',
          example: 'RUT actualizado enero 2025',
        },
        expirationDate: {
          type: 'string',
          format: 'date',
          description: 'Fecha de vencimiento (opcional) en formato YYYY-MM-DD',
          example: '2026-12-31',
        },
      },
      required: ['document', 'type'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Documento subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Document uploaded successfully',
        },
        document: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' },
            type: { type: 'string', example: 'tax_id' },
            fileName: { type: 'string', example: 'rut-empresa.pdf' },
            fileUrl: { type: 'string', example: 'https://storage.example.com/...' },
            status: { type: 'string', example: 'pending' },
            version: { type: 'number', example: 1 },
            createdAt: { type: 'string', example: '2025-01-25T18:15:00Z' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Archivo inválido, tipo no soportado o tamaño excedido',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado - Token inválido o expirado',
  })
  @ApiResponse({
    status: 403,
    description: 'Permisos insuficientes - requiere permiso uploadEnterpriseDocuments',
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
}
