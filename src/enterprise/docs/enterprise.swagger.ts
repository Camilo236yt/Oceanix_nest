import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { RegisterEnterpriseDto } from '../dto/register-enterprise.dto';
import { ErrorResponses } from '../../auth/docs/swagger.helpers';

export const EnterpriseApiTags = () => ApiTags('Enterprise');

export const RegisterEnterpriseDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register new enterprise with admin',
      description: 'Creates a new enterprise (company) and its administrator user in a single transaction. This is the entry point for new companies to join the platform.',
    }),
    ApiBody({
      type: RegisterEnterpriseDto,
      examples: {
        example1: {
          summary: 'Complete enterprise registration',
          value: {
            // Enterprise data
            enterpriseName: 'Acme Corporation',
            subdomain: 'acme-corp',
            enterpriseEmail: 'contact@acme.com',
            enterprisePhone: '+573001234567',
            enterpriseAddress: 'Calle 100 #15-20, Bogotá',
            // Admin user data
            adminName: 'John',
            adminLastName: 'Doe',
            adminEmail: 'john.doe@acme.com',
            adminPhoneNumber: '+573009876543',
            adminPassword: 'SecurePass123!',
            adminConfirmPassword: 'SecurePass123!',
            adminAddress: 'Carrera 7 #80-45',
            adminIdentificationType: 'CC',
            adminIdentificationNumber: '1234567890',
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
              address: { type: 'string', example: 'Calle 100 #15-20, Bogotá' },
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
