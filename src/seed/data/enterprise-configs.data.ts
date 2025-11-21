import { VerificationStatus } from '../../enterprise-config/enums/verification-status.enum';

/**
 * Datos de configuración de empresas
 * El índice del array corresponde al índice de la empresa en ENTERPRISES_DATA
 */
export interface EnterpriseConfigData {
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationDate?: Date;
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  emailDomains: string[];
  requireCorporateEmail: boolean;
  rejectionReason?: string;
}

export const ENTERPRISE_CONFIGS_DATA: EnterpriseConfigData[] = [
  // TechCorp - Verificada
  {
    isVerified: true,
    verificationStatus: VerificationStatus.VERIFIED,
    verificationDate: new Date('2025-01-15'),
    primaryColor: '#2563EB',
    secondaryColor: '#1E40AF',
    accentColor: '#F59E0B',
    emailDomains: ['techcorp.com', 'tc.com'],
    requireCorporateEmail: false,
  },

  // Global Services - Pendiente
  {
    isVerified: false,
    verificationStatus: VerificationStatus.PENDING,
    primaryColor: '#10B981',
    secondaryColor: '#059669',
    accentColor: '#8B5CF6',
    emailDomains: ['globalservices.com'],
    requireCorporateEmail: true,
  },

  // Innovation Labs - Rechazada
  {
    isVerified: false,
    verificationStatus: VerificationStatus.REJECTED,
    rejectionReason: 'Tax ID document is expired. Please upload updated documentation.',
    verificationDate: new Date('2025-02-10'),
    primaryColor: '#EF4444',
    secondaryColor: '#DC2626',
    accentColor: '#F97316',
    emailDomains: ['innovationlabs.com', 'ilabs.io'],
    requireCorporateEmail: false,
  },
];
