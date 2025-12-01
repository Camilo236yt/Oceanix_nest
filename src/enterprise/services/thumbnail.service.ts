import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';
import { convert } from 'pdf-poppler';

@Injectable()
export class ThumbnailService {
    private readonly logger = new Logger(ThumbnailService.name);
    private readonly thumbnailsPath: string;
    private readonly thumbnailSize = 200;

    constructor(private readonly configService: ConfigService) {
        // Get base uploads path from config or use default
        const uploadsPath = this.configService.get('UPLOADS_PATH') || 'uploads';
        this.thumbnailsPath = path.join(uploadsPath, 'thumbnails');
    }

    /**
     * Generate or retrieve cached PDF thumbnail
     * @param pdfPath Path to the PDF file
     * @param enterpriseId Enterprise ID for organization
     * @param documentId Document ID for caching
     * @returns Buffer containing JPEG thumbnail
     */
    async generatePdfThumbnail(
        pdfPath: string,
        enterpriseId: string,
        documentId: string
    ): Promise<Buffer> {
        try {
            // Check if PDF exists
            await fs.access(pdfPath);

            // Check cache first
            const cachedThumbnail = await this.getThumbnailFromCache(enterpriseId, documentId);
            if (cachedThumbnail) {
                this.logger.log(`Serving cached thumbnail for document ${documentId}`);
                return cachedThumbnail;
            }

            // Generate new thumbnail
            this.logger.log(`Generating new thumbnail for document ${documentId}`);
            const thumbnail = await this.createThumbnail(pdfPath);

            // Cache the thumbnail
            await this.cacheThumbnail(thumbnail, enterpriseId, documentId);

            return thumbnail;
        } catch (error) {
            this.logger.error(`Error generating thumbnail for ${documentId}: ${error.message}`);
            throw new NotFoundException('Could not generate thumbnail for this document');
        }
    }

    /**
     * Create thumbnail from PDF file
     * @param pdfPath Path to PDF file
     * @returns Buffer containing JPEG image
     */
    private async createThumbnail(pdfPath: string): Promise<Buffer> {
        const tempDir = path.join(this.thumbnailsPath, 'temp');

        // Ensure temp directory exists
        await fs.mkdir(tempDir, { recursive: true });

        const outputPrefix = `temp_${Date.now()}`;

        try {
            // Convert first page of PDF to image using pdf-poppler
            const options = {
                format: 'jpeg',
                out_dir: tempDir,
                out_prefix: outputPrefix,
                page: 1, // Only first page
                scale: 2048, // High quality for better thumbnail
            };

            await convert(pdfPath, options);

            // Read the generated image
            const generatedImagePath = path.join(tempDir, `${outputPrefix}-1.jpg`);
            const imageBuffer = await fs.readFile(generatedImagePath);

            // Resize and optimize with sharp
            const thumbnail = await sharp(imageBuffer)
                .resize(this.thumbnailSize, this.thumbnailSize, {
                    fit: 'cover',
                    position: 'top',
                })
                .jpeg({
                    quality: 85,
                    progressive: true,
                })
                .toBuffer();

            // Clean up temp file
            await fs.unlink(generatedImagePath).catch(() => { });

            return thumbnail;
        } catch (error) {
            this.logger.error(`Error in createThumbnail: ${error.message}`);

            // Clean up temp directory
            await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });

            throw error;
        }
    }

    /**
     * Get thumbnail from cache
     * @param enterpriseId Enterprise ID
     * @param documentId Document ID
     * @returns Buffer if cached, null if not found
     */
    private async getThumbnailFromCache(
        enterpriseId: string,
        documentId: string
    ): Promise<Buffer | null> {
        try {
            const thumbnailPath = this.getThumbnailPath(enterpriseId, documentId);
            return await fs.readFile(thumbnailPath);
        } catch (error) {
            // File not found or error reading - return null
            return null;
        }
    }

    /**
     * Cache thumbnail to disk
     * @param thumbnail Thumbnail buffer
     * @param enterpriseId Enterprise ID
     * @param documentId Document ID
     */
    private async cacheThumbnail(
        thumbnail: Buffer,
        enterpriseId: string,
        documentId: string
    ): Promise<void> {
        const thumbnailPath = this.getThumbnailPath(enterpriseId, documentId);
        const dir = path.dirname(thumbnailPath);

        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });

        // Write thumbnail
        await fs.writeFile(thumbnailPath, thumbnail);
        this.logger.log(`Cached thumbnail at ${thumbnailPath}`);
    }

    /**
     * Get path for thumbnail file
     * @param enterpriseId Enterprise ID
     * @param documentId Document ID
     * @returns Full path to thumbnail file
     */
    private getThumbnailPath(enterpriseId: string, documentId: string): string {
        return path.join(this.thumbnailsPath, enterpriseId, `${documentId}.jpg`);
    }

    /**
     * Delete cached thumbnail
     * @param enterpriseId Enterprise ID
     * @param documentId Document ID
     */
    async deleteThumbnail(enterpriseId: string, documentId: string): Promise<void> {
        try {
            const thumbnailPath = this.getThumbnailPath(enterpriseId, documentId);
            await fs.unlink(thumbnailPath);
            this.logger.log(`Deleted thumbnail for document ${documentId}`);
        } catch (error) {
            // Ignore errors if file doesn't exist
            this.logger.debug(`Could not delete thumbnail for ${documentId}: ${error.message}`);
        }
    }

    /**
     * Delete all thumbnails for an enterprise
     * @param enterpriseId Enterprise ID
     */
    async deleteEnterpriseThumbnails(enterpriseId: string): Promise<void> {
        try {
            const enterpriseThumbnailsPath = path.join(this.thumbnailsPath, enterpriseId);
            await fs.rm(enterpriseThumbnailsPath, { recursive: true, force: true });
            this.logger.log(`Deleted all thumbnails for enterprise ${enterpriseId}`);
        } catch (error) {
            this.logger.error(`Error deleting thumbnails for enterprise ${enterpriseId}: ${error.message}`);
        }
    }
}
