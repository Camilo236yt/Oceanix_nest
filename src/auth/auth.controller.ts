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
    @Res() res: Response
  ) {
    try {
      // 1. Validar que tenemos code y state
      if (!code || !stateParam) {
        throw new BadRequestException('Missing code or state parameter');
      }

      this.logger.log(`📥 Received Google OAuth callback`);

      // 2. Decodificar el state parameter
      const stateDecoded = Buffer.from(stateParam, 'base64').toString('utf-8');
      const state = JSON.parse(stateDecoded);
      const { subdomain, returnPath } = state;

      if (!subdomain) {
        throw new BadRequestException('Invalid state parameter: missing subdomain');
      }

      this.logger.log(`🏢 Tenant subdomain: ${subdomain}`);

      // 3. Validar timestamp del state (máximo 10 minutos)
      if (state.timestamp) {
        const maxAge = 10 * 60 * 1000; // 10 minutos
        if (Date.now() - state.timestamp > maxAge) {
          throw new BadRequestException('State parameter expired');
        }
      }

      // 4. Intercambiar el código por el token de Google
      const googleToken = await this.authService.exchangeCodeForToken(code);

      if (!googleToken.id_token) {
        throw new BadRequestException('No se recibió id_token de Google');
      }

      // 5. Autenticar/registrar el usuario
      const result = await this.authService.googleLoginClient(
        { idToken: googleToken.id_token },
        subdomain
      );

      // 6. Construir URL de redirección al subdomain del tenant
      const appDomain = this.configService.get('APP_DOMAIN') || 'oceanix.space';
      const path = returnPath || '/portal/dashboard';
      const redirectUrl = `https://${subdomain}.${appDomain}${path}`;

      // 7. Setear cookie de autenticación
      // IMPORTANTE: La cookie debe ser para el dominio completo (.oceanix.space)
      // para que funcione en todos los subdominios
      // Usamos 'authToken' que es el nombre estándar en este proyecto
      res.cookie('authToken', result.token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        domain: `.${appDomain}`,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
        path: '/',
      });

      this.logger.log(`✅ Authentication successful, redirecting to: ${redirectUrl}`);

      // 8. Redirigir de vuelta al subdomain del tenant con el token en la URL
      res.redirect(`${redirectUrl}?token=${result.token}`);

    } catch (error) {
      this.logger.error(`❌ Google OAuth callback error: ${error.message}`);

      const appDomain = this.configService.get('APP_DOMAIN') || 'oceanix.space';
      let targetDomain = appDomain;

      // Intentar recuperar el subdomain para redirigir al tenant correcto en caso de error
      try {
        if (stateParam) {
          const stateDecoded = Buffer.from(stateParam, 'base64').toString('utf-8');
          const state = JSON.parse(stateDecoded);
          if (state.subdomain) {
            targetDomain = `${state.subdomain}.${appDomain}`;
          }
        }
      } catch (e) {
        this.logger.warn('Could not parse state parameter for error redirect');
      }

      const errorMessage = encodeURIComponent(error.message || 'google_auth_failed');
      // Redirigir al portal de login del subdominio específico
      res.redirect(`https://${targetDomain}/portal/login?error=${errorMessage}`);
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
