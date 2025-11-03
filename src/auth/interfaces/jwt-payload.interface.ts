export interface JwtPayload {
  id: string;
}

export interface JwtUserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface EnrichedJwtUser {
  id: string;
  email: string;
  name: string;
  lastName: string;
  enterpriseId: string | null;
  userType: string;
  roles: JwtUserRole[];
  isActive: boolean;
  isEmailVerified: boolean;
}