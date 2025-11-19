import { UserType } from '../../users/entities/user.entity';
import { VerificationStatus } from '../../enterprise-config/enums/verification-status.enum';

/**
 * User profile information
 */
export interface UserProfileDto {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phoneNumber: string;
  userType: UserType;
  isEmailVerified: boolean;
  isActive: boolean;
}

/**
 * Enterprise information
 */
export interface EnterpriseDto {
  id: string;
  name: string;
  subdomain: string;
  email: string;
  phone: string;
}

/**
 * Enterprise configuration (visual customization)
 */
export interface EnterpriseConfigDto {
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  bannerUrl?: string;
  requireCorporateEmail: boolean;
}

/**
 * Role information
 */
export interface RoleDto {
  id: string;
  name: string;
  description: string;
}

/**
 * Complete user profile response
 * Contains all information needed to configure the frontend application
 */
export interface UserProfileResponseDto {
  user: UserProfileDto;
  enterprise: EnterpriseDto;
  config: EnterpriseConfigDto;
  roles: RoleDto[];
  permissions: string[]; // Array of unique permission names
}
