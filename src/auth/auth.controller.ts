import { Controller, Post, Body, UseFilters, Res, Req } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RegisterEnterpriseDto, GoogleLoginDto, ActivateAccountDto } from './dto';
import { VerifyEmailCodeDto } from 'src/email-verification/dto/verify-email-code.dto';
import type { AuthResponseDto } from './interfaces';
import { CustomBadRequestFilter } from './filters/custom-bad-request.filter';
import { CookieHelper } from './utils/cookie.helper';
import { AuthApiTags, RegisterDoc, LoginDoc, LoginDevDoc, GoogleLoginDoc, VerifyEmailDoc, ResendVerificationDoc, LogoutDoc } from './docs';
import { RegisterEnterpriseDoc } from '../enterprise/docs';
import { GetSubdomain } from '../common/decorators';

@AuthApiTags()
@Throttle({ default: { limit: 200, ttl: 60000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @RegisterEnterpriseDoc()
  @Throttle({ default: { limit: 200, ttl: 60000 } })
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
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<AuthResponseDto, 'token'>> {

    console.log('🔐 Activate account request:', {
      subdomain,
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      userAgent: req.headers['user-agent'],
    });

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
  @UseFilters(CustomBadRequestFilter)
  async login(
    @Body() loginDto: LoginDto,
    @GetSubdomain() subdomain: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<AuthResponseDto, 'token'>> {
    const result = await this.authService.login(loginDto, subdomain);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
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
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
    @Res({ passthrough: true }) res: Response
  ): Promise<Omit<AuthResponseDto, 'token'>> {
    const result = await this.authService.googleLogin(googleLoginDto);
    CookieHelper.setAuthCookie(res, result.token);

    const { token, ...responseWithoutToken } = result;
    return responseWithoutToken;
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
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    CookieHelper.clearAuthCookie(res);
    return { message: 'Logout exitoso' };
  }

}
