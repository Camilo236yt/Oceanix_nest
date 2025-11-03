import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getStorageConfig, STORAGE_BUCKETS } from './config/storage.config';
import { Readable } from 'stream';

@Injectable()
export class StorageService {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client(getStorageConfig());
    this.initializeBuckets();
  }

  /**
   * Inicializa los buckets necesarios si no existen
   */
  private async initializeBuckets() {
    const buckets = Object.values(STORAGE_BUCKETS);

    for (const bucket of buckets) {
      try {
        // Verificar si el bucket existe
        await this.s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        // Si no existe, crearlo
        try {
          await this.s3Client.send(new CreateBucketCommand({ Bucket: bucket }));
          console.log(`Bucket ${bucket} created successfully`);
        } catch (createError) {
          console.error(`Error creating bucket ${bucket}:`, createError);
        }
      }
    }
  }

  /**
   * Sube un archivo a MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    bucket: string = STORAGE_BUCKETS.UPLOADS,
    path?: string,
  ): Promise<{ key: string; url: string }> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.originalname}`;
      const key = path ? `${path}/${fileName}` : fileName;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: 'system', // Aquí podrías agregar el ID del usuario
        },
      });

      await this.s3Client.send(command);

      const url = await this.getFileUrl(bucket, key);

      return {
        key,
        url,
      };
    } catch (error) {
      throw new InternalServerErrorException(`Error uploading file: ${error.message}`);
    }
  }

  /**
   * Obtiene un archivo de MinIO
   */
  async getFile(bucket: string, key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const stream = response.Body as Readable;

      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
      });
    } catch (error) {
      throw new InternalServerErrorException(`Error getting file: ${error.message}`);
    }
  }

  /**
   * Elimina un archivo de MinIO
   */
  async deleteFile(bucket: string, key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting file: ${error.message}`);
    }
  }

  /**
   * Genera una URL firmada para acceso temporal
   */
  async getSignedUrl(
    bucket: string,
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      throw new InternalServerErrorException(`Error generating signed URL: ${error.message}`);
    }
  }

  /**
   * Obtiene la URL pública de un archivo (para desarrollo)
   */
  async getFileUrl(bucket: string, key: string): Promise<string> {
    // En desarrollo, puedes acceder directamente
    const endpoint = `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`;
    return `${endpoint}/${bucket}/${key}`;
  }

  /**
   * Lista archivos en un bucket
   */
  async listFiles(bucket: string, prefix?: string): Promise<any[]> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        MaxKeys: 100,
      });

      const response = await this.s3Client.send(command);
      return response.Contents || [];
    } catch (error) {
      throw new InternalServerErrorException(`Error listing files: ${error.message}`);
    }
  }

  /**
   * Valida el tipo de archivo
   */
  validateFileType(file: Express.Multer.File, allowedTypes: string[]): void {
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }
  }

  /**
   * Valida el tamaño del archivo
   */
  validateFileSize(file: Express.Multer.File, maxSize: number): void {
    if (file.size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      );
    }
  }
}
