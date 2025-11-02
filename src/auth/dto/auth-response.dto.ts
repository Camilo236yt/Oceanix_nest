export interface AuthResponseDto {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  token: string;
  redirectTo: 'app' | 'crm';
}

export interface LoginResponseDto {
  id: string;
  email: string;
  name: string;
  lastName: string;
  token: string;
  redirectTo: 'app' | 'crm';
}

export interface RegisterResponseDto {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  isActive: boolean;
  token: string;
  message: string;
  redirectTo: 'app' | 'crm';
}
