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
      summary: 'Register a new CLIENT user',
      description: `Creates a new CLIENT user account for an existing enterprise and returns user data with authentication cookie.

      **IMPORTANT - Multi-tenant subdomain:**
      - The subdomain is automatically extracted from the Host header (e.g., acme.forif.co → "acme")
      - The user will be associated with the enterprise that has this subdomain
      - Example: If you access from acme.forif.co, the user will be registered under the "acme" enterprise
      - For local development, use acme.localhost:3000 or configure /etc/hosts

      The token is set as an httpOnly cookie named "authToken".`
    }),
    ApiBody({
      type: RegisterDto,
      examples: {
        example1: {
          summary: 'Complete registration',
          description: 'All fields filled. The subdomain is extracted from the URL (e.g., acme.forif.co)',
          value: AuthExamples.Register,
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'CLIENT user successfully registered and associated with enterprise',
      ...SuccessUserResponse,
    }),
    ApiResponse(ErrorResponses.BadRequest('Validation error, email already exists, subdomain not found, or enterprise inactive')),
    ApiResponse(ErrorResponses.TooManyRequests('Maximum 10 registration attempts per minute')),
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

export const GoogleLoginClientDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Login de clientes con Google OAuth',
      description: `Permite a los CLIENTES autenticarse usando Google OAuth. Este endpoint:

      **Características:**
      - ✅ Crea automáticamente el cliente si no existe
      - ✅ Valida que el email no esté registrado como empleado
      - ✅ Asocia el cliente con la empresa según el subdomain
      - ✅ Retorna token JWT en cookie httpOnly

      **IMPORTANTE - Subdomain:**
      - El subdomain se extrae automáticamente del header Host
      - Ejemplo: Si accedes desde \`acme.forif.co\`, el cliente se asocia a la empresa "acme"
      - Para desarrollo local: usar \`acme.localhost:3000\` o configurar /etc/hosts

      **Integración Frontend - Paso a paso:**

      1. **Instalar Google OAuth:**
      \`\`\`bash
      npm install @react-oauth/google
      \`\`\`

      2. **Configurar Google Provider:**
      \`\`\`jsx
      import { GoogleOAuthProvider } from '@react-oauth/google';

      <GoogleOAuthProvider clientId="TU_GOOGLE_CLIENT_ID">
        <App />
      </GoogleOAuthProvider>
      \`\`\`

      3. **Implementar botón de login:**
      \`\`\`jsx
      import { GoogleLogin } from '@react-oauth/google';

      <GoogleLogin
        onSuccess={(credentialResponse) => {
          // credentialResponse.credential contiene el idToken
          fetch('/auth/google/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // ⚠️ IMPORTANTE para cookies
            body: JSON.stringify({
              idToken: credentialResponse.credential
            })
          })
          .then(res => res.json())
          .then(data => {
            // Login exitoso - cookie seteada automáticamente
            console.log('Usuario:', data.user);
            // Redirigir al dashboard
          });
        }}
        onError={() => console.log('Login Failed')}
      />
      \`\`\`

      4. **Alternativa - Flujo manual:**
      \`\`\`jsx
      import { useGoogleLogin } from '@react-oauth/google';

      const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
          // Obtener el ID Token desde el tokenResponse
          const res = await fetch('/auth/google/client', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              idToken: tokenResponse.credential
            })
          });
          const data = await res.json();
        },
      });
      \`\`\``
    }),
    ApiBody({
      type: GoogleLoginDto,
      examples: {
        example1: {
          summary: 'Google ID Token',
          description: 'Token JWT obtenido desde Google Sign-In. El frontend debe enviarlo en el campo idToken.',
          value: AuthExamples.GoogleLoginClient,
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login exitoso - Cliente autenticado o creado',
      schema: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
              email: { type: 'string', format: 'email', example: 'cliente@gmail.com' },
              name: { type: 'string', example: 'María' },
              lastName: { type: 'string', example: 'García' },
              userType: { type: 'string', example: 'CLIENT' },
              isActive: { type: 'boolean', example: true },
              isEmailVerified: { type: 'boolean', example: true },
            },
          },
          message: { type: 'string', example: 'Login exitoso' },
        },
      },
    }),
    ApiResponse(ErrorResponses.BadRequest('Token de Google inválido, subdomain incorrecto, o email ya registrado como empleado')),
    ApiResponse(ErrorResponses.NotFound('Empresa no encontrada para el subdomain especificado')),
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

export const CheckSessionDoc = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Check session validity',
      description: 'Lightweight endpoint to check if the current session/token is valid. Returns 200 if valid, 401 if invalid or expired.'
    }),
    ApiResponse({
      status: 200,
      description: 'Session is valid',
    }),
    ApiResponse(ErrorResponses.Unauthorized('Invalid or expired session token')),
  );
