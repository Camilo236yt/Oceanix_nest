import { Controller, Post, Body, UseFilters, Res, Req, Get, Query, BadRequestException, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RegisterEnterpriseDto, GoogleLoginDto, ActivateAccountDto } from './dto';
import { VerifyEmailCodeDto } from 'src/email-verification/dto/verify-email-code.dto';
import type { AuthResponseDto, UserProfileResponseDto } from './interfaces';
import { CustomBadRequestFilter } from './filters/custom-bad-request.filter';
import { CookieHelper } from './utils/cookie.helper';
import { AuthApiTags, RegisterDoc, LoginDoc, LoginDevDoc, GoogleLoginDoc, GoogleLoginClientDoc, VerifyEmailDoc, ResendVerificationDoc, LogoutDoc, CheckSessionDoc } from './docs';
import { RegisterEnterpriseDoc } from '../enterprise/docs';
import { GetSubdomain } from '../common/decorators';
import { Auth, GetUser } from './decorator';
import { User } from '../users/entities/user.entity';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@AuthApiTags()
@Throttle({ default: { limit: 60, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) { }

  @RegisterEnterpriseDoc()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register-enterprise')
  async registerEnterprise(
    @Body() registerDto: RegisterEnterpriseDto
  ) {
    // NO seteamos cookies aquí - el usuario debe activar desde su subdomain
    return await this.authService.registerEnterprise(registerDto);
  }

  @Post('activate-account')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async activateAccount(
    @Body() dto: ActivateAccountDto,
    @GetSubdomain() subdomain: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<AuthResponseDto, 'token'>> {
    const result = await this.authService.activateAccount(dto.activationToken, subdomain);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @RegisterDoc()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<AuthResponseDto, 'token'>> {
    // Extraer subdomain del request (agregado por SubdomainMiddleware)
    const subdomain = req['subdomain'];
    const result = await this.authService.register(registerDto, subdomain);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @LoginDoc()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @UseFilters(CustomBadRequestFilter)
  async login(
    @Body() loginDto: LoginDto,
    @GetSubdomain() subdomain: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto, subdomain);
    CookieHelper.setAuthCookie(res, result.token);

    // Return the full result including the token in the body
    // Token is also set in HTTPOnly cookie for security in HTTP requests
    // Token in body is needed for WebSocket authentication
    return result;
  }

  @LoginDevDoc()
  @Post('login-dev')
  @UseFilters(CustomBadRequestFilter)
  async loginDev(
    @Body() loginDto: LoginDto,
    @GetSubdomain() subdomain: string
  ): Promise<AuthResponseDto> {
    return await this.authService.login(loginDto, subdomain);
  }

  @GoogleLoginDoc()
  @Post('google-login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<AuthResponseDto, 'token'>> {
    const result = await this.authService.googleLogin(googleLoginDto);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
  }

  @GoogleLoginClientDoc()
  @Post('google/client')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleLoginClient(
    @Body() googleLoginDto: GoogleLoginDto,
    @GetSubdomain() subdomain: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<AuthResponseDto> {
    const result = await this.authService.googleLoginClient(googleLoginDto, subdomain);
    CookieHelper.setAuthCookie(res, result.token);

    // Return the full result including the token in the body
    // Token is also set in HTTPOnly cookie for security in HTTP requests
    // Token in body is needed for WebSocket authentication
    return result;
  }

  /**
   * Callback centralizado de Google OAuth
   * 
   * Este endpoint recibe el callback de Google desde el dominio base (oceanix.space)
   * y redirige al subdomain del tenant correcto.
   * 
   * Flujo:
   * 1. Usuario en tenant1.oceanix.space inicia login con Google
   * 2. Google redirige a oceanix.space/auth/google/callback?code=xxx&state=...
   * 3. Este endpoint procesa el code y state
   * 4. Autentica al usuario
   * 5. Redirige a tenant1.oceanix.space/callback?token=yyy
   */
  @Get('google/callback')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async googleOAuthCallback(
    @Query('code') code: string,
    @Query('state') stateParam: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      // 1. Validar que tenemos code y state
      if (!code || !stateParam) {
        throw new BadRequestException('Missing code or state parameter');
      }

      this.logger.log(`📥 Received Google OAuth callback`);

      // 2. Detectar el dominio de origen desde los headers
      const origin = req.headers.origin || req.headers.referer;
      let detectedDomain: string | undefined;

      if (origin) {
        try {
          const url = new URL(origin);
          detectedDomain = url.host; // Incluye puerto si existe (ej: localhost:4200)
          this.logger.log(`🌐 Detected origin from headers: ${detectedDomain}`);
        } catch (e) {
          this.logger.warn(`Could not parse origin header: ${origin}`);
        }
      }

      // 3. Decodificar el state parameter
      const stateDecoded = Buffer.from(stateParam, 'base64').toString('utf-8');
      const state = JSON.parse(stateDecoded);
      const { subdomain, returnPath, originDomain } = state;

      if (!subdomain) {
        throw new BadRequestException('Invalid state parameter: missing subdomain');
      }

      // Usar el dominio detectado de los headers, o el del state, o APP_DOMAIN como fallback
      const finalOriginDomain = detectedDomain || originDomain || this.configService.get('APP_DOMAIN') || 'oceanix.space';

      this.logger.log(`🏢 Tenant subdomain: ${subdomain}`);
      this.logger.log(`🌐 Using origin domain: ${finalOriginDomain}`);

      // 3. Validar timestamp del state (máximo 10 minutos)
      if (state.timestamp) {
        const maxAge = 10 * 60 * 1000; // 10 minutos
        if (Date.now() - state.timestamp > maxAge) {
          throw new BadRequestException('State parameter expired');
        }
      }

      // 4. Intercambiar el código por el token de Google
      // IMPORTANTE: Google hace callback al BACKEND, no al frontend
      // Por eso SIEMPRE usamos APP_DOMAIN (dominio del backend)
      const googleToken = await this.authService.exchangeCodeForToken(code);

      if (!googleToken.id_token) {
        throw new BadRequestException('No se recibió id_token de Google');
      }

      // 5. Autenticar/registrar el usuario
      const result = await this.authService.googleLoginClient(
        { idToken: googleToken.id_token },
        subdomain
      );

      // 6. Construir URL de redirección
      const path = returnPath || '/portal/dashboard';
      let redirectUrl: string;

      if (originDomain) {
        // Si tenemos el dominio de origen del frontend, lo usamos directamente
        // originDomain ya viene como "localhost:4200" o "tenant.oceanix.space"
        const isLocal = originDomain.includes('localhost');
        const protocol = isLocal ? 'http' : 'https';
        redirectUrl = `${protocol}://${originDomain}${path}`;
      } else {
        // Fallback si no hay originDomain (comportamiento legacy)
        const appDomain = this.configService.get('APP_DOMAIN') || 'oceanix.space';
        const isLocal = appDomain.includes('localhost');

        if (isLocal) {
          redirectUrl = `http://${appDomain}${path}`;
        } else {
          // En producción, aseguramos el subdominio
          redirectUrl = `https://${subdomain}.${appDomain}${path}`;
        }
      }

      this.logger.log(`🔄 Redirecting user to: ${redirectUrl}`);

      // 7. Setear cookie de autenticación
      const cookieOptions: any = {
        httpOnly: true,
        path: '/',
      };

      const appDomain = this.configService.get('APP_DOMAIN') || 'oceanix.space';
      const isBackendLocal = appDomain.includes('localhost');
      const isFrontendLocal = redirectUrl.includes('localhost');

      if (isFrontendLocal && !isBackendLocal) {
        // CASO: Frontend Local (localhost) -> Backend Producción (oceanix.space)
        // Necesitamos SameSite=None y Secure=true para que la cookie se envíe en peticiones cross-site
        cookieOptions.sameSite = 'none';
        cookieOptions.secure = true;
        // No seteamos domain para que sea host-only (oceanix.space)
      } else {
        // CASO: Producción -> Producción O Local -> Local
        cookieOptions.sameSite = 'lax';

        if (!isBackendLocal) {
          // Producción
          cookieOptions.secure = true;
          // Extraer el dominio base para la cookie (ej: .oceanix.space) para soportar subdominios
          const domainParts = appDomain.split('.');
          if (domainParts.length >= 2) {
            const baseDomain = domainParts.slice(-2).join('.');
            cookieOptions.domain = `.${baseDomain}`;
          }
        } else {
          // Local Backend
          cookieOptions.secure = false;
        }
      }

      res.cookie('authToken', result.token, cookieOptions);
      this.logger.log(`✅ Authentication successful, redirecting to: ${redirectUrl}`);

      // Si el frontend es localhost, enviar token en URL para Bearer auth (localStorage)
      // Si es producción, solo usar cookie httpOnly (más seguro)
      if (isFrontendLocal) {
        res.redirect(`${redirectUrl}?token=${result.token}`);
      } else {
        res.redirect(redirectUrl);
      }

    } catch (error) {
      this.logger.error(`❌ Google OAuth callback error: ${error.message}`);

      const appDomain = this.configService.get('APP_DOMAIN') || 'oceanix.space';
      let targetDomain = appDomain;
      let isLocalhost = appDomain.includes('localhost');

      try {
        if (stateParam) {
          const stateDecoded = Buffer.from(stateParam, 'base64').toString('utf-8');
          const state = JSON.parse(stateDecoded);

          // Usar originDomain si está disponible (ya incluye el subdomain)
          if (state.originDomain) {
            targetDomain = state.originDomain;
            isLocalhost = state.originDomain.includes('localhost');
          } else {
            // Fallback: construir dominio con subdomain
            const baseDomain = appDomain;
            isLocalhost = baseDomain.includes('localhost');

            if (state.subdomain && !isLocalhost) {
              targetDomain = `${state.subdomain}.${baseDomain}`;
            } else {
              targetDomain = baseDomain;
            }
          }
        }
      } catch (e) {
        this.logger.warn('Could not parse state parameter for error redirect');
      }

      const errorMessage = encodeURIComponent(error.message || 'google_auth_failed');
      const protocol = isLocalhost ? 'http' : 'https';
      res.redirect(`${protocol}://${targetDomain}/portal/login?error=${errorMessage}`);
    }
  }

  @VerifyEmailDoc()
  @Throttle({ default: { limit: 10, ttl: 3600000 } })
  @Post('verify-email')
  verifyEmail(@Body() verifyEmailCodeDto: VerifyEmailCodeDto) {
    return this.authService.verifyEmail(verifyEmailCodeDto.email, verifyEmailCodeDto.code);
  }

  @ResendVerificationDoc()
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @Post('resend-verification')
  resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerificationEmail(body.email);
  }

  @LogoutDoc()
  @SkipThrottle()
  @Post('logout')
  logout(
    @Res({ passthrough: true }) res: Response
  ): { message: string } {
    CookieHelper.clearAuthCookie(res);
    return { message: 'Logout exitoso' };
  }

  @CheckSessionDoc()
  @Get('check')
  @Auth()
  @ApiBearerAuth()
  checkSession() {
    return;
  }

  @Get('me')
  @Auth()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Returns complete user profile including permissions, roles, enterprise info, and configuration. Used by frontend to configure the application for the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token',
  })
  async getMe(@GetUser() user: User): Promise<UserProfileResponseDto> {
    return await this.authService.getUserProfile(user);
  }
}
