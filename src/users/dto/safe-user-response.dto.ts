import { User } from '../entities/user.entity';

export class SafeUserResponseDto {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function sanitizeUserForCache(user: User): SafeUserResponseDto {
  const { password, ...safeUser } = user;
  return safeUser as SafeUserResponseDto;
}

export function sanitizeUsersArrayForCache(users: User[]): SafeUserResponseDto[] {
  return users.map(user => sanitizeUserForCache(user));
}
