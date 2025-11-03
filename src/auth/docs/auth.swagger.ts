import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiTags } from '@nestjs/swagger';
import { LoginDto } from '../dto/login-dto';
import { RegisterDto } from '../dto/register.dto';
import { GoogleLoginDto } from '../dto/google-login.dto';
import { VerifyEmailCodeDto } from 'src/email-verification/dto/verify-email-code.dto';
import { ErrorResponses, SuccessUserResponse, AuthExamples } from './swagger.helpers';

export const AuthApiTags = () => ApiTags('Authentication');

export const RegisterDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description: 'Creates a new user account and returns user data with authentication cookie. The token is set as an httpOnly cookie named "authToken".'
    }),
    ApiBody({
      type: RegisterDto,
      examples: {
        example1: {
          summary: 'Complete registration',
          description: 'All fields filled',
          value: AuthExamples.Register,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User successfully registered',
      ...SuccessUserResponse,
    }),
    ApiResponse(ErrorResponses.BadRequest('Validation error or email already exists')),
    ApiResponse(ErrorResponses.TooManyRequests('Maximum 3 registration attempts per minute')),
  );

export const LoginDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User login',
      description: 'Authenticates a user with email and password. Sets authentication token as httpOnly cookie.'
    }),
    ApiBody({
      type: LoginDto,
      examples: {
        example1: {
          summary: 'Login example',
          value: AuthExamples.Login,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      ...SuccessUserResponse,
    }),
    ApiResponse(ErrorResponses.BadRequest('Invalid credentials or validation error')),
    ApiResponse(ErrorResponses.TooManyRequests('Maximum 5 login attempts per minute')),
  );

export const LoginDevDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Developer login (returns token in body)',
      description: 'Login endpoint for development/testing - returns JWT token in response body instead of cookie. Use this for API testing tools like Postman.'
    }),
    ApiBody({
      type: LoginDto,
      examples: {
        example1: {
          summary: 'Login example',
          value: AuthExamples.Login,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful with token in body',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', example: '3fd85f64-5717-4562-b3fc-2c963f66afa6' },
              email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
              name: { type: 'string', example: 'John' },
              lastName: { type: 'string', example: 'Doe' },
              phoneNumber: { type: 'string', example: '+573001234567' },
              isActive: { type: 'boolean', example: true },
              isEmailVerified: { type: 'boolean', example: false },
            },
          },
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjNmZDg1ZjY0LTU3MTctNDU2Mi1iM2ZjLTJjOTYzZjY2YWZhNiIsImlhdCI6MTYzMjQ3ODQwMCwiZXhwIjoxNjMyNTY0ODAwfQ.example' },
          message: { type: 'string', example: 'Inicio de sesión exitoso' },
        },
      },
    }),
    ApiResponse(ErrorResponses.BadRequest('Invalid credentials or validation error')),
  );

export const GoogleLoginDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Google OAuth login',
      description: 'Authenticates a user via Google OAuth token. Creates new user if not exists. Sets authentication cookie.'
    }),
    ApiBody({
      type: GoogleLoginDto,
      examples: {
        example1: {
          summary: 'Google OAuth token',
          value: AuthExamples.GoogleLogin,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Google login successful',
      ...SuccessUserResponse,
    }),
    ApiResponse(ErrorResponses.BadRequest('Invalid or expired Google token')),
    ApiResponse(ErrorResponses.Unauthorized('Google authentication failed')),
  );

export const VerifyEmailDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Verify email with code',
      description: 'Verifies user email address using the 6-digit verification code sent to their email. Code expires after 15 minutes.'
    }),
    ApiBody({
      type: VerifyEmailCodeDto,
      examples: {
        example1: {
          summary: 'Verification code example',
          value: AuthExamples.VerifyEmail,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Email verified successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Email verificado exitosamente' },
        },
      },
    }),
    ApiResponse(ErrorResponses.BadRequest('Invalid or expired verification code')),
    ApiResponse(ErrorResponses.NotFound('User not found')),
    ApiResponse(ErrorResponses.TooManyRequests('Maximum 10 verification attempts per hour')),
  );

export const ResendVerificationDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Resend verification email',
      description: 'Generates and sends a new 6-digit verification code to the user\'s email. Previous codes are invalidated.'
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
        },
        required: ['email'],
      },
      examples: {
        example1: {
          summary: 'Resend verification code',
          value: AuthExamples.ResendVerification,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Verification email sent successfully',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Código de verificación reenviado' },
        },
      },
    }),
    ApiResponse(ErrorResponses.BadRequest('Invalid email or email already verified')),
    ApiResponse(ErrorResponses.NotFound('User not found')),
    ApiResponse(ErrorResponses.TooManyRequests('Maximum 3 resend attempts per hour')),
  );

export const LogoutDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'User logout',
      description: 'Logs out the user by clearing the httpOnly authentication cookie. No body required.'
    }),
    ApiResponse({
      status: 200,
      description: 'Logout successful',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logout exitoso' },
        },
      },
    }),
  );
