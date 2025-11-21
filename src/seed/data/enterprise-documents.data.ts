import { DocumentType, DocumentStatus } from '../../enterprise-config/enums/verification-status.enum';

/**
 * Datos de documentos de empresas
 * Agrupados por empresa usando el índice de ENTERPRISES_DATA
 */
export interface EnterpriseDocumentData {
  enterpriseIndex: number; // Índice de la empresa en ENTERPRISES_DATA
  type: DocumentType;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  description: string;
  status: DocumentStatus;
  approvalDate?: Date;
  rejectionReason?: string;
  version: number;
}

export const ENTERPRISE_DOCUMENTS_DATA: EnterpriseDocumentData[] = [
  // ===== TechCorp (index 0) - Todos aprobados =====
  {
    enterpriseIndex: 0,
    type: DocumentType.TAX_ID,
    fileName: 'techcorp_rut_2025.pdf',
    fileKey: 'enterprises/techcorp/documents/tax_id.pdf',
    fileUrl: 'https://example.com/docs/techcorp_tax_id.pdf',
    mimeType: 'application/pdf',
    fileSize: 245632,
    description: 'RUT vigente 2025',
    status: DocumentStatus.APPROVED,
    approvalDate: new Date('2025-01-12'),
    version: 1,
  },
  {
    enterpriseIndex: 0,
    type: DocumentType.CHAMBER_COMMERCE,
    fileName: 'techcorp_chamber_commerce.pdf',
    fileKey: 'enterprises/techcorp/documents/chamber.pdf',
    fileUrl: 'https://example.com/docs/techcorp_chamber.pdf',
    mimeType: 'application/pdf',
    fileSize: 189456,
    description: 'Certificado Cámara de Comercio',
    status: DocumentStatus.APPROVED,
    approvalDate: new Date('2025-01-13'),
    version: 1,
  },
  {
    enterpriseIndex: 0,
    type: DocumentType.LEGAL_REP_ID,
    fileName: 'techcorp_legal_rep_id.pdf',
    fileKey: 'enterprises/techcorp/documents/legal_rep.pdf',
    fileUrl: 'https://example.com/docs/techcorp_legal_rep.pdf',
    mimeType: 'application/pdf',
    fileSize: 156234,
    description: 'Cédula representante legal',
    status: DocumentStatus.APPROVED,
    approvalDate: new Date('2025-01-14'),
    version: 1,
  },

  // ===== Global Services (index 1) - Pendientes =====
  {
    enterpriseIndex: 1,
    type: DocumentType.TAX_ID,
    fileName: 'globalservices_rut.pdf',
    fileKey: 'enterprises/globalservices/documents/tax_id.pdf',
    fileUrl: 'https://example.com/docs/globalservices_tax.pdf',
    mimeType: 'application/pdf',
    fileSize: 234567,
    description: 'RUT de la empresa',
    status: DocumentStatus.PENDING,
    version: 1,
  },
  {
    enterpriseIndex: 1,
    type: DocumentType.CHAMBER_COMMERCE,
    fileName: 'globalservices_chamber.pdf',
    fileKey: 'enterprises/globalservices/documents/chamber.pdf',
    fileUrl: 'https://example.com/docs/globalservices_chamber.pdf',
    mimeType: 'application/pdf',
    fileSize: 198765,
    description: 'Certificado Cámara de Comercio',
    status: DocumentStatus.PENDING,
    version: 1,
  },

  // ===== Innovation Labs (index 2) - Uno rechazado, otros pendientes =====
  {
    enterpriseIndex: 2,
    type: DocumentType.TAX_ID,
    fileName: 'innovationlabs_rut_expired.pdf',
    fileKey: 'enterprises/innovationlabs/documents/tax_id_old.pdf',
    fileUrl: 'https://example.com/docs/innovationlabs_tax_old.pdf',
    mimeType: 'application/pdf',
    fileSize: 267890,
    description: 'RUT - versión anterior',
    status: DocumentStatus.REJECTED,
    rejectionReason:
      'Documento vencido. Fecha de expedición: 2023-01-01. Por favor suba versión actualizada.',
    approvalDate: new Date('2025-02-10'),
    version: 1,
  },
  {
    enterpriseIndex: 2,
    type: DocumentType.LEGAL_REP_ID,
    fileName: 'innovationlabs_legal_rep.pdf',
    fileKey: 'enterprises/innovationlabs/documents/legal_rep.pdf',
    fileUrl: 'https://example.com/docs/innovationlabs_legal.pdf',
    mimeType: 'application/pdf',
    fileSize: 145678,
    description: 'Cédula del representante legal',
    status: DocumentStatus.PENDING,
    version: 1,
  },
];
