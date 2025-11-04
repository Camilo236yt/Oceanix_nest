import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { RegisterEnterpriseDto } from '../dto/register-enterprise.dto';
import { ErrorResponses } from '../../auth/docs/swagger.helpers';

export const EnterpriseApiTags = () => ApiTags('Enterprise');

export const RegisterEnterpriseDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Registrar nueva empresa con administrador',
      description: 'Crea una nueva empresa y su usuario administrador en una sola transacción. Este es el punto de entrada para que nuevas empresas se unan a la plataforma. Opcionalmente puede asociar direcciones existentes del módulo de Location.',
    }),
    ApiBody({
      type: RegisterEnterpriseDto,
      examples: {
        registroBasico: {
          summary: 'Registro básico (sin dirección)',
          description: 'Registro inicial sin dirección. La dirección se puede agregar después mediante PATCH /enterprise/:id',
          value: {
            // Enterprise data
            enterpriseName: 'Acme Corporation',
            subdomain: 'acme-corp',
            enterpriseEmail: 'contact@acme.com',
            enterprisePhone: '+573001234567',
            enterpriseTaxIdType: 'NIT',
            enterpriseTaxIdNumber: '900123456-7',
            // Admin user data
            adminName: 'John',
            adminLastName: 'Doe',
            adminEmail: 'john.doe@acme.com',
            adminPhoneNumber: '+573009876543',
            adminPassword: 'SecurePass123!',
            adminConfirmPassword: 'SecurePass123!',
            adminIdentificationType: 'CC',
            adminIdentificationNumber: '1234567890',
            acceptTerms: true,
          },
        },
        registroConDireccion: {
          summary: 'Registro completo (con dirección)',
          description: 'Si ya tienes direcciones creadas, puedes asociarlas al momento del registro',
          value: {
            // Enterprise data
            enterpriseName: 'Acme Corporation',
            subdomain: 'acme-corp',
            enterpriseEmail: 'contact@acme.com',
            enterprisePhone: '+573001234567',
            enterpriseAddressId: '550e8400-e29b-41d4-a716-446655440003',
            enterpriseTaxIdType: 'NIT',
            enterpriseTaxIdNumber: '900123456-7',
            // Admin user data
            adminName: 'John',
            adminLastName: 'Doe',
            adminEmail: 'john.doe@acme.com',
            adminPhoneNumber: '+573009876543',
            adminPassword: 'SecurePass123!',
            adminConfirmPassword: 'SecurePass123!',
            adminAddressId: '550e8400-e29b-41d4-a716-446655440004',
            adminIdentificationType: 'CC',
            adminIdentificationNumber: '1234567890',
            acceptTerms: true,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Enterprise and admin created successfully',
      schema: {
        type: 'object',
        properties: {
          enterprise: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', example: '3fd85f64-5717-4562-b3fc-2c963f66afa6' },
              name: { type: 'string', example: 'Acme Corporation' },
              subdomain: { type: 'string', example: 'acme-corp' },
              email: { type: 'string', example: 'contact@acme.com' },
              phone: { type: 'string', example: '+573001234567' },
              addressId: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440003' },
              taxIdType: { type: 'string', example: 'NIT' },
              taxIdNumber: { type: 'string', example: '900123456-7' },
              isActive: { type: 'boolean', example: true },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          admin: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', example: '7bc92a45-1234-5678-b9fc-1a234b567c89' },
              email: { type: 'string', example: 'john.doe@acme.com' },
              name: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              phoneNumber: { type: 'string', example: '+573009876543' },
              enterpriseId: { type: 'string', format: 'uuid' },
              userType: { type: 'string', example: 'ENTERPRISE_ADMIN' },
              isActive: { type: 'boolean', example: true },
              isEmailVerified: { type: 'boolean', example: false },
            },
          },
          message: { type: 'string', example: 'Empresa registrada exitosamente. Por favor verifica tu email.' },
        },
      },
    }),
    ApiResponse(ErrorResponses.BadRequest('Validation error, subdomain/name already exists, or passwords do not match')),
    ApiResponse(ErrorResponses.InternalServerError('Transaction failed')),
  );
