import { IsString, IsBoolean, IsOptional, IsNumber, IsIn } from 'class-validator';

export class CreateDomainDto {
  @IsString()
  subdomain: string;

  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsNumber()
  port?: number;

  @IsOptional()
  @IsBoolean()
  https?: boolean;

  @IsOptional()
  @IsString()
  applicationId?: string;

  @IsOptional()
  @IsIn(['letsencrypt', 'none'])
  certificateType?: 'letsencrypt' | 'none';
}
