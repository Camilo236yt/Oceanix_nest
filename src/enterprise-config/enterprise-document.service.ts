import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EnterpriseDocument } from './entities/enterprise-document.entity';
import { DocumentStatus, DocumentType } from './enums/verification-status.enum';

@Injectable()
export class EnterpriseDocumentService {
  constructor(
    @InjectRepository(EnterpriseDocument)
    private readonly documentRepository: Repository<EnterpriseDocument>,
  ) { }

  /**
   * Create a new enterprise document
   */
  async createDocument(
    enterpriseId: string,
    type: DocumentType,
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
        type,
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
      type,
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
   * Create multiple enterprise documents at once
   */
  async createMultipleDocuments(
    enterpriseId: string,
    documents: Array<{
      type: DocumentType;
      fileData: {
        fileName: string;
        fileKey: string;
        fileUrl: string;
        mimeType: string;
        fileSize: number;
      };
    }>,
  ): Promise<EnterpriseDocument[]> {
    const createdDocuments: EnterpriseDocument[] = [];

    for (const doc of documents) {
      const document = await this.createDocument(
        enterpriseId,
        doc.type,
        doc.fileData,
      );
      createdDocuments.push(document);
    }

    return createdDocuments;
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
