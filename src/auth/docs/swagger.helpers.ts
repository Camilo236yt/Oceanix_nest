import { ApiResponse } from '@nestjs/swagger';

// Error response schemas
export const ErrorResponses = {
  BadRequest: (description: string = 'Bad request') => ({
    status: 400,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          oneOf: [
            { type: 'string', example: 'Validation failed' },
            { type: 'array', items: { type: 'string' }, example: ['email must be an email', 'password is too weak'] }
          ]
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  }),

  Unauthorized: (description: string = 'Unauthorized') => ({
    status: 401,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid credentials' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  }),

  NotFound: (description: string = 'Resource not found') => ({
    status: 404,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Usuario no encontrado' },
        error: { type: 'string', example: 'Not Found' },
      },
    },
  }),

  TooManyRequests: (description: string = 'Too many requests') => ({
    status: 429,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 429 },
        message: { type: 'string', example: 'ThrottlerException: Too Many Requests' },
        error: { type: 'string', example: 'Too Many Requests' },
      },
    },
  }),

  InternalServerError: (description: string = 'Internal server error') => ({
    status: 500,
    description,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: 'Internal server error' },
        error: { type: 'string', example: 'Internal Server Error' },
      },
    },
  }),
};

// Success response schemas
export const SuccessUserResponse = {
  schema: {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '3fd85f64-5717-4562-b3fc-2c963f66afa6' },
          email: { type: 'string', format: 'email', example: 'user@example.com' },
          name: { type: 'string', example: 'John' },
          lastName: { type: 'string', example: 'Doe' },
          phoneNumber: { type: 'string', example: '+573001234567' },
          isActive: { type: 'boolean', example: true },
          isEmailVerified: { type: 'boolean', example: false },
        },
      },
      message: { type: 'string', example: 'Usuario registrado exitosamente' },
    },
  },
};

// Request body examples
export const AuthExamples = {
  Register: {
    name: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phoneNumber: '+573001234567',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!',
    address: 'Calle 123 #45-67',
    identificationType: 'CC',
    identificationNumber: '1234567890',
  },

  Login: {
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
  },

  GoogleLogin: {
    idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0NTBhM...',
  },

  GoogleLoginClient: {
    idToken: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE4MmU0NTBhM...',
  },

  VerifyEmail: {
    email: 'john.doe@example.com',
    code: '123456',
  },

  ResendVerification: {
    email: 'john.doe@example.com',
  },
};
