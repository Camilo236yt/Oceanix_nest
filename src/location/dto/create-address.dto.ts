import { IsString, IsOptional, IsUUID, IsNumber, IsBoolean, IsEnum, MaxLength, IsLatitude, IsLongitude } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AddressType {
  PRIMARY = 'primary',
  BILLING = 'billing',
  SHIPPING = 'shipping',
  WORK = 'work',
  HOME = 'home'
}

export class CreateAddressDto {
  @ApiProperty({
    example: 'Calle 100 #15-20',
    description: 'Street address'
  })
  @IsString()
  @MaxLength(255)
  streetAddress: string;

  @ApiProperty({
    example: 'Chicó',
    description: 'Neighborhood',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  neighborhood?: string;

  @ApiProperty({
    example: 'Usaquén',
    description: 'Locality/District',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  locality?: string;

  @ApiProperty({
    example: 'Apt 301',
    description: 'Apartment/Suite number',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  apartment?: string;

  @ApiProperty({
    example: '110111',
    description: 'Postal code',
    required: false
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'City ID'
  })
  @IsUUID()
  cityId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'State/Department ID'
  })
  @IsUUID()
  stateId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'Country ID'
  })
  @IsUUID()
  countryId: string;

  @ApiProperty({
    example: 'Torre empresarial, piso 3',
    description: 'Additional information',
    required: false
  })
  @IsString()
  @IsOptional()
  additionalInfo?: string;

  @ApiProperty({
    example: 'Cerca al centro comercial Andino',
    description: 'References to find the location',
    required: false
  })
  @IsString()
  @IsOptional()
  references?: string;

  @ApiProperty({
    example: 4.689167,
    description: 'Latitude coordinate',
    required: false
  })
  @IsNumber()
  @IsLatitude()
  @IsOptional()
  latitude?: number;

  @ApiProperty({
    example: -74.053611,
    description: 'Longitude coordinate',
    required: false
  })
  @IsNumber()
  @IsLongitude()
  @IsOptional()
  longitude?: number;

  @ApiProperty({
    example: 'primary',
    description: 'Address type',
    enum: AddressType,
    default: AddressType.PRIMARY
  })
  @IsEnum(AddressType)
  @IsOptional()
  type?: AddressType = AddressType.PRIMARY;

  @ApiProperty({
    example: false,
    description: 'Is this the default address',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean = false;
}