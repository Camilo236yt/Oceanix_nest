import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

export class SafeUserResponseDto {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userType: string;
  enterpriseId: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles?: UserRole[]; // ✅ Agregado para incluir roles
}

export function sanitizeUserForCache(user: User): SafeUserResponseDto {
  const { password, ...safeUser } = user;
  return safeUser as SafeUserResponseDto;
}

export function sanitizeUsersArrayForCache(users: User[]): SafeUserResponseDto[] {
  return users.map(user => sanitizeUserForCache(user));
}
