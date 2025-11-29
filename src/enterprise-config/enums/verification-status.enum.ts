export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress', // Admin verificó email pero empresa no verificada aún
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export enum DocumentType {
  TAX_ID = 'tax_id', // RUT/NIT/CUIT
  CHAMBER_COMMERCE = 'chamber_commerce', // Cámara de comercio
  LEGAL_REP_ID = 'legal_rep_id', // Cédula representante legal
  POWER_ATTORNEY = 'power_attorney', // Poder notarial
  BANK_CERTIFICATE = 'bank_certificate', // Certificado bancario
  OTHER = 'other',
}

export enum DocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
