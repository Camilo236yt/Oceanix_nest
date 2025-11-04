import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { StorageService } from './storage.service';
import { STORAGE_BUCKETS, ALLOWED_FILE_TYPES, MAX_FILE_SIZES } from './config/storage.config';
import { JwtAuthGuard, TenantGuard } from '../auth/guards';

@ApiTags('Storage')
@Controller('storage')
@UseGuards(JwtAuthGuard, TenantGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a single file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        bucket: {
          type: 'string',
          enum: Object.values(STORAGE_BUCKETS),
          default: STORAGE_BUCKETS.UPLOADS,
        },
        path: {
          type: 'string',
          description: 'Optional path within the bucket',
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('bucket') bucket?: string,
    @Query('path') path?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validar tipo y tamaño del archivo
    this.storageService.validateFileType(file, [
      ...ALLOWED_FILE_TYPES.IMAGES,
      ...ALLOWED_FILE_TYPES.DOCUMENTS,
    ]);
    this.storageService.validateFileSize(file, MAX_FILE_SIZES.DOCUMENT);

    const selectedBucket = bucket || STORAGE_BUCKETS.UPLOADS;
    return await this.storageService.uploadFile(file, selectedBucket, path);
  }

  @Post('upload-multiple')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload multiple files (max 10)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('bucket') bucket?: string,
    @Query('path') path?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const selectedBucket = bucket || STORAGE_BUCKETS.UPLOADS;
    const uploadPromises = files.map((file) => {
      // Validar cada archivo
      this.storageService.validateFileType(file, [
        ...ALLOWED_FILE_TYPES.IMAGES,
        ...ALLOWED_FILE_TYPES.DOCUMENTS,
      ]);
      this.storageService.validateFileSize(file, MAX_FILE_SIZES.DOCUMENT);

      return this.storageService.uploadFile(file, selectedBucket, path);
    });

    return await Promise.all(uploadPromises);
  }

  @Post('upload-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No avatar file uploaded');
    }

    // Solo permitir imágenes para avatares
    this.storageService.validateFileType(file, [...ALLOWED_FILE_TYPES.IMAGES]);
    this.storageService.validateFileSize(file, MAX_FILE_SIZES.IMAGE);

    // Los avatares van a su propio bucket
    return await this.storageService.uploadFile(
      file,
      STORAGE_BUCKETS.AVATARS,
      'avatars',
    );
  }

  @Get('file/:bucket/:key')
  @ApiOperation({ summary: 'Get a file by bucket and key' })
  async getFile(
    @Param('bucket') bucket: string,
    @Param('key') key: string,
    @Res() res: Response,
  ) {
    const file = await this.storageService.getFile(bucket, key);

    // Configurar headers según el tipo de archivo
    const extension = key.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      contentType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
    } else if (extension === 'pdf') {
      contentType = 'application/pdf';
    }

    res.set({
      'Content-Type': contentType,
      'Content-Length': file.length.toString(),
    });

    res.send(file);
  }

  @Get('signed-url/:bucket/:key')
  @ApiOperation({ summary: 'Get a signed URL for temporary access' })
  async getSignedUrl(
    @Param('bucket') bucket: string,
    @Param('key') key: string,
    @Query('expires') expires?: number,
  ) {
    const expiresIn = expires || 3600; // Default 1 hora
    const url = await this.storageService.getSignedUrl(bucket, key, expiresIn);

    return {
      url,
      expiresIn,
    };
  }

  @Get('list/:bucket')
  @ApiOperation({ summary: 'List files in a bucket' })
  async listFiles(
    @Param('bucket') bucket: string,
    @Query('prefix') prefix?: string,
  ) {
    const files = await this.storageService.listFiles(bucket, prefix);

    return {
      bucket,
      prefix,
      count: files.length,
      files,
    };
  }

  @Delete('file/:bucket/:key')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('bucket') bucket: string,
    @Param('key') key: string,
  ) {
    await this.storageService.deleteFile(bucket, key);

    return {
      message: 'File deleted successfully',
      bucket,
      key,
    };
  }
}
