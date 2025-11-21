import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseDocument } from './entities/enterprise-document.entity';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { DocumentStatus, DocumentType } from './enums/verification-status.enum';

@Injectable()
export class EnterpriseDocumentService {
  constructor(
    @InjectRepository(EnterpriseDocument)
    private readonly documentRepository: Repository<EnterpriseDocument>,
  ) {}

  /**
   * Create a new enterprise document
   */
  async createDocument(
    enterpriseId: string,
    uploadDto: UploadDocumentDto,
    fileData: {
      fileName: string;
      fileKey: string;
      fileUrl: string;
      mimeType: string;
      fileSize: number;
    },
  ): Promise<EnterpriseDocument> {
    // Check if a document of the same type already exists and is active
    const existingDocument = await this.documentRepository.findOne({
      where: {
        enterpriseId,
        type: uploadDto.type,
        isActive: true,
      },
      order: { version: 'DESC' },
    });

    let version = 1;
    if (existingDocument) {
      // Increment version for new upload of same type
      version = existingDocument.version + 1;
    }

    const document = this.documentRepository.create({
      enterpriseId,
      type: uploadDto.type,
      description: uploadDto.description,
      expirationDate: uploadDto.expirationDate
        ? new Date(uploadDto.expirationDate)
        : undefined,
      fileName: fileData.fileName,
      fileKey: fileData.fileKey,
      fileUrl: fileData.fileUrl,
      mimeType: fileData.mimeType,
      fileSize: fileData.fileSize,
      version,
      status: DocumentStatus.PENDING,
      isActive: true,
    });

    const saved = await this.documentRepository.save(document);
    return saved;
  }

  /**
   * Get all documents for an enterprise
   */
  async getDocumentsByEnterprise(enterpriseId: string): Promise<EnterpriseDocument[]> {
    return await this.documentRepository.find({
      where: { enterpriseId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get a specific document by ID
   */
  async getDocumentById(
    documentId: string,
    enterpriseId: string,
  ): Promise<EnterpriseDocument> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId, enterpriseId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  /**
   * Approve a document (SUPER_ADMIN only)
   */
  async approveDocument(
    documentId: string,
    approvedBy: string,
  ): Promise<EnterpriseDocument> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.status === DocumentStatus.APPROVED) {
      throw new BadRequestException('Document is already approved');
    }

    document.status = DocumentStatus.APPROVED;
    document.approvedBy = approvedBy;
    document.approvalDate = new Date();
    document.rejectionReason = undefined;

    return await this.documentRepository.save(document);
  }

  /**
   * Reject a document (SUPER_ADMIN only)
   */
  async rejectDocument(
    documentId: string,
    rejectionReason: string,
  ): Promise<EnterpriseDocument> {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    document.status = DocumentStatus.REJECTED;
    document.rejectionReason = rejectionReason;
    document.approvalDate = new Date();

    return await this.documentRepository.save(document);
  }

  /**
   * Soft delete a document
   */
  async deleteDocument(
    documentId: string,
    enterpriseId: string,
  ): Promise<void> {
    const document = await this.getDocumentById(documentId, enterpriseId);

    document.isActive = false;
    await this.documentRepository.save(document);
  }

  /**
   * Get all pending documents across all enterprises (SUPER_ADMIN only)
   */
  async getAllPendingDocuments(): Promise<EnterpriseDocument[]> {
    return await this.documentRepository.find({
      where: { status: DocumentStatus.PENDING, isActive: true },
      relations: ['enterprise'],
      order: { createdAt: 'ASC' },
    });
  }

  /**
   * Get documents by type for an enterprise
   */
  async getDocumentsByType(
    enterpriseId: string,
    type: DocumentType,
  ): Promise<EnterpriseDocument[]> {
    return await this.documentRepository.find({
      where: { enterpriseId, type, isActive: true },
      order: { version: 'DESC' },
    });
  }

  /**
   * Check if all required documents are approved for an enterprise
   */
  async checkRequiredDocuments(enterpriseId: string): Promise<{
    allApproved: boolean;
    missingTypes: DocumentType[];
    pendingCount: number;
  }> {
    const requiredTypes = [
      DocumentType.TAX_ID,
      DocumentType.CHAMBER_COMMERCE,
      DocumentType.LEGAL_REP_ID,
    ];

    const documents = await this.getDocumentsByEnterprise(enterpriseId);

    const missingTypes: DocumentType[] = [];
    let pendingCount = 0;

    for (const type of requiredTypes) {
      const doc = documents.find(
        (d) => d.type === type && d.status === DocumentStatus.APPROVED,
      );
      if (!doc) {
        missingTypes.push(type);
        const pendingDoc = documents.find(
          (d) => d.type === type && d.status === DocumentStatus.PENDING,
        );
        if (pendingDoc) {
          pendingCount++;
        }
      }
    }

    return {
      allApproved: missingTypes.length === 0,
      missingTypes,
      pendingCount,
    };
  }
}
