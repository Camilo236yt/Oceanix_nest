export interface BaseAuthResponseDto {
  id: string;
  email: string;
  name: string;
  lastName: string;
  token: string;
}

export interface LoginResponseDto extends BaseAuthResponseDto {}

export interface RegisterResponseDto extends BaseAuthResponseDto {
  message: string;
}
