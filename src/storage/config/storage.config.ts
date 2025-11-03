import { S3ClientConfig } from '@aws-sdk/client-s3';

export const getStorageConfig = (): S3ClientConfig => {
  return {
    endpoint: `http://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
    region: 'us-east-1', // MinIO requiere una región, usamos la default
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY || 'minio_admin',
      secretAccessKey: process.env.MINIO_SECRET_KEY || 'minio_password_dev',
    },
    forcePathStyle: true, // Necesario para MinIO
  };
};

export const STORAGE_BUCKETS = {
  UPLOADS: 'oceanix-uploads',
  DOCUMENTS: 'oceanix-documents',
  AVATARS: 'oceanix-avatars',
  TICKETS: 'oceanix-tickets',
} as const;

export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
} as const;

export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
} as const;